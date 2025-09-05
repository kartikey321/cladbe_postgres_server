import { SqlSchema as sc, SqlRpc as sr } from "@cladbe/sql-protocol";
import { ColumnConstraint, NullsSortOrder, OrderSort, SQLDataFilterType, SQLFilterWrapperType, SQLDataType } from "../types.js";
export declare function mapOrderSort(v: OrderSort): sc.SqlSchema.OrderSort;
export declare function mapWrapperType(v: SQLFilterWrapperType): sc.SqlSchema.SQLFilterWrapperType;
export declare function mapNullsSortOrder(v: NullsSortOrder): sc.SqlSchema.NullsSortOrder;
export declare function mapFilterType(v: SQLDataFilterType): sc.SqlSchema.BasicSqlDataFilterType;
export declare function mapSqlType(v: SQLDataType): sc.SqlSchema.SQLDataType;
export declare function mapConstraint(v: ColumnConstraint): sc.SqlSchema.ColumnConstraint;
export declare function mapErrorCode(code: sr.SqlRpc.ErrorCode): "NONE" | "BAD_REQUEST" | "INTERNAL";
