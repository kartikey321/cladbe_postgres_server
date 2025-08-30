import * as flatbuffers from 'flatbuffers';
export declare class BoolRes {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): BoolRes;
    static getRootAsBoolRes(bb: flatbuffers.ByteBuffer, obj?: BoolRes): BoolRes;
    static getSizePrefixedRootAsBoolRes(bb: flatbuffers.ByteBuffer, obj?: BoolRes): BoolRes;
    value(): boolean;
    static startBoolRes(builder: flatbuffers.Builder): void;
    static addValue(builder: flatbuffers.Builder, value: boolean): void;
    static endBoolRes(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createBoolRes(builder: flatbuffers.Builder, value: boolean): flatbuffers.Offset;
}
//# sourceMappingURL=bool-res.d.ts.map