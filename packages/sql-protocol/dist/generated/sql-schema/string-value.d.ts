import * as flatbuffers from 'flatbuffers';
export declare class StringValue {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): StringValue;
    static getRootAsStringValue(bb: flatbuffers.ByteBuffer, obj?: StringValue): StringValue;
    static getSizePrefixedRootAsStringValue(bb: flatbuffers.ByteBuffer, obj?: StringValue): StringValue;
    value(): string | null;
    value(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startStringValue(builder: flatbuffers.Builder): void;
    static addValue(builder: flatbuffers.Builder, valueOffset: flatbuffers.Offset): void;
    static endStringValue(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createStringValue(builder: flatbuffers.Builder, valueOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=string-value.d.ts.map