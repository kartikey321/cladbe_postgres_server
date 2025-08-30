import * as flatbuffers from 'flatbuffers';
export declare class Int64List {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): Int64List;
    static getRootAsInt64List(bb: flatbuffers.ByteBuffer, obj?: Int64List): Int64List;
    static getSizePrefixedRootAsInt64List(bb: flatbuffers.ByteBuffer, obj?: Int64List): Int64List;
    values(index: number): bigint | null;
    valuesLength(): number;
    static startInt64List(builder: flatbuffers.Builder): void;
    static addValues(builder: flatbuffers.Builder, valuesOffset: flatbuffers.Offset): void;
    static createValuesVector(builder: flatbuffers.Builder, data: bigint[]): flatbuffers.Offset;
    static startValuesVector(builder: flatbuffers.Builder, numElems: number): void;
    static endInt64List(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createInt64List(builder: flatbuffers.Builder, valuesOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=int64-list.d.ts.map