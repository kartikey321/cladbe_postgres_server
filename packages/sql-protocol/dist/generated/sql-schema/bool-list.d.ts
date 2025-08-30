import * as flatbuffers from 'flatbuffers';
export declare class BoolList {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): BoolList;
    static getRootAsBoolList(bb: flatbuffers.ByteBuffer, obj?: BoolList): BoolList;
    static getSizePrefixedRootAsBoolList(bb: flatbuffers.ByteBuffer, obj?: BoolList): BoolList;
    values(index: number): boolean | null;
    valuesLength(): number;
    valuesArray(): Int8Array | null;
    static startBoolList(builder: flatbuffers.Builder): void;
    static addValues(builder: flatbuffers.Builder, valuesOffset: flatbuffers.Offset): void;
    static createValuesVector(builder: flatbuffers.Builder, data: boolean[]): flatbuffers.Offset;
    static startValuesVector(builder: flatbuffers.Builder, numElems: number): void;
    static endBoolList(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createBoolList(builder: flatbuffers.Builder, valuesOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=bool-list.d.ts.map