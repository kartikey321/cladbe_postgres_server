import * as flatbuffers from 'flatbuffers';
import { KeyValuePair } from '../sql-schema/key-value-pair.js';
export declare class CustomOptions {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): CustomOptions;
    static getRootAsCustomOptions(bb: flatbuffers.ByteBuffer, obj?: CustomOptions): CustomOptions;
    static getSizePrefixedRootAsCustomOptions(bb: flatbuffers.ByteBuffer, obj?: CustomOptions): CustomOptions;
    options(index: number, obj?: KeyValuePair): KeyValuePair | null;
    optionsLength(): number;
    static startCustomOptions(builder: flatbuffers.Builder): void;
    static addOptions(builder: flatbuffers.Builder, optionsOffset: flatbuffers.Offset): void;
    static createOptionsVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startOptionsVector(builder: flatbuffers.Builder, numElems: number): void;
    static endCustomOptions(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createCustomOptions(builder: flatbuffers.Builder, optionsOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=custom-options.d.ts.map