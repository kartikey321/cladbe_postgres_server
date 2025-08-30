import * as flatbuffers from 'flatbuffers';
export declare class StringList {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): StringList;
    static getRootAsStringList(bb: flatbuffers.ByteBuffer, obj?: StringList): StringList;
    static getSizePrefixedRootAsStringList(bb: flatbuffers.ByteBuffer, obj?: StringList): StringList;
    values(index: number): string;
    values(index: number, optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
    valuesLength(): number;
    static startStringList(builder: flatbuffers.Builder): void;
    static addValues(builder: flatbuffers.Builder, valuesOffset: flatbuffers.Offset): void;
    static createValuesVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startValuesVector(builder: flatbuffers.Builder, numElems: number): void;
    static endStringList(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createStringList(builder: flatbuffers.Builder, valuesOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=string-list.d.ts.map