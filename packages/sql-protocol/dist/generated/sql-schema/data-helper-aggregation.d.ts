import * as flatbuffers from 'flatbuffers';
import { KeyValuePair } from '../sql-schema/key-value-pair.js';
export declare class DataHelperAggregation {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): DataHelperAggregation;
    static getRootAsDataHelperAggregation(bb: flatbuffers.ByteBuffer, obj?: DataHelperAggregation): DataHelperAggregation;
    static getSizePrefixedRootAsDataHelperAggregation(bb: flatbuffers.ByteBuffer, obj?: DataHelperAggregation): DataHelperAggregation;
    count(): number;
    sumValues(index: number, obj?: KeyValuePair): KeyValuePair | null;
    sumValuesLength(): number;
    avgValues(index: number, obj?: KeyValuePair): KeyValuePair | null;
    avgValuesLength(): number;
    minimumValues(index: number, obj?: KeyValuePair): KeyValuePair | null;
    minimumValuesLength(): number;
    maximumValues(index: number, obj?: KeyValuePair): KeyValuePair | null;
    maximumValuesLength(): number;
    static startDataHelperAggregation(builder: flatbuffers.Builder): void;
    static addCount(builder: flatbuffers.Builder, count: number): void;
    static addSumValues(builder: flatbuffers.Builder, sumValuesOffset: flatbuffers.Offset): void;
    static createSumValuesVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startSumValuesVector(builder: flatbuffers.Builder, numElems: number): void;
    static addAvgValues(builder: flatbuffers.Builder, avgValuesOffset: flatbuffers.Offset): void;
    static createAvgValuesVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startAvgValuesVector(builder: flatbuffers.Builder, numElems: number): void;
    static addMinimumValues(builder: flatbuffers.Builder, minimumValuesOffset: flatbuffers.Offset): void;
    static createMinimumValuesVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startMinimumValuesVector(builder: flatbuffers.Builder, numElems: number): void;
    static addMaximumValues(builder: flatbuffers.Builder, maximumValuesOffset: flatbuffers.Offset): void;
    static createMaximumValuesVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startMaximumValuesVector(builder: flatbuffers.Builder, numElems: number): void;
    static endDataHelperAggregation(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createDataHelperAggregation(builder: flatbuffers.Builder, count: number, sumValuesOffset: flatbuffers.Offset, avgValuesOffset: flatbuffers.Offset, minimumValuesOffset: flatbuffers.Offset, maximumValuesOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=data-helper-aggregation.d.ts.map