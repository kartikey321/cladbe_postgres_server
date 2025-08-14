import {BaseSqlDataFilter, DataSort} from "./filters/filters";
import {TableDefinition} from "./table_definition";

export abstract class DbRequest {
    constructor(public tableName: string) {
    }

    abstract getRequestName(): keyof RequestResponseMap;

    abstract toMap(): Record<string, any>;
}

export abstract class SchemaModifierRequest {
    protected constructor(public tableName: string) {
    }

}

export class DbResponse {
}

export class CreateTableDbRequest extends SchemaModifierRequest {
    getRequestName(): keyof RequestResponseMap {
        return 'CreateTableRequest';
    }

    toMap(): Record<string, any> {
        return this.tableDefinition.toMap();
    }

    public tableDefinition: TableDefinition;

    constructor(table: Record<string, any>) {
        super(table.name);
        this.tableDefinition = TableDefinition.fromMap(table);

    }
}


export abstract class FetchDbRequest extends DbRequest {

}

/**
 * GetDataDbRequest
 */
export class GetDataDbRequest extends FetchDbRequest {
    constructor(
        public tableName: string,
        public dataSort?: DataSort,
        public filters?: BaseSqlDataFilter[],
        public limit?: number,
        public offset?: number
    ) {
        super(tableName);
    }

    getRequestName(): keyof RequestResponseMap {
        return "GetDataDbRequest";
    }

    toMap(): Record<string, any> {
        return {
            tableName: this.tableName,
            dataSort: this.dataSort,
            filters: this.filters,
            limit: this.limit,
            offset: this.offset
        };
    }

    static fromMap(obj: Record<string, any>): GetDataDbRequest {
        return new GetDataDbRequest(
            obj.tableName,
            obj.dataSort,
            obj.filters,
            obj.limit,
            obj.offset
        );
    }
}

/**
 * GetSingleRecordRequest
 */
export class GetSingleRecordRequest extends FetchDbRequest {
    constructor(
        public tableName: string,
        public primaryKeyColumn: string,
        public primaryId: string
    ) {
        super(tableName);
    }

    getRequestName(): keyof RequestResponseMap {
        return "GetSingleRecordRequest";
    }

    toMap(): Record<string, any> {
        return {
            tableName: this.tableName,
            primaryKeyColumn: this.primaryKeyColumn,
            primaryId: this.primaryId
        };
    }

    static fromMap(obj: Record<string, any>): GetSingleRecordRequest {
        return new GetSingleRecordRequest(
            obj.tableName,
            obj.primaryKeyColumn,
            obj.primaryId
        );
    }
}

export abstract class EditDbRequest extends DbRequest {
}

/**
 * UpdateSingleDbRequest
 */
export class UpdateSingleDbRequest extends EditDbRequest {
    constructor(
        public tableName: string,
        public updates: Record<string, any>,
        public primaryKeyColumn: string,
        public primaryId: string
    ) {
        super(tableName);
    }

    getRequestName(): keyof RequestResponseMap {
        return "UpdateSingleDbRequest";
    }

    toMap(): Record<string, any> {
        return {
            tableName: this.tableName,
            updates: this.updates,
            primaryKeyColumn: this.primaryKeyColumn,
            primaryId: this.primaryId
        };
    }

    static fromMap(obj: Record<string, any>): UpdateSingleDbRequest {
        return new UpdateSingleDbRequest(
            obj.tableName,
            obj.updates,
            obj.primaryKeyColumn,
            obj.primaryId
        );
    }
}

/**
 * AddSingleDbRequest
 */
export class AddSingleDbRequest extends EditDbRequest {
    constructor(
        public tableName: string,
        public primaryKeyColumn: string,
        public data: Record<string, any>
    ) {
        super(tableName);
    }

    getRequestName(): keyof RequestResponseMap {
        return "AddSingleDbRequest";
    }

    toMap(): Record<string, any> {
        return {
            tableName: this.tableName,
            primaryKeyColumn: this.primaryKeyColumn,
            data: this.data
        };
    }

    static fromMap(obj: Record<string, any>): AddSingleDbRequest {
        return new AddSingleDbRequest(
            obj.tableName,
            obj.primaryKeyColumn,
            obj.data
        );
    }
}

interface RequestResponseMap {
    DbRequest: DbResponse;
    FetchDbRequest: DbResponse;
    GetDataDbRequest: DbResponse; // can be more specific
    GetSingleRecordRequest: DbResponse;
    UpdateSingleDbRequest: DbResponse;
    AddSingleDbRequest: DbResponse;
    CreateTableRequest: DbResponse;
}

export type ResponseForName<N extends keyof RequestResponseMap> =
    RequestResponseMap[N];
