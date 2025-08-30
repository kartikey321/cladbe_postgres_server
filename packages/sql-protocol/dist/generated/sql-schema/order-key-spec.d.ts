import * as flatbuffers from 'flatbuffers';
import { OrderSort } from '../sql-schema/order-sort.js';
export declare class OrderKeySpec {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): OrderKeySpec;
    static getRootAsOrderKeySpec(bb: flatbuffers.ByteBuffer, obj?: OrderKeySpec): OrderKeySpec;
    static getSizePrefixedRootAsOrderKeySpec(bb: flatbuffers.ByteBuffer, obj?: OrderKeySpec): OrderKeySpec;
    field(): string | null;
    field(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    sort(): OrderSort;
    isPk(): boolean;
    static startOrderKeySpec(builder: flatbuffers.Builder): void;
    static addField(builder: flatbuffers.Builder, fieldOffset: flatbuffers.Offset): void;
    static addSort(builder: flatbuffers.Builder, sort: OrderSort): void;
    static addIsPk(builder: flatbuffers.Builder, isPk: boolean): void;
    static endOrderKeySpec(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createOrderKeySpec(builder: flatbuffers.Builder, fieldOffset: flatbuffers.Offset, sort: OrderSort, isPk: boolean): flatbuffers.Offset;
}
//# sourceMappingURL=order-key-spec.d.ts.map