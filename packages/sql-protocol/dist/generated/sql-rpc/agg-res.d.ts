import * as flatbuffers from 'flatbuffers';
import { DataHelperAggregation } from '../sql-schema/data-helper-aggregation.js';
export declare class AggRes {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): AggRes;
    static getRootAsAggRes(bb: flatbuffers.ByteBuffer, obj?: AggRes): AggRes;
    static getSizePrefixedRootAsAggRes(bb: flatbuffers.ByteBuffer, obj?: AggRes): AggRes;
    agg(obj?: DataHelperAggregation): DataHelperAggregation | null;
    static startAggRes(builder: flatbuffers.Builder): void;
    static addAgg(builder: flatbuffers.Builder, aggOffset: flatbuffers.Offset): void;
    static endAggRes(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createAggRes(builder: flatbuffers.Builder, aggOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=agg-res.d.ts.map