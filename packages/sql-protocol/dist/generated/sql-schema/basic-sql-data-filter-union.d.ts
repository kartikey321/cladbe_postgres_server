import { BasicSqlDataFilter } from '../sql-schema/basic-sql-data-filter.js';
import { BasicSqlDataFilterWrapper } from '../sql-schema/basic-sql-data-filter-wrapper.js';
export declare enum BasicSqlDataFilterUnion {
    NONE = 0,
    BasicSqlDataFilterWrapper = 1,
    BasicSqlDataFilter = 2
}
export declare function unionToBasicSqlDataFilterUnion(type: BasicSqlDataFilterUnion, accessor: (obj: BasicSqlDataFilter | BasicSqlDataFilterWrapper) => BasicSqlDataFilter | BasicSqlDataFilterWrapper | null): BasicSqlDataFilter | BasicSqlDataFilterWrapper | null;
export declare function unionListToBasicSqlDataFilterUnion(type: BasicSqlDataFilterUnion, accessor: (index: number, obj: BasicSqlDataFilter | BasicSqlDataFilterWrapper) => BasicSqlDataFilter | BasicSqlDataFilterWrapper | null, index: number): BasicSqlDataFilter | BasicSqlDataFilterWrapper | null;
//# sourceMappingURL=basic-sql-data-filter-union.d.ts.map