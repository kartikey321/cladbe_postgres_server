import * as flatbuffers from 'flatbuffers';
export declare class Float64List {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): Float64List;
    static getRootAsFloat64List(bb: flatbuffers.ByteBuffer, obj?: Float64List): Float64List;
    static getSizePrefixedRootAsFloat64List(bb: flatbuffers.ByteBuffer, obj?: Float64List): Float64List;
    values(index: number): number | null;
    valuesLength(): number;
    valuesArray(): Float64Array | null;
    static startFloat64List(builder: flatbuffers.Builder): void;
    static addValues(builder: flatbuffers.Builder, valuesOffset: flatbuffers.Offset): void;
    static createValuesVector(builder: flatbuffers.Builder, data: number[] | Float64Array): flatbuffers.Offset;
    /**
     * @deprecated This Uint8Array overload will be removed in the future.
     */
    static createValuesVector(builder: flatbuffers.Builder, data: number[] | Uint8Array): flatbuffers.Offset;
    static startValuesVector(builder: flatbuffers.Builder, numElems: number): void;
    static endFloat64List(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createFloat64List(builder: flatbuffers.Builder, valuesOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=float64-list.d.ts.map