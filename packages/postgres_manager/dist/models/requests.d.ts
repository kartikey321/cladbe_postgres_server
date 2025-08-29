import { BaseSqlDataFilter, DataSort, SqlDataFilter, OrderKeySpec, SqlDataFilterWrapper } from "./filters/filters";
import { TableDefinition } from "./table_definition";
export declare abstract class DbRequest {
    tableName: string;
    companyId: string;
    constructor(tableName: string, companyId: string);
    abstract getRequestName(): keyof RequestResponseMap;
    abstract toMap(): Record<string, any>;
    get fullTableName(): string;
}
export declare class TableExistsRequest extends DbRequest {
    tableName: string;
    companyId: string;
    constructor(tableName: string, companyId: string);
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): TableExistsRequest;
}
export declare abstract class SchemaModifierRequest {
    tableName: string;
    companyId: string;
    protected constructor(tableName: string, companyId: string);
    get fullTableName(): string;
}
export declare class DbResponse {
}
/**
 * CreateTableDbRequest
 */
export declare class CreateTableDbRequest extends SchemaModifierRequest {
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    tableDefinition: TableDefinition;
    constructor(table: Record<string, any>);
}
export declare abstract class FetchDbRequest extends DbRequest {
}
/**
 * AggregationRequest
 */
export declare class AggregationRequest extends FetchDbRequest {
    tableName: string;
    sumFields?: string[];
    averageFields?: string[];
    countEnabled: boolean;
    filters?: SqlDataFilterWrapper[];
    minimumFields?: string[];
    maximumFields?: string[];
    constructor(params: {
        tableName: string;
        companyId: string;
        sumFields?: string[];
        averageFields?: string[];
        countEnabled?: boolean;
        filters?: SqlDataFilterWrapper[];
        minimumFields?: string[];
        maximumFields?: string[];
    });
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): AggregationRequest;
}
/**
 * GetDataDbRequest
 */
export declare class GetDataDbRequest extends FetchDbRequest {
    tableName: string;
    companyId: string;
    dataSort?: DataSort | undefined;
    filters?: BaseSqlDataFilter[] | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    /** NEW: multi-key order by */
    orderKeys?: OrderKeySpec[] | undefined;
    /** NEW: cursor for keyset pagination (field -> value) */
    cursor?: Record<string, any> | undefined;
    /** NEW: whether results must be strictly after cursor (default: true) */
    strictAfter: boolean;
    constructor(tableName: string, companyId: string, dataSort?: DataSort | undefined, filters?: BaseSqlDataFilter[] | undefined, limit?: number | undefined, offset?: number | undefined, 
    /** NEW: multi-key order by */
    orderKeys?: OrderKeySpec[] | undefined, 
    /** NEW: cursor for keyset pagination (field -> value) */
    cursor?: Record<string, any> | undefined, 
    /** NEW: whether results must be strictly after cursor (default: true) */
    strictAfter?: boolean);
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): GetDataDbRequest;
}
/**
 * GetSingleRecordRequest
 */
export declare class GetSingleRecordRequest extends FetchDbRequest {
    tableName: string;
    companyId: string;
    primaryKeyColumn: string;
    primaryId: string;
    constructor(tableName: string, companyId: string, primaryKeyColumn: string, primaryId: string);
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): GetSingleRecordRequest;
}
export declare abstract class EditDbRequest extends DbRequest {
}
/**
 * UpdateSingleDbRequest
 */
export declare class UpdateSingleDbRequest extends EditDbRequest {
    tableName: string;
    companyId: string;
    updates: Record<string, any>;
    primaryKeyColumn: string;
    primaryId: string;
    constructor(tableName: string, companyId: string, updates: Record<string, any>, primaryKeyColumn: string, primaryId: string);
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): UpdateSingleDbRequest;
}
/**
 * DeleteRowDbRequest
 */
export declare class DeleteRowDbRequest extends EditDbRequest {
    primaryKeyColumn: string;
    primaryId: string;
    constructor({ tableName, companyId, primaryKeyColumn, primaryId }: {
        tableName: string;
        companyId: string;
        primaryKeyColumn: string;
        primaryId: string;
    });
    getRequestName(): keyof RequestResponseMap;
    getFilters(): SqlDataFilter[];
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): DeleteRowDbRequest;
}
/**
 * AddSingleDbRequest
 */
export declare class AddSingleDbRequest extends EditDbRequest {
    tableName: string;
    companyId: string;
    primaryKeyColumn: string;
    data: Record<string, any>;
    constructor(tableName: string, companyId: string, primaryKeyColumn: string, data: Record<string, any>);
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): AddSingleDbRequest;
}
interface RequestResponseMap {
    DbRequest: DbResponse;
    FetchDbRequest: DbResponse;
    GetDataDbRequest: DbResponse;
    GetSingleRecordRequest: DbResponse;
    UpdateSingleDbRequest: DbResponse;
    AddSingleDbRequest: DbResponse;
    CreateTableRequest: DbResponse;
    DataHelperAggregationRequest: DbResponse;
    DeleteRowDbRequest: DbResponse;
    TableExistsDbRequest: DbResponse;
}
export {};
//# sourceMappingURL=requests.d.ts.map