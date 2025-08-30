import * as flatbuffers from 'flatbuffers';
import { BasicSqlDataFilterWrapper } from '../sql-schema/basic-sql-data-filter-wrapper.js';
import { CursorEntry } from '../sql-schema/cursor-entry.js';
import { OrderKeySpec } from '../sql-schema/order-key-spec.js';
export declare class StreamingSqlDataFilter {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): StreamingSqlDataFilter;
    static getRootAsStreamingSqlDataFilter(bb: flatbuffers.ByteBuffer, obj?: StreamingSqlDataFilter): StreamingSqlDataFilter;
    static getSizePrefixedRootAsStreamingSqlDataFilter(bb: flatbuffers.ByteBuffer, obj?: StreamingSqlDataFilter): StreamingSqlDataFilter;
    hash(): string | null;
    hash(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    wrapper(obj?: BasicSqlDataFilterWrapper): BasicSqlDataFilterWrapper | null;
    limit(): number;
    order(index: number, obj?: OrderKeySpec): OrderKeySpec | null;
    orderLength(): number;
    cursor(index: number, obj?: CursorEntry): CursorEntry | null;
    cursorLength(): number;
    schemaVersion(): number;
    static startStreamingSqlDataFilter(builder: flatbuffers.Builder): void;
    static addHash(builder: flatbuffers.Builder, hashOffset: flatbuffers.Offset): void;
    static addWrapper(builder: flatbuffers.Builder, wrapperOffset: flatbuffers.Offset): void;
    static addLimit(builder: flatbuffers.Builder, limit: number): void;
    static addOrder(builder: flatbuffers.Builder, orderOffset: flatbuffers.Offset): void;
    static createOrderVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startOrderVector(builder: flatbuffers.Builder, numElems: number): void;
    static addCursor(builder: flatbuffers.Builder, cursorOffset: flatbuffers.Offset): void;
    static createCursorVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startCursorVector(builder: flatbuffers.Builder, numElems: number): void;
    static addSchemaVersion(builder: flatbuffers.Builder, schemaVersion: number): void;
    static endStreamingSqlDataFilter(builder: flatbuffers.Builder): flatbuffers.Offset;
    static finishStreamingSqlDataFilterBuffer(builder: flatbuffers.Builder, offset: flatbuffers.Offset): void;
    static finishSizePrefixedStreamingSqlDataFilterBuffer(builder: flatbuffers.Builder, offset: flatbuffers.Offset): void;
}
//# sourceMappingURL=streaming-sql-data-filter.d.ts.map