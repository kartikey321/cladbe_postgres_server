import * as flatbuffers from 'flatbuffers';
export declare class RowJson {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): RowJson;
    static getRootAsRowJson(bb: flatbuffers.ByteBuffer, obj?: RowJson): RowJson;
    static getSizePrefixedRootAsRowJson(bb: flatbuffers.ByteBuffer, obj?: RowJson): RowJson;
    row(): string | null;
    row(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startRowJson(builder: flatbuffers.Builder): void;
    static addRow(builder: flatbuffers.Builder, rowOffset: flatbuffers.Offset): void;
    static endRowJson(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createRowJson(builder: flatbuffers.Builder, rowOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=row-json.d.ts.map