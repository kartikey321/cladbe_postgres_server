import * as flatbuffers from 'flatbuffers';
import { BasicSqlDataFilterWrapper } from '../sql-schema/basic-sql-data-filter-wrapper.js';
import { CursorEntry } from '../sql-schema/cursor-entry.js';
import { OrderKeySpec } from '../sql-schema/order-key-spec.js';
export declare class SqlQuerySpec {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): SqlQuerySpec;
    static getRootAsSqlQuerySpec(bb: flatbuffers.ByteBuffer, obj?: SqlQuerySpec): SqlQuerySpec;
    static getSizePrefixedRootAsSqlQuerySpec(bb: flatbuffers.ByteBuffer, obj?: SqlQuerySpec): SqlQuerySpec;
    wrapper(obj?: BasicSqlDataFilterWrapper): BasicSqlDataFilterWrapper | null;
    limit(): number;
    order(index: number, obj?: OrderKeySpec): OrderKeySpec | null;
    orderLength(): number;
    cursor(index: number, obj?: CursorEntry): CursorEntry | null;
    cursorLength(): number;
    strictAfter(): boolean;
    static startSqlQuerySpec(builder: flatbuffers.Builder): void;
    static addWrapper(builder: flatbuffers.Builder, wrapperOffset: flatbuffers.Offset): void;
    static addLimit(builder: flatbuffers.Builder, limit: number): void;
    static addOrder(builder: flatbuffers.Builder, orderOffset: flatbuffers.Offset): void;
    static createOrderVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startOrderVector(builder: flatbuffers.Builder, numElems: number): void;
    static addCursor(builder: flatbuffers.Builder, cursorOffset: flatbuffers.Offset): void;
    static createCursorVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startCursorVector(builder: flatbuffers.Builder, numElems: number): void;
    static addStrictAfter(builder: flatbuffers.Builder, strictAfter: boolean): void;
    static endSqlQuerySpec(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createSqlQuerySpec(builder: flatbuffers.Builder, wrapperOffset: flatbuffers.Offset, limit: number, orderOffset: flatbuffers.Offset, cursorOffset: flatbuffers.Offset, strictAfter: boolean): flatbuffers.Offset;
}
//# sourceMappingURL=sql-query-spec.d.ts.map