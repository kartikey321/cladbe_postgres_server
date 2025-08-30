import * as flatbuffers from 'flatbuffers';
export declare class NullValue {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): NullValue;
    static getRootAsNullValue(bb: flatbuffers.ByteBuffer, obj?: NullValue): NullValue;
    static getSizePrefixedRootAsNullValue(bb: flatbuffers.ByteBuffer, obj?: NullValue): NullValue;
    static startNullValue(builder: flatbuffers.Builder): void;
    static endNullValue(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createNullValue(builder: flatbuffers.Builder): flatbuffers.Offset;
}
//# sourceMappingURL=null-value.d.ts.map