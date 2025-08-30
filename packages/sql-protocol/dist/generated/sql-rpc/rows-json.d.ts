import * as flatbuffers from 'flatbuffers';
export declare class RowsJson {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): RowsJson;
    static getRootAsRowsJson(bb: flatbuffers.ByteBuffer, obj?: RowsJson): RowsJson;
    static getSizePrefixedRootAsRowsJson(bb: flatbuffers.ByteBuffer, obj?: RowsJson): RowsJson;
    rows(index: number): string;
    rows(index: number, optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
    rowsLength(): number;
    static startRowsJson(builder: flatbuffers.Builder): void;
    static addRows(builder: flatbuffers.Builder, rowsOffset: flatbuffers.Offset): void;
    static createRowsVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startRowsVector(builder: flatbuffers.Builder, numElems: number): void;
    static endRowsJson(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createRowsJson(builder: flatbuffers.Builder, rowsOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=rows-json.d.ts.map