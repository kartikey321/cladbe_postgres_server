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
    constructor(params: {
        tableName: string;
        companyId: string;
    });
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
 * Accepts the table definition object directly via params.
 * Uses definition.name as the logical table name.
 */
export declare class CreateTableDbRequest extends SchemaModifierRequest {
    tableDefinition: TableDefinition;
    constructor(params: {
        companyId: string;
        definition: Record<string, any>;
    });
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): CreateTableDbRequest;
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
 * Unified params object supports both offset and keyset pagination.
 */
export declare class GetDataDbRequest extends FetchDbRequest {
    dataSort?: DataSort;
    filters?: BaseSqlDataFilter[];
    limit?: number;
    offset?: number;
    /** multi-key order by */
    orderKeys?: OrderKeySpec[];
    /** cursor for keyset pagination (field -> value) */
    cursor?: Record<string, any>;
    /** whether results must be strictly after cursor (default: true) */
    strictAfter: boolean;
    constructor(params: {
        tableName: string;
        companyId: string;
        dataSort?: DataSort;
        filters?: BaseSqlDataFilter[];
        limit?: number;
        offset?: number;
        orderKeys?: OrderKeySpec[];
        cursor?: Record<string, any>;
        strictAfter?: boolean;
    });
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): GetDataDbRequest;
}
/**
 * GetSingleRecordRequest
 */
export declare class GetSingleRecordRequest extends FetchDbRequest {
    primaryKeyColumn: string;
    primaryId: string;
    constructor(params: {
        tableName: string;
        companyId: string;
        primaryKeyColumn: string;
        primaryId: string;
    });
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
    updates: Record<string, any>;
    primaryKeyColumn: string;
    primaryId: string;
    constructor(params: {
        tableName: string;
        companyId: string;
        updates: Record<string, any>;
        primaryKeyColumn: string;
        primaryId: string;
    });
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
    constructor(params: {
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
    primaryKeyColumn: string;
    data: Record<string, any>;
    constructor(params: {
        tableName: string;
        companyId: string;
        primaryKeyColumn: string;
        data: Record<string, any>;
    });
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