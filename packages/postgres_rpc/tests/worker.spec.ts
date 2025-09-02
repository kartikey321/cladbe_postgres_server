// packages/postgres_rpc/tests/worker.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as flatbuffers from 'flatbuffers';
import { SqlRpc as sr, SqlSchema as sc } from '@cladbe/sql-protocol';

// ---------- hoisted shared state (safe with Vitest hoisting) ----------
const H = vi.hoisted(() => ({
  bus: {
    handler: undefined as undefined | ((msg: any) => Promise<void>),
    sent: [] as Array<{ topic: string; key: string; value: Buffer }>,
  },
  pm: {
    getData: vi.fn(),
    editData: vi.fn(),
    deleteRequest: vi.fn(),
    tableExists: vi.fn(),
    runAggregationQuery: vi.fn(),
  }
}));

// ---------- mocks (use H.bus / H.pm inside) ----------
// must match worker's `import { RpcKafka } from './kafka.js'`
vi.mock('../src/rpc/kafka.js', () => {
  return {
    RpcKafka: class {
      constructor(_cfg: any) { }
      setHandler(fn: any) { H.bus.handler = fn; }
      async start() { }
      stop() { }
      produceSafe(topic: string, key: string, value: Buffer) {
        H.bus.sent.push({ topic, key, value });
      }
    }
  };
});

// must match worker's import from '@cladbe/postgres_manager'
vi.mock('@cladbe/postgres_manager', () => {
  class GetDataDbRequest { constructor(public p: any) { } }
  class GetSingleRecordRequest { constructor(public p: any) { } }
  class AddSingleDbRequest { constructor(public p: any) { } }
  class UpdateSingleDbRequest { constructor(public p: any) { } }
  class DeleteRowDbRequest { constructor(public p: any) { } }
  class CreateTableDbRequest { constructor(public p: any) { } }
  class TableExistsRequest { constructor(public p: any) { } }
  class AggregationRequest { constructor(public p: any) { } }
  const OrderSort = { ASC_DEFAULT: 0, DESC_DEFAULT: 3 };

  return {
    PostgresManager: { getInstance: () => H.pm },
    GetDataDbRequest,
    GetSingleRecordRequest,
    AddSingleDbRequest,
    UpdateSingleDbRequest,
    DeleteRowDbRequest,
    CreateTableDbRequest,
    TableExistsRequest,
    AggregationRequest,
    OrderSort,
  };
});

// ---------- import worker AFTER mocks ----------
import { startRpcWorker } from '../src/rpc/worker';

beforeEach(() => {
  // Do not clear handler; worker sets it at import time.
  H.bus.sent.length = 0;

  H.pm.getData.mockReset();
  H.pm.editData.mockReset();
  H.pm.deleteRequest.mockReset();
  H.pm.tableExists.mockReset();
  H.pm.runAggregationQuery.mockReset();
});

/* ------------------------------------------------------------------ *
 * 1) Basic GET_DATA (legacy fields only)                             *
 * ------------------------------------------------------------------ */
describe('worker GET_DATA wiring', () => {
  it('calls PostgresManager.getData and produces RowsJson', async () => {
    H.pm.getData.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await startRpcWorker();
    expect(typeof H.bus.handler).toBe('function');

    // build *legacy* envelope (no wrapper/cursor)
    const reqBuf = buildGetDataEnvelope({
      companyId: 'a',
      tableName: 'notes',
      limit: 2,
      offset: 0,
      corr: 'corr-1',
      replyTopic: 'sql.rpc.responses.test',
    });

    await H.bus.handler!({ value: reqBuf });

    expect(H.bus.sent).toHaveLength(1);
    const produced = H.bus.sent[0];
    expect(produced.topic).toBe('sql.rpc.responses.test');
    expect(produced.key).toBe('corr-1');

    const env = readEnv(produced.value);
    expect(env.ok()).toBe(true);
    expect(env.dataType()).toBe(sr.SqlRpc.RpcResponse.RowsJson);

    const rowsTbl = new sr.SqlRpc.RowsJson();
    // @ts-ignore union payload
    env.data(rowsTbl);
    expect(rowsTbl.rowsLength()).toBe(2);

    // verify manager request shape (mock stores ctor arg on `.p`)
    const mgrReqArg = H.pm.getData.mock.calls.at(-1)![0];
    expect(mgrReqArg).toBeTruthy();
    expect(mgrReqArg.p.tableName).toBe('notes');
    expect(mgrReqArg.p.companyId).toBe('a');
    expect(mgrReqArg.p.limit).toBe(2);
  });
});

/* ------------------------------------------------------------------ *
 * 2) GET_DATA with wrapper + cursor + order + strictAfter            *
 * ------------------------------------------------------------------ */
describe('worker GET_DATA with wrapper/cursor/order', () => {
  it('maps wrapper/cursor/order/strictAfter into manager request', async () => {
    H.pm.getData.mockResolvedValue([{ id: 10 }]);

    await startRpcWorker();
    expect(typeof H.bus.handler).toBe('function');

    const reqBuf = buildGetDataEnvelopeWithSpec({
      companyId: 'demo',
      tableName: 'a_notes',
      limit: 25,
      strictAfter: false, // override default
      cursor: { field: 'updated_at', stringValue: '2025-01-01T00:00:00Z' },      // wrapper: status = 'open'
      filter: { field: 'status', equalsString: 'open' },
      corr: 'c2',
      replyTopic: 'sql.rpc.responses.x',
    });

    await H.bus.handler!({ value: reqBuf });

    // verify production
    expect(H.bus.sent).toHaveLength(1);
    const env = readEnv(H.bus.sent[0].value);
    expect(env.ok()).toBe(true);
    expect(env.dataType()).toBe(sr.SqlRpc.RpcResponse.RowsJson);

    // verify mapped manager request
    const mgrReqArg = H.pm.getData.mock.calls.at(-1)![0];
    expect(mgrReqArg).toBeTruthy();
    const p = mgrReqArg.p;
    expect(p.tableName).toBe('a_notes');
    expect(p.companyId).toBe('demo');
    expect(p.limit).toBe(25);
    expect(p.strictAfter).toBe(false);

    // orderKeys omitted in this request
    expect(p.orderKeys).toBeUndefined();

    // cursor
    expect(p.cursor).toEqual({ updated_at: '2025-01-01T00:00:00Z' });

    // filters wrapper -> expect single AND with a single equals filter
    expect(Array.isArray(p.filters)).toBe(true);
    expect(p.filters?.[0]?.filters?.length).toBe(1);
    const leaf = p.filters[0].filters[0];
    expect(leaf.fieldName).toBe('status');
    expect(leaf.value).toBe('open');
  });
});

/* ------------------------------------------------------------------ *
 * 3) GET_DATA error path                                             *
 * ------------------------------------------------------------------ */
describe('worker GET_DATA error path', () => {
  it('returns ok=false with INTERNAL error when manager throws', async () => {
    H.pm.getData.mockRejectedValue(new Error('boom'));

    await startRpcWorker();
    const reqBuf = buildGetDataEnvelope({
      companyId: 'x',
      tableName: 't',
      corr: 'err-1',
      replyTopic: 'sql.rpc.responses.err',
    });

    await H.bus.handler!({ value: reqBuf });

    expect(H.bus.sent).toHaveLength(1);
    const env = readEnv(H.bus.sent[0].value);
    expect(env.ok()).toBe(false);
    expect(env.errorCode()).toBe(sr.SqlRpc.ErrorCode.INTERNAL);
    expect(env.errorMessage()).toContain('boom');
  });
});

/* ------------------------------------------------------------------ *
 * 4) GET_SINGLE happy path                                           *
 * ------------------------------------------------------------------ */
describe('worker GET_SINGLE wiring', () => {
  it('returns RowJson for a found row', async () => {
    H.pm.getData.mockResolvedValue({ id: 42, name: 'row' });

    await startRpcWorker();
    const reqBuf = buildGetSingleEnvelope({
      companyId: 'demo',
      tableName: 'a_notes',
      primaryKeyColumn: 'id',
      primaryId: '42',
      corr: 'gs-1',
      replyTopic: 'sql.rpc.responses.s',
    });

    await H.bus.handler!({ value: reqBuf });

    const env = readEnv(H.bus.sent[0].value);
    expect(env.ok()).toBe(true);
    expect(env.dataType()).toBe(sr.SqlRpc.RpcResponse.RowJson);
  });
});

/* ------------------------------------------------------------------ *
 * 5) DELETE_ROW happy path                                           *
 * ------------------------------------------------------------------ */
describe('worker DELETE_ROW wiring', () => {
  it('returns BoolRes(true) when deleteRequest resolves with array>0', async () => {
    H.pm.deleteRequest.mockResolvedValue([{ id: 99 }]);

    await startRpcWorker();
    const reqBuf = buildDeleteRowEnvelope({
      companyId: 'demo',
      tableName: 'a_notes',
      primaryKeyColumn: 'id',
      primaryId: '99',
      corr: 'del-1',
      replyTopic: 'sql.rpc.responses.del',
    });

    await H.bus.handler!({ value: reqBuf });

    const env = readEnv(H.bus.sent[0].value);
    expect(env.ok()).toBe(true);
    expect(env.dataType()).toBe(sr.SqlRpc.RpcResponse.BoolRes);
  });
});

/* ------------------------------------------------------------------ *
 * 6) TABLE_EXISTS happy path                                         *
 * ------------------------------------------------------------------ */
describe('worker TABLE_EXISTS wiring', () => {
  it('returns BoolRes(true) when table exists', async () => {
    H.pm.tableExists.mockResolvedValue(true);

    await startRpcWorker();
    const reqBuf = buildTableExistsEnvelope({
      companyId: 'demo',
      tableName: 'a_notes',
      corr: 'tx-1',
      replyTopic: 'sql.rpc.responses.tx',
    });

    await H.bus.handler!({ value: reqBuf });

    const env = readEnv(H.bus.sent[0].value);
    expect(env.ok()).toBe(true);
    expect(env.dataType()).toBe(sr.SqlRpc.RpcResponse.BoolRes);
  });
});

/* ------------------------------------------------------------------ *
 * 7) RUN_AGGREGATION happy path (placeholder response)               *
 * ------------------------------------------------------------------ */
describe('worker RUN_AGGREGATION wiring', () => {
  it('calls runAggregationQuery and returns AggRes placeholder', async () => {
    H.pm.runAggregationQuery.mockResolvedValue({ count: 123 });

    await startRpcWorker();
    const reqBuf = buildRunAggregationEnvelope({
      companyId: 'demo',
      tableName: 'a_notes',
      corr: 'agg-1',
      replyTopic: 'sql.rpc.responses.agg',
    });

    await H.bus.handler!({ value: reqBuf });

    const env = readEnv(H.bus.sent[0].value);
    expect(env.ok()).toBe(true);
    expect(env.dataType()).toBe(sr.SqlRpc.RpcResponse.AggRes); // placeholder
  });
});

/* ====================== helper builders / readers ====================== */

function readEnv(buf: Buffer) {
  const bb = new flatbuffers.ByteBuffer(
    new Uint8Array(buf.buffer, buf.byteOffset, buf.length)
  );
  return sr.SqlRpc.ResponseEnvelope.getRootAsResponseEnvelope(bb);
}

function buildGetDataEnvelope(opts: {
  companyId: string;
  tableName: string;
  limit?: number;
  offset?: number;
  corr: string;
  replyTopic: string;
}): Buffer {
  const b = new flatbuffers.Builder(256);
  const cid = b.createString(opts.companyId);
  const tname = b.createString(opts.tableName);

  const gd = sr.SqlRpc.GetDataReq;
  gd.startGetDataReq(b);
  gd.addCompanyId(b, cid);
  gd.addTableName(b, tname);
  if (opts.limit != null) gd.addLimit(b, opts.limit);
  if (opts.offset != null) gd.addOffset(b, opts.offset);
  const getDataOff = gd.endGetDataReq(b);

  return finishEnvelope(b, sr.SqlRpc.RpcMethod.GET_DATA, sr.SqlRpc.RpcPayload.GetDataReq, getDataOff, opts);
}

// FIXED: create strings before starting the tables that use them
// make order optional, add optional limit/offset, allow cursor single or array
function buildGetDataEnvelopeWithSpec(opts: {
  companyId: string;
  tableName: string;

  // filter leaf: status == <equalsString>
  filter: { field: string; equalsString: string };

  // optional order
  order?: { field: string; sort: number; isPk?: boolean };

  // cursor can be one entry or many
  cursor: { field: string; stringValue: string } | Array<{ field: string; stringValue: string }>;

  strictAfter: boolean;

  // NEW: optional legacy paging fields
  limit?: number;
  offset?: number;

  corr: string;
  replyTopic: string;
}): Buffer {
  const b = new flatbuffers.Builder(512);

  // ---------- strings first ----------
  const companyIdOff = b.createString(opts.companyId);
  const tableNameOff = b.createString(opts.tableName);
  const filterFieldOff = b.createString(opts.filter.field);
  const filterValStr = b.createString(opts.filter.equalsString);

  // ---------- filter leaf ----------
  sc.SqlSchema.StringValue.startStringValue(b);
  sc.SqlSchema.StringValue.addValue(b, filterValStr);
  const filterStrValOff = sc.SqlSchema.StringValue.endStringValue(b);

  sc.SqlSchema.BasicSqlDataFilter.startBasicSqlDataFilter(b);
  sc.SqlSchema.BasicSqlDataFilter.addFieldName(b, filterFieldOff);
  sc.SqlSchema.BasicSqlDataFilter.addValueType(b, sc.SqlSchema.FilterValue.StringValue);
  sc.SqlSchema.BasicSqlDataFilter.addValue(b, filterStrValOff);
  sc.SqlSchema.BasicSqlDataFilter.addFilterType(b, sc.SqlSchema.BasicSqlDataFilterType.equals);
  const filterLeafOff = sc.SqlSchema.BasicSqlDataFilter.endBasicSqlDataFilter(b);

  const filtersTypeVec = sc.SqlSchema.BasicSqlDataFilterWrapper.createFiltersTypeVector(
    b, [sc.SqlSchema.BasicSqlDataFilterUnion.BasicSqlDataFilter]
  );
  const filtersValVec = sc.SqlSchema.BasicSqlDataFilterWrapper.createFiltersVector(b, [filterLeafOff]);

  sc.SqlSchema.BasicSqlDataFilterWrapper.startBasicSqlDataFilterWrapper(b);
  sc.SqlSchema.BasicSqlDataFilterWrapper.addFilterWrapperType(b, sc.SqlSchema.SQLFilterWrapperType.and);
  sc.SqlSchema.BasicSqlDataFilterWrapper.addFiltersType(b, filtersTypeVec);
  sc.SqlSchema.BasicSqlDataFilterWrapper.addFilters(b, filtersValVec);
  const wrapperOff = sc.SqlSchema.BasicSqlDataFilterWrapper.endBasicSqlDataFilterWrapper(b);

  // ---------- optional order ----------
  let orderVec = 0;
  if (opts.order) {
    const orderFieldOff = b.createString(opts.order.field);
    sc.SqlSchema.OrderKeySpec.startOrderKeySpec(b);
    sc.SqlSchema.OrderKeySpec.addField(b, orderFieldOff);
    sc.SqlSchema.OrderKeySpec.addSort(b, opts.order.sort);
    if (opts.order.isPk != null) sc.SqlSchema.OrderKeySpec.addIsPk(b, !!opts.order.isPk);
    const order0Off = sc.SqlSchema.OrderKeySpec.endOrderKeySpec(b);
    orderVec = sr.SqlRpc.GetDataReq.createOrderVector(b, [order0Off]);
  }

  // ---------- cursor (single or array) ----------
  const curs = Array.isArray(opts.cursor) ? opts.cursor : [opts.cursor];
  const cursorOffs: number[] = [];
  for (const c of curs) {
    const cursorFieldOff = b.createString(c.field);
    const cursorValStr = b.createString(c.stringValue);

    sc.SqlSchema.StringValue.startStringValue(b);
    sc.SqlSchema.StringValue.addValue(b, cursorValStr);
    const cursorStrValOff = sc.SqlSchema.StringValue.endStringValue(b);

    sc.SqlSchema.CursorEntry.startCursorEntry(b);
    sc.SqlSchema.CursorEntry.addField(b, cursorFieldOff);
    sc.SqlSchema.CursorEntry.addValueType(b, sc.SqlSchema.FilterValue.StringValue);
    sc.SqlSchema.CursorEntry.addValue(b, cursorStrValOff);
    cursorOffs.push(sc.SqlSchema.CursorEntry.endCursorEntry(b));
  }
  const cursorVec = sr.SqlRpc.GetDataReq.createCursorVector(b, cursorOffs);

  // ---------- GetDataReq ----------
  const gd = sr.SqlRpc.GetDataReq;
  gd.startGetDataReq(b);
  gd.addCompanyId(b, companyIdOff);
  gd.addTableName(b, tableNameOff);
  gd.addWrapper(b, wrapperOff);
  gd.addCursor(b, cursorVec);
  gd.addStrictAfter(b, opts.strictAfter);
  if (orderVec) gd.addOrder(b, orderVec);
  if (opts.limit != null) gd.addLimit(b, opts.limit);
  if (opts.offset != null) gd.addOffset(b, opts.offset);
  const getDataOff = gd.endGetDataReq(b);

  // ---------- envelope ----------
  const corrOff = b.createString(opts.corr);
  const replyOff = b.createString(opts.replyTopic);
  sr.SqlRpc.RequestEnvelope.startRequestEnvelope(b);
  sr.SqlRpc.RequestEnvelope.addCorrelationId(b, corrOff);
  sr.SqlRpc.RequestEnvelope.addReplyTopic(b, replyOff);
  sr.SqlRpc.RequestEnvelope.addMethod(b, sr.SqlRpc.RpcMethod.GET_DATA);
  sr.SqlRpc.RequestEnvelope.addPayloadType(b, sr.SqlRpc.RpcPayload.GetDataReq);
  sr.SqlRpc.RequestEnvelope.addPayload(b, getDataOff);
  const envOff = sr.SqlRpc.RequestEnvelope.endRequestEnvelope(b);
  b.finish(envOff);

  return Buffer.from(b.asUint8Array());
}

function buildGetSingleEnvelope(opts: {
  companyId: string;
  tableName: string;
  primaryKeyColumn: string;
  primaryId: string;
  corr: string;
  replyTopic: string;
}): Buffer {
  const b = new flatbuffers.Builder(256);
  const cid = b.createString(opts.companyId);
  const tname = b.createString(opts.tableName);
  const pkCol = b.createString(opts.primaryKeyColumn);
  const pkVal = b.createString(opts.primaryId);

  const g = sr.SqlRpc.GetSingleReq;
  g.startGetSingleReq(b);
  g.addCompanyId(b, cid);
  g.addTableName(b, tname);
  g.addPrimaryKeyColumn(b, pkCol);
  g.addPrimaryId(b, pkVal);
  const off = g.endGetSingleReq(b);

  return finishEnvelope(b, sr.SqlRpc.RpcMethod.GET_SINGLE, sr.SqlRpc.RpcPayload.GetSingleReq, off, opts);
}

function buildDeleteRowEnvelope(opts: {
  companyId: string;
  tableName: string;
  primaryKeyColumn: string;
  primaryId: string;
  corr: string;
  replyTopic: string;
}): Buffer {
  const b = new flatbuffers.Builder(256);
  const cid = b.createString(opts.companyId);
  const tname = b.createString(opts.tableName);
  const pkCol = b.createString(opts.primaryKeyColumn);
  const pkVal = b.createString(opts.primaryId);

  const d = sr.SqlRpc.DeleteRowReq;
  d.startDeleteRowReq(b);
  d.addCompanyId(b, cid);
  d.addTableName(b, tname);
  d.addPrimaryKeyColumn(b, pkCol);
  d.addPrimaryId(b, pkVal);
  const off = d.endDeleteRowReq(b);

  return finishEnvelope(b, sr.SqlRpc.RpcMethod.DELETE_ROW, sr.SqlRpc.RpcPayload.DeleteRowReq, off, opts);
}

function buildTableExistsEnvelope(opts: {
  companyId: string;
  tableName: string;
  corr: string;
  replyTopic: string;
}): Buffer {
  const b = new flatbuffers.Builder(256);
  const cid = b.createString(opts.companyId);
  const tname = b.createString(opts.tableName);

  const t = sr.SqlRpc.TableExistsReq;
  t.startTableExistsReq(b);
  t.addCompanyId(b, cid);
  t.addTableName(b, tname);
  const off = t.endTableExistsReq(b);

  return finishEnvelope(b, sr.SqlRpc.RpcMethod.TABLE_EXISTS, sr.SqlRpc.RpcPayload.TableExistsReq, off, opts);
}

function buildRunAggregationEnvelope(opts: {
  companyId: string;
  tableName: string;
  corr: string;
  replyTopic: string;
}): Buffer {
  const b = new flatbuffers.Builder(256);
  const cid = b.createString(opts.companyId);
  const tname = b.createString(opts.tableName);

  const a = sr.SqlRpc.RunAggregationReq;
  a.startRunAggregationReq(b);
  a.addCompanyId(b, cid);
  a.addTableName(b, tname);
  const off = a.endRunAggregationReq(b);

  return finishEnvelope(b, sr.SqlRpc.RpcMethod.RUN_AGGREGATION, sr.SqlRpc.RpcPayload.RunAggregationReq, off, opts);
}

function finishEnvelope(
  b: flatbuffers.Builder,
  method: number,
  payloadType: number,
  payloadOff: number,
  opts: { corr: string; replyTopic: string }
): Buffer {
  const corr = b.createString(opts.corr);
  const reply = b.createString(opts.replyTopic);
  sr.SqlRpc.RequestEnvelope.startRequestEnvelope(b);
  sr.SqlRpc.RequestEnvelope.addCorrelationId(b, corr);
  sr.SqlRpc.RequestEnvelope.addReplyTopic(b, reply);
  sr.SqlRpc.RequestEnvelope.addMethod(b, method);
  sr.SqlRpc.RequestEnvelope.addPayloadType(b, payloadType);
  sr.SqlRpc.RequestEnvelope.addPayload(b, payloadOff);
  const envOff = sr.SqlRpc.RequestEnvelope.endRequestEnvelope(b);
  b.finish(envOff);
  return Buffer.from(b.asUint8Array());
}