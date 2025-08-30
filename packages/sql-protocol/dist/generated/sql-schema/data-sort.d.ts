import * as flatbuffers from 'flatbuffers';
export declare class DataSort {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): DataSort;
    static getRootAsDataSort(bb: flatbuffers.ByteBuffer, obj?: DataSort): DataSort;
    static getSizePrefixedRootAsDataSort(bb: flatbuffers.ByteBuffer, obj?: DataSort): DataSort;
    field(): string | null;
    field(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    ascending(): boolean;
    static startDataSort(builder: flatbuffers.Builder): void;
    static addField(builder: flatbuffers.Builder, fieldOffset: flatbuffers.Offset): void;
    static addAscending(builder: flatbuffers.Builder, ascending: boolean): void;
    static endDataSort(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createDataSort(builder: flatbuffers.Builder, fieldOffset: flatbuffers.Offset, ascending: boolean): flatbuffers.Offset;
}
//# sourceMappingURL=data-sort.d.ts.map