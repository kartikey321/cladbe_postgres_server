import * as flatbuffers from 'flatbuffers';
export declare class BoolValue {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): BoolValue;
    static getRootAsBoolValue(bb: flatbuffers.ByteBuffer, obj?: BoolValue): BoolValue;
    static getSizePrefixedRootAsBoolValue(bb: flatbuffers.ByteBuffer, obj?: BoolValue): BoolValue;
    value(): boolean;
    static startBoolValue(builder: flatbuffers.Builder): void;
    static addValue(builder: flatbuffers.Builder, value: boolean): void;
    static endBoolValue(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createBoolValue(builder: flatbuffers.Builder, value: boolean): flatbuffers.Offset;
}
//# sourceMappingURL=bool-value.d.ts.map