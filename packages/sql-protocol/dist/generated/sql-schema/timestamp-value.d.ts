import * as flatbuffers from 'flatbuffers';
import { TimeUnit } from '../sql-schema/time-unit.js';
export declare class TimestampValue {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TimestampValue;
    static getRootAsTimestampValue(bb: flatbuffers.ByteBuffer, obj?: TimestampValue): TimestampValue;
    static getSizePrefixedRootAsTimestampValue(bb: flatbuffers.ByteBuffer, obj?: TimestampValue): TimestampValue;
    epoch(): bigint;
    unit(): TimeUnit;
    static startTimestampValue(builder: flatbuffers.Builder): void;
    static addEpoch(builder: flatbuffers.Builder, epoch: bigint): void;
    static addUnit(builder: flatbuffers.Builder, unit: TimeUnit): void;
    static endTimestampValue(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createTimestampValue(builder: flatbuffers.Builder, epoch: bigint, unit: TimeUnit): flatbuffers.Offset;
}
//# sourceMappingURL=timestamp-value.d.ts.map