"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSingleDbRequest = exports.UpdateSingleDbRequest = exports.EditDbRequest = exports.GetSingleRecordRequest = exports.GetDataDbRequest = exports.FetchDbRequest = exports.CreateTableDbRequest = exports.DbResponse = exports.SchemaModifierRequest = exports.DbRequest = void 0;
const table_definition_1 = require("./table_definition");
class DbRequest {
    tableName;
    constructor(tableName) {
        this.tableName = tableName;
    }
}
exports.DbRequest = DbRequest;
class SchemaModifierRequest {
    tableName;
    constructor(tableName) {
        this.tableName = tableName;
    }
}
exports.SchemaModifierRequest = SchemaModifierRequest;
class DbResponse {
}
exports.DbResponse = DbResponse;
class CreateTableDbRequest extends SchemaModifierRequest {
    getRequestName() {
        return 'CreateTableRequest';
    }
    toMap() {
        return this.tableDefinition.toMap();
    }
    tableDefinition;
    constructor(table) {
        super(table.name);
        this.tableDefinition = table_definition_1.TableDefinition.fromMap(table);
    }
}
exports.CreateTableDbRequest = CreateTableDbRequest;
class FetchDbRequest extends DbRequest {
}
exports.FetchDbRequest = FetchDbRequest;
/**
 * GetDataDbRequest
 */
class GetDataDbRequest extends FetchDbRequest {
    tableName;
    dataSort;
    filters;
    limit;
    offset;
    constructor(tableName, dataSort, filters, limit, offset) {
        super(tableName);
        this.tableName = tableName;
        this.dataSort = dataSort;
        this.filters = filters;
        this.limit = limit;
        this.offset = offset;
    }
    getRequestName() {
        return "GetDataDbRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            dataSort: this.dataSort,
            filters: this.filters,
            limit: this.limit,
            offset: this.offset
        };
    }
    static fromMap(obj) {
        return new GetDataDbRequest(obj.tableName, obj.dataSort, obj.filters, obj.limit, obj.offset);
    }
}
exports.GetDataDbRequest = GetDataDbRequest;
/**
 * GetSingleRecordRequest
 */
class GetSingleRecordRequest extends FetchDbRequest {
    tableName;
    primaryKeyColumn;
    primaryId;
    constructor(tableName, primaryKeyColumn, primaryId) {
        super(tableName);
        this.tableName = tableName;
        this.primaryKeyColumn = primaryKeyColumn;
        this.primaryId = primaryId;
    }
    getRequestName() {
        return "GetSingleRecordRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            primaryKeyColumn: this.primaryKeyColumn,
            primaryId: this.primaryId
        };
    }
    static fromMap(obj) {
        return new GetSingleRecordRequest(obj.tableName, obj.primaryKeyColumn, obj.primaryId);
    }
}
exports.GetSingleRecordRequest = GetSingleRecordRequest;
class EditDbRequest extends DbRequest {
}
exports.EditDbRequest = EditDbRequest;
/**
 * UpdateSingleDbRequest
 */
class UpdateSingleDbRequest extends EditDbRequest {
    tableName;
    updates;
    primaryKeyColumn;
    primaryId;
    constructor(tableName, updates, primaryKeyColumn, primaryId) {
        super(tableName);
        this.tableName = tableName;
        this.updates = updates;
        this.primaryKeyColumn = primaryKeyColumn;
        this.primaryId = primaryId;
    }
    getRequestName() {
        return "UpdateSingleDbRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            updates: this.updates,
            primaryKeyColumn: this.primaryKeyColumn,
            primaryId: this.primaryId
        };
    }
    static fromMap(obj) {
        return new UpdateSingleDbRequest(obj.tableName, obj.updates, obj.primaryKeyColumn, obj.primaryId);
    }
}
exports.UpdateSingleDbRequest = UpdateSingleDbRequest;
/**
 * AddSingleDbRequest
 */
class AddSingleDbRequest extends EditDbRequest {
    tableName;
    primaryKeyColumn;
    data;
    constructor(tableName, primaryKeyColumn, data) {
        super(tableName);
        this.tableName = tableName;
        this.primaryKeyColumn = primaryKeyColumn;
        this.data = data;
    }
    getRequestName() {
        return "AddSingleDbRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            primaryKeyColumn: this.primaryKeyColumn,
            data: this.data
        };
    }
    static fromMap(obj) {
        return new AddSingleDbRequest(obj.tableName, obj.primaryKeyColumn, obj.data);
    }
}
exports.AddSingleDbRequest = AddSingleDbRequest;
