import * as flatbuffers from 'flatbuffers';
import { KeyValuePair } from '../sql-schema/key-value-pair.js';
export declare class TableOptions {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TableOptions;
    static getRootAsTableOptions(bb: flatbuffers.ByteBuffer, obj?: TableOptions): TableOptions;
    static getSizePrefixedRootAsTableOptions(bb: flatbuffers.ByteBuffer, obj?: TableOptions): TableOptions;
    options(index: number, obj?: KeyValuePair): KeyValuePair | null;
    optionsLength(): number;
    static startTableOptions(builder: flatbuffers.Builder): void;
    static addOptions(builder: flatbuffers.Builder, optionsOffset: flatbuffers.Offset): void;
    static createOptionsVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startOptionsVector(builder: flatbuffers.Builder, numElems: number): void;
    static endTableOptions(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createTableOptions(builder: flatbuffers.Builder, optionsOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=table-options.d.ts.map