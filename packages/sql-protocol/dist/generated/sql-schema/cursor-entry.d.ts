import * as flatbuffers from 'flatbuffers';
import { FilterValue } from '../sql-schema/filter-value.js';
export declare class CursorEntry {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): CursorEntry;
    static getRootAsCursorEntry(bb: flatbuffers.ByteBuffer, obj?: CursorEntry): CursorEntry;
    static getSizePrefixedRootAsCursorEntry(bb: flatbuffers.ByteBuffer, obj?: CursorEntry): CursorEntry;
    field(): string | null;
    field(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    valueType(): FilterValue;
    value<T extends flatbuffers.Table>(obj: any): any | null;
    static startCursorEntry(builder: flatbuffers.Builder): void;
    static addField(builder: flatbuffers.Builder, fieldOffset: flatbuffers.Offset): void;
    static addValueType(builder: flatbuffers.Builder, valueType: FilterValue): void;
    static addValue(builder: flatbuffers.Builder, valueOffset: flatbuffers.Offset): void;
    static endCursorEntry(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createCursorEntry(builder: flatbuffers.Builder, fieldOffset: flatbuffers.Offset, valueType: FilterValue, valueOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=cursor-entry.d.ts.map