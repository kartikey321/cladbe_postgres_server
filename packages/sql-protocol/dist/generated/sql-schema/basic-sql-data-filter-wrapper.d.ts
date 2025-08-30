import * as flatbuffers from 'flatbuffers';
import { BasicSqlDataFilterUnion } from '../sql-schema/basic-sql-data-filter-union.js';
import { SQLFilterWrapperType } from '../sql-schema/sqlfilter-wrapper-type.js';
export declare class BasicSqlDataFilterWrapper {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): BasicSqlDataFilterWrapper;
    static getRootAsBasicSqlDataFilterWrapper(bb: flatbuffers.ByteBuffer, obj?: BasicSqlDataFilterWrapper): BasicSqlDataFilterWrapper;
    static getSizePrefixedRootAsBasicSqlDataFilterWrapper(bb: flatbuffers.ByteBuffer, obj?: BasicSqlDataFilterWrapper): BasicSqlDataFilterWrapper;
    filterWrapperType(): SQLFilterWrapperType;
    filtersType(index: number): BasicSqlDataFilterUnion | null;
    filtersTypeLength(): number;
    filtersTypeArray(): Uint8Array | null;
    filters(index: number, obj: any): any | null;
    filtersLength(): number;
    static startBasicSqlDataFilterWrapper(builder: flatbuffers.Builder): void;
    static addFilterWrapperType(builder: flatbuffers.Builder, filterWrapperType: SQLFilterWrapperType): void;
    static addFiltersType(builder: flatbuffers.Builder, filtersTypeOffset: flatbuffers.Offset): void;
    static createFiltersTypeVector(builder: flatbuffers.Builder, data: BasicSqlDataFilterUnion[]): flatbuffers.Offset;
    static startFiltersTypeVector(builder: flatbuffers.Builder, numElems: number): void;
    static addFilters(builder: flatbuffers.Builder, filtersOffset: flatbuffers.Offset): void;
    static createFiltersVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startFiltersVector(builder: flatbuffers.Builder, numElems: number): void;
    static endBasicSqlDataFilterWrapper(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createBasicSqlDataFilterWrapper(builder: flatbuffers.Builder, filterWrapperType: SQLFilterWrapperType, filtersTypeOffset: flatbuffers.Offset, filtersOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=basic-sql-data-filter-wrapper.d.ts.map