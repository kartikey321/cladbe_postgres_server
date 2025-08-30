import * as flatbuffers from 'flatbuffers';
import { FilterValue } from '../sql-schema/filter-value.js';
export declare class RangeValue {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): RangeValue;
    static getRootAsRangeValue(bb: flatbuffers.ByteBuffer, obj?: RangeValue): RangeValue;
    static getSizePrefixedRootAsRangeValue(bb: flatbuffers.ByteBuffer, obj?: RangeValue): RangeValue;
    lowType(): FilterValue;
    low<T extends flatbuffers.Table>(obj: any): any | null;
    highType(): FilterValue;
    high<T extends flatbuffers.Table>(obj: any): any | null;
    includeLow(): boolean;
    includeHigh(): boolean;
    static startRangeValue(builder: flatbuffers.Builder): void;
    static addLowType(builder: flatbuffers.Builder, lowType: FilterValue): void;
    static addLow(builder: flatbuffers.Builder, lowOffset: flatbuffers.Offset): void;
    static addHighType(builder: flatbuffers.Builder, highType: FilterValue): void;
    static addHigh(builder: flatbuffers.Builder, highOffset: flatbuffers.Offset): void;
    static addIncludeLow(builder: flatbuffers.Builder, includeLow: boolean): void;
    static addIncludeHigh(builder: flatbuffers.Builder, includeHigh: boolean): void;
    static endRangeValue(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createRangeValue(builder: flatbuffers.Builder, lowType: FilterValue, lowOffset: flatbuffers.Offset, highType: FilterValue, highOffset: flatbuffers.Offset, includeLow: boolean, includeHigh: boolean): flatbuffers.Offset;
}
//# sourceMappingURL=range-value.d.ts.map