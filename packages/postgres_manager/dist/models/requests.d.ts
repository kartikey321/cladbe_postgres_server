import { BaseSqlDataFilter, DataSort } from "./filters/filters";
import { TableDefinition } from "./table_definition";
export declare abstract class DbRequest {
    tableName: string;
    constructor(tableName: string);
    abstract getRequestName(): keyof RequestResponseMap;
    abstract toMap(): Record<string, any>;
}
export declare abstract class SchemaModifierRequest {
    tableName: string;
    protected constructor(tableName: string);
}
export declare class DbResponse {
}
export declare class CreateTableDbRequest extends SchemaModifierRequest {
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    tableDefinition: TableDefinition;
    constructor(table: Record<string, any>);
}
export declare abstract class FetchDbRequest extends DbRequest {
}
/**
 * GetDataDbRequest
 */
export declare class GetDataDbRequest extends FetchDbRequest {
    tableName: string;
    dataSort?: DataSort | undefined;
    filters?: BaseSqlDataFilter[] | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    constructor(tableName: string, dataSort?: DataSort | undefined, filters?: BaseSqlDataFilter[] | undefined, limit?: number | undefined, offset?: number | undefined);
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): GetDataDbRequest;
}
/**
 * GetSingleRecordRequest
 */
export declare class GetSingleRecordRequest extends FetchDbRequest {
    tableName: string;
    primaryKeyColumn: string;
    primaryId: string;
    constructor(tableName: string, primaryKeyColumn: string, primaryId: string);
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
    updates: Record<string, any>;
    primaryKeyColumn: string;
    primaryId: string;
    constructor(tableName: string, updates: Record<string, any>, primaryKeyColumn: string, primaryId: string);
    getRequestName(): keyof RequestResponseMap;
    toMap(): Record<string, any>;
    static fromMap(obj: Record<string, any>): UpdateSingleDbRequest;
}
/**
 * AddSingleDbRequest
 */
export declare class AddSingleDbRequest extends EditDbRequest {
    tableName: string;
    primaryKeyColumn: string;
    data: Record<string, any>;
    constructor(tableName: string, primaryKeyColumn: string, data: Record<string, any>);
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
}
export type ResponseForName<N extends keyof RequestResponseMap> = RequestResponseMap[N];
export {};
//# sourceMappingURL=requests.d.ts.map