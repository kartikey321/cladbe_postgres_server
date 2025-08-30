import * as flatbuffers from 'flatbuffers';
export declare class Int64Value {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): Int64Value;
    static getRootAsInt64Value(bb: flatbuffers.ByteBuffer, obj?: Int64Value): Int64Value;
    static getSizePrefixedRootAsInt64Value(bb: flatbuffers.ByteBuffer, obj?: Int64Value): Int64Value;
    value(): bigint;
    static startInt64Value(builder: flatbuffers.Builder): void;
    static addValue(builder: flatbuffers.Builder, value: bigint): void;
    static endInt64Value(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createInt64Value(builder: flatbuffers.Builder, value: bigint): flatbuffers.Offset;
}
//# sourceMappingURL=int64-value.d.ts.map