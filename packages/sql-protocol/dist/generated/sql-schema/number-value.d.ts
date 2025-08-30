import * as flatbuffers from 'flatbuffers';
export declare class NumberValue {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): NumberValue;
    static getRootAsNumberValue(bb: flatbuffers.ByteBuffer, obj?: NumberValue): NumberValue;
    static getSizePrefixedRootAsNumberValue(bb: flatbuffers.ByteBuffer, obj?: NumberValue): NumberValue;
    value(): number;
    static startNumberValue(builder: flatbuffers.Builder): void;
    static addValue(builder: flatbuffers.Builder, value: number): void;
    static endNumberValue(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createNumberValue(builder: flatbuffers.Builder, value: number): flatbuffers.Offset;
}
//# sourceMappingURL=number-value.d.ts.map