import * as flatbuffers from 'flatbuffers';
import { BasicSqlDataFilterType } from '../sql-schema/basic-sql-data-filter-type.js';
import { FilterValue } from '../sql-schema/filter-value.js';
import { SqlFilterModifier } from '../sql-schema/sql-filter-modifier.js';
export declare class BasicSqlDataFilter {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): BasicSqlDataFilter;
    static getRootAsBasicSqlDataFilter(bb: flatbuffers.ByteBuffer, obj?: BasicSqlDataFilter): BasicSqlDataFilter;
    static getSizePrefixedRootAsBasicSqlDataFilter(bb: flatbuffers.ByteBuffer, obj?: BasicSqlDataFilter): BasicSqlDataFilter;
    fieldName(): string | null;
    fieldName(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    valueType(): FilterValue;
    value<T extends flatbuffers.Table>(obj: any): any | null;
    filterType(): BasicSqlDataFilterType;
    modifier(obj?: SqlFilterModifier): SqlFilterModifier | null;
    static startBasicSqlDataFilter(builder: flatbuffers.Builder): void;
    static addFieldName(builder: flatbuffers.Builder, fieldNameOffset: flatbuffers.Offset): void;
    static addValueType(builder: flatbuffers.Builder, valueType: FilterValue): void;
    static addValue(builder: flatbuffers.Builder, valueOffset: flatbuffers.Offset): void;
    static addFilterType(builder: flatbuffers.Builder, filterType: BasicSqlDataFilterType): void;
    static addModifier(builder: flatbuffers.Builder, modifierOffset: flatbuffers.Offset): void;
    static endBasicSqlDataFilter(builder: flatbuffers.Builder): flatbuffers.Offset;
}
//# sourceMappingURL=basic-sql-data-filter.d.ts.map