// src/rpc/sql-rpc.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import pkg from "node-rdkafka";
const { Producer, KafkaConsumer } = pkg;
import type { LibrdKafkaError, Message } from "node-rdkafka";
import { randomUUID } from "node:crypto";

import { SqlRpc as sr } from "@cladbe/sql-protocol";

// 🚦 use the codec for building requests & parsing responses
import {
  buildRequestBuffer,
  parseResponseBuffer,
  // types for payloads
  type RequestEnvelopeJson,
  type GetDataJson,
  type GetSingleJson,
  type AddSingleJson,
  type UpdateSingleJson,
  type DeleteRowJson,
  type CreateTableJson,
  type TableExistsJson,
  type RunAggregationJson,
  type TableDefinitionJson,
} from "@cladbe/sql-codec";

type Pending = {
  resolve: (v: any) => void;
  reject: (e: any) => void;
  timer: NodeJS.Timeout;
  method: number;
};

export type SqlRpcClientOpts = {
  brokers: string;
  requestTopic?: string;
  replyTopic: string;
  groupId?: string;
  timeoutMs?: number;
};

export class SqlRpcClient {
  private prod: InstanceType<typeof Producer>;
  private cons: InstanceType<typeof KafkaConsumer>;
  private pending = new Map<string, Pending>();
  private opts: Required<SqlRpcClientOpts>;

  constructor(opts: SqlRpcClientOpts) {
    this.opts = {
      requestTopic: "sql.rpc.requests",
      groupId: "ws-gateway-rpc",
      timeoutMs: 10_000,
      ...opts,
    } as Required<SqlRpcClientOpts>;

    this.prod = new Producer({
      "metadata.broker.list": this.opts.brokers,
      "client.id": "ws-gateway-sqlrpc",
      "socket.keepalive.enable": true,
      dr_cb: false,
    });

    this.cons = new KafkaConsumer(
      {
        "metadata.broker.list": this.opts.brokers,
        "group.id": this.opts.groupId,
        "enable.auto.commit": true,
        "allow.auto.create.topics": true,
        "socket.keepalive.enable": true,
        "client.id": "ws-gateway-sqlrpc",
      },
      { "auto.offset.reset": "latest" }
    );
  }

  async start() {
    await new Promise<void>((res, rej) => {
      this.prod
        .on("ready", () => {
          console.log("[sql-rpc] producer ready", {
            brokers: this.opts.brokers,
            requestTopic: this.opts.requestTopic,
          });
          res();
        })
        .on("event.error", (e: any) => {
          console.error("[sql-rpc] producer error", e);
          rej(e);
        })
        .connect();
    });

    await new Promise<void>((res) => {
      this.cons
        .on("ready", () => {
          console.log("[sql-rpc] consumer ready", {
            group: this.opts.groupId,
            replyTopic: this.opts.replyTopic,
            brokers: this.opts.brokers,
          });
          this.cons.subscribe([this.opts.replyTopic]);
          this.cons.consume();
          res();
        })
        .on("data", (m: Message) => this.onData(m))
        .on("event.error", (e: LibrdKafkaError) =>
          console.error("[sql-rpc] consumer error", e)
        );
      this.cons.connect();
    });
  }

  stop() {
    try {
      this.prod.disconnect();
    } catch {}
    try {
      this.cons.disconnect();
    } catch {}
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error("rpc shutdown"));
      this.pending.delete(id);
    }
  }

  // ---------- Consumer path (decode via codec) ----------
  private onData(m: Message) {
    if (!m.value) return;

    try {
      const buf = m.value as Buffer;
      const decoded = parseResponseBuffer(buf); // { correlationId, ok, errorCode, data? }

      const rec = this.pending.get(decoded.correlationId);
      if (!rec) return;

      if (!decoded.ok) {
        clearTimeout(rec.timer);
        this.pending.delete(decoded.correlationId);
        rec.reject(new Error(decoded.errorMessage || "rpc error"));
        return;
      }

      // Normalize to friendly JS shapes:
      // - RowsJson         -> rows[]
      // - RowJson          -> { ...row } | null
      // - RowsWithCursor   -> { rows, cursor }
      // - BoolRes          -> boolean
      // - AggRes           -> { count?, sumValues?, avgValues?, ... }
      let out: any = null;
      const d = decoded.data;

      if (d?.type === "RowsJson") {
        out = (d.rows || []).map((s) => JSON.parse(s));
      } else if (d?.type === "RowJson") {
        out = d.row ? JSON.parse(d.row) : null;
      } else if (d?.type === "RowsWithCursor") {
        out = {
          rows: (d.rows || []).map((s) => JSON.parse(s)),
          cursor: d.cursor || {},
        };
      } else if (d?.type === "BoolRes") {
        out = !!d.value;
      } else if (d?.type === "AggRes") {
        out = d.agg || {};
      }

      clearTimeout(rec.timer);
      this.pending.delete(decoded.correlationId);
      rec.resolve(out);
    } catch (e) {
      console.error("[sql-rpc] decode error", e);
    }
  }

  // ---------- Producer path (build via codec) ----------
  private sendViaCodec(req: RequestEnvelopeJson): Promise<any> {
    const corr = req.correlationId;

    return new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(corr);
        console.error("[sql-rpc] ✖ timeout", {
          corr,
          method: req.method,
          timeoutMs: this.opts.timeoutMs,
        });
        reject(new Error("rpc timeout"));
      }, this.opts.timeoutMs);

      this.pending.set(corr, {
        resolve,
        reject,
        timer,
        method: methodEnum(req.method),
      });

      try {
        const buf = buildRequestBuffer(req);
        this.prod.produce(this.opts.requestTopic, null, buf, corr);
        console.log("[sql-rpc] ⇒ send", {
          corr,
          method: req.method,
          topic: this.opts.requestTopic,
          replyTopic: this.opts.replyTopic,
          bytes: buf.byteLength,
        });
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(corr);
        reject(e);
      }
    });
  }

  // ======================================================
  // ===============  Public typed methods  ===============
  // ======================================================

  /** GET_DATA without explicit query spec (offset/limit path, strictAfter default true). */
  getDataSnapshot(
    companyId: string,
    tableName: string,
    limit = 500,
    offset = 0
  ): Promise<any> {
    const corr = cryptoRandomId();
    const payload: GetDataJson = {
      companyId,
      tableName,
      limit,
      offset,
      strictAfter: true,
    };

    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "GET_DATA",
      payload,
    });
  }

  /**
   * GET_DATA using a client JSON query (wrapper/order/cursor/limit).
   * Expects the same shape you publish to Streams; we translate it for the codec.
   */
  getDataSnapshotWithQueryJson(
    companyId: string,
    tableName: string,
    jsonSpec: string
  ): Promise<any> {
    const spec = safeParseJson(jsonSpec) || {};
    const corr = cryptoRandomId();

    const payload: GetDataJson = {
      companyId,
      tableName,
      strictAfter: true,
      limit: asU32(spec?.limit),
      // orderKeys: [{ field, sort }]
      orderKeys: Array.isArray(spec?.order)
        ? spec.order.map((o: any) => ({
            field: String(o.field || ""),
            sort: String(o.sort || "DESC_DEFAULT"),
          }))
        : undefined,
      // cursor: { field: value }
      cursor: cursorArrayToObject(spec?.cursor),
      // filters: [ wrapper ]
      filters: spec?.wrapper ? [wrapperToCodec(spec.wrapper)] : undefined,
    };

    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "GET_DATA",
      payload,
    });
  }

  /** GET_SINGLE by PK. Returns a single row object or null. */
  getSingle(
    companyId: string,
    tableName: string,
    primaryKeyColumn: string,
    primaryId: string
  ): Promise<any> {
    const corr = cryptoRandomId();
    const payload: GetSingleJson = {
      companyId,
      tableName,
      primaryKeyColumn,
      primaryId,
    };
    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "GET_SINGLE",
      payload,
    });
  }

  /** ADD_SINGLE: insert a single row (payload is raw JSON object). Returns BoolRes or RowJson depending on worker. */
  addSingle(
    companyId: string,
    tableName: string,
    primaryKeyColumn: string,
    data: Record<string, unknown>
  ): Promise<any> {
    const corr = cryptoRandomId();
    const payload: AddSingleJson = {
      companyId,
      tableName,
      primaryKeyColumn,
      data,
    };
    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "ADD_SINGLE",
      payload,
    });
  }

  /** UPDATE_SINGLE: patch a row by PK. Returns BoolRes or RowJson depending on worker. */
  updateSingle(
    companyId: string,
    tableName: string,
    primaryKeyColumn: string,
    primaryId: string,
    updates: Record<string, unknown>
  ): Promise<any> {
    const corr = cryptoRandomId();
    const payload: UpdateSingleJson = {
      companyId,
      tableName,
      primaryKeyColumn,
      primaryId,
      updates,
    };
    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "UPDATE_SINGLE",
      payload,
    });
  }

  /** DELETE_ROW by PK. Returns BoolRes. */
  deleteRow(
    companyId: string,
    tableName: string,
    primaryKeyColumn: string,
    primaryId: string
  ): Promise<any> {
    const corr = cryptoRandomId();
    const payload: DeleteRowJson = {
      companyId,
      tableName,
      primaryKeyColumn,
      primaryId,
    };
    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "DELETE_ROW",
      payload,
    });
  }

  /** CREATE_TABLE from a TableDefinition JSON. Returns BoolRes (worker-dependent) or nothing. */
  createTable(
    companyId: string,
    definition: TableDefinitionJson
  ): Promise<any> {
    const corr = cryptoRandomId();
    const payload: CreateTableJson = {
      companyId,
      definition,
    };
    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "CREATE_TABLE",
      payload,
    });
  }

  /** TABLE_EXISTS: true/false. */
  tableExists(companyId: string, tableName: string): Promise<boolean> {
    const corr = cryptoRandomId();
    const payload: TableExistsJson = {
      companyId,
      tableName,
    };
    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "TABLE_EXISTS",
      payload,
    });
  }

  /**
   * RUN_AGGREGATION: sum/avg/min/max/count with optional filters.
   * returns { count?, sumValues?, avgValues?, minimumValues?, maximumValues? }
   */
  runAggregation(args: {
    companyId: string;
    tableName: string;
    countEnabled?: boolean;
    sumFields?: string[];
    averageFields?: string[];
    minimumFields?: string[];
    maximumFields?: string[];
    /** wrapper JSON in the client shape (filter_wrapper_type/filters) */
    wrapper?: any;
  }): Promise<any> {
    const {
      companyId,
      tableName,
      countEnabled,
      sumFields,
      averageFields,
      minimumFields,
      maximumFields,
      wrapper,
    } = args;

    const corr = cryptoRandomId();
    const payload: RunAggregationJson = {
      companyId,
      tableName,
      countEnabled: !!countEnabled,
      sumFields,
      averageFields,
      minimumFields,
      maximumFields,
      // codec expects filters?: [ SqlDataFilterWrapper ]
      filters: wrapper ? [wrapperToCodec(wrapper)] : undefined,
    };
    return this.sendViaCodec({
      correlationId: corr,
      replyTopic: this.opts.replyTopic,
      method: "RUN_AGGREGATION",
      payload,
    });
  }

  // ---------------- Optional: generic passthrough ----------------
  /** Fire a raw envelope (when you already prepared a codec payload). */
  callRaw(envelope: RequestEnvelopeJson) {
    return this.sendViaCodec(envelope);
  }
}

// ---------- helpers ----------

function cryptoRandomId(): string {
  try {
    return randomUUID();
  } catch {
    /* fallback */
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function methodEnum(m: RequestEnvelopeJson["method"]): number {
  switch (m) {
    case "GET_DATA":
      return sr.SqlRpc.RpcMethod.GET_DATA;
    case "GET_SINGLE":
      return sr.SqlRpc.RpcMethod.GET_SINGLE;
    case "ADD_SINGLE":
      return sr.SqlRpc.RpcMethod.ADD_SINGLE;
    case "UPDATE_SINGLE":
      return sr.SqlRpc.RpcMethod.UPDATE_SINGLE;
    case "DELETE_ROW":
      return sr.SqlRpc.RpcMethod.DELETE_ROW;
    case "CREATE_TABLE":
      return sr.SqlRpc.RpcMethod.CREATE_TABLE;
    case "TABLE_EXISTS":
      return sr.SqlRpc.RpcMethod.TABLE_EXISTS;
    case "RUN_AGGREGATION":
      return sr.SqlRpc.RpcMethod.RUN_AGGREGATION;
    default:
      return 0;
  }
}

function safeParseJson(s: unknown): any {
  if (typeof s !== "string" || s.length === 0) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
function asU32(n: any): number | undefined {
  const v = Number(n);
  return Number.isFinite(v) ? v >>> 0 : undefined;
}

/** Convert the array-ish cursor [{field, value: Tagged}] to { field: plainValue } */
function cursorArrayToObject(
  arr: any
): Record<string, unknown> | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const out: Record<string, unknown> = {};
  for (const c of arr) {
    const f = String(c?.field || "");
    if (!f) continue;
    out[f] = taggedToPlain(c?.value);
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Convert the "StreamingSqlDataFilter.toMap()" style wrapper into the codec’s
 * SqlDataFilterWrapper/SqlDataFilter shapes.
 */
function wrapperToCodec(w: any): any {
  // wrapper: { filter_wrapper_type: "and"|"or", filters: [...] }
  const type = String(w?.filter_wrapper_type || "and");
  const filters = Array.isArray(w?.filters) ? w.filters : [];

  const codecFilters = filters.map((node: any) => {
    if (node?.filter_wrapper_type != null) {
      return wrapperToCodec(node);
    }
    // basic: { field_name, value: Tagged, filter_type }
    return {
      fieldName: String(node?.field_name || ""),
      value: taggedToPlain(node?.value),
      filterType: String(node?.filter_type || "equals"),
    };
  });

  return {
    filterWrapperType: type === "or" ? "or" : "and",
    filters: codecFilters,
  };
}

/** Tagged union { Kind: {...} } → plain JS value */
function taggedToPlain(tagged: any): unknown {
  if (!tagged || typeof tagged !== "object") return null;
  const [tag, payload] = Object.entries(tagged)[0] ?? [undefined, undefined];
  const p: any = payload ?? {};

  switch (tag) {
    case "StringValue":
      return String(p.value ?? "");
    case "NumberValue":
      return Number(p.value ?? 0);
    case "BoolValue":
      return !!p.value;
    case "NullValue":
      return null;
    case "Int64Value":
      return Number(p.value ?? 0);
    case "TimestampValue":
      return Number(p.epoch ?? 0);

    case "StringList":
      return Array.isArray(p.values)
        ? p.values.map((x: any) => String(x))
        : [];
    case "Int64List":
      return Array.isArray(p.values)
        ? p.values.map((x: any) => Number(x))
        : [];
    case "Float64List":
      return Array.isArray(p.values)
        ? p.values.map((x: any) => Number(x))
        : [];
    case "BoolList":
      return Array.isArray(p.values)
        ? p.values.map((x: any) => !!x)
        : [];

    default:
      return null;
  }
}