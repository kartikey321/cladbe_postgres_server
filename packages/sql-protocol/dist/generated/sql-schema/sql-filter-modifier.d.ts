import * as flatbuffers from 'flatbuffers';
import { NullsSortOrder } from '../sql-schema/nulls-sort-order.js';
export declare class SqlFilterModifier {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): SqlFilterModifier;
    static getRootAsSqlFilterModifier(bb: flatbuffers.ByteBuffer, obj?: SqlFilterModifier): SqlFilterModifier;
    static getSizePrefixedRootAsSqlFilterModifier(bb: flatbuffers.ByteBuffer, obj?: SqlFilterModifier): SqlFilterModifier;
    distinct(): boolean;
    caseInsensitive(): boolean;
    nullsOrder(): NullsSortOrder;
    static startSqlFilterModifier(builder: flatbuffers.Builder): void;
    static addDistinct(builder: flatbuffers.Builder, distinct: boolean): void;
    static addCaseInsensitive(builder: flatbuffers.Builder, caseInsensitive: boolean): void;
    static addNullsOrder(builder: flatbuffers.Builder, nullsOrder: NullsSortOrder): void;
    static endSqlFilterModifier(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createSqlFilterModifier(builder: flatbuffers.Builder, distinct: boolean, caseInsensitive: boolean, nullsOrder: NullsSortOrder): flatbuffers.Offset;
}
//# sourceMappingURL=sql-filter-modifier.d.ts.map