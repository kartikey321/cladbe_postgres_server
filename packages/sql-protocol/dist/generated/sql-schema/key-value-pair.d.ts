import * as flatbuffers from 'flatbuffers';
export declare class KeyValuePair {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): KeyValuePair;
    static getRootAsKeyValuePair(bb: flatbuffers.ByteBuffer, obj?: KeyValuePair): KeyValuePair;
    static getSizePrefixedRootAsKeyValuePair(bb: flatbuffers.ByteBuffer, obj?: KeyValuePair): KeyValuePair;
    key(): string | null;
    key(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    value(): string | null;
    value(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startKeyValuePair(builder: flatbuffers.Builder): void;
    static addKey(builder: flatbuffers.Builder, keyOffset: flatbuffers.Offset): void;
    static addValue(builder: flatbuffers.Builder, valueOffset: flatbuffers.Offset): void;
    static endKeyValuePair(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createKeyValuePair(builder: flatbuffers.Builder, keyOffset: flatbuffers.Offset, valueOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=key-value-pair.d.ts.map