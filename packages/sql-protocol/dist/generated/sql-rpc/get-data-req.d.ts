import * as flatbuffers from 'flatbuffers';
import { BasicSqlDataFilterWrapper } from '../sql-schema/basic-sql-data-filter-wrapper.js';
import { CursorEntry } from '../sql-schema/cursor-entry.js';
import { OrderKeySpec } from '../sql-schema/order-key-spec.js';
export declare class GetDataReq {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): GetDataReq;
    static getRootAsGetDataReq(bb: flatbuffers.ByteBuffer, obj?: GetDataReq): GetDataReq;
    static getSizePrefixedRootAsGetDataReq(bb: flatbuffers.ByteBuffer, obj?: GetDataReq): GetDataReq;
    companyId(): string | null;
    companyId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    tableName(): string | null;
    tableName(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    wrapper(obj?: BasicSqlDataFilterWrapper): BasicSqlDataFilterWrapper | null;
    limit(): number;
    offset(): number;
    order(index: number, obj?: OrderKeySpec): OrderKeySpec | null;
    orderLength(): number;
    cursor(index: number, obj?: CursorEntry): CursorEntry | null;
    cursorLength(): number;
    strictAfter(): boolean;
    static startGetDataReq(builder: flatbuffers.Builder): void;
    static addCompanyId(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset): void;
    static addTableName(builder: flatbuffers.Builder, tableNameOffset: flatbuffers.Offset): void;
    static addWrapper(builder: flatbuffers.Builder, wrapperOffset: flatbuffers.Offset): void;
    static addLimit(builder: flatbuffers.Builder, limit: number): void;
    static addOffset(builder: flatbuffers.Builder, offset: number): void;
    static addOrder(builder: flatbuffers.Builder, orderOffset: flatbuffers.Offset): void;
    static createOrderVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startOrderVector(builder: flatbuffers.Builder, numElems: number): void;
    static addCursor(builder: flatbuffers.Builder, cursorOffset: flatbuffers.Offset): void;
    static createCursorVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startCursorVector(builder: flatbuffers.Builder, numElems: number): void;
    static addStrictAfter(builder: flatbuffers.Builder, strictAfter: boolean): void;
    static endGetDataReq(builder: flatbuffers.Builder): flatbuffers.Offset;
}
//# sourceMappingURL=get-data-req.d.ts.map