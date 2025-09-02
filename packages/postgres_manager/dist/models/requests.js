"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSingleDbRequest = exports.DeleteRowDbRequest = exports.UpdateSingleDbRequest = exports.EditDbRequest = exports.GetSingleRecordRequest = exports.GetDataDbRequest = exports.AggregationRequest = exports.FetchDbRequest = exports.CreateTableDbRequest = exports.DbResponse = exports.SchemaModifierRequest = exports.TableExistsRequest = exports.DbRequest = void 0;
const filters_1 = require("./filters/filters");
const table_definition_1 = require("./table_definition");
class DbRequest {
    tableName;
    companyId;
    constructor(tableName, companyId) {
        this.tableName = tableName;
        this.companyId = companyId;
        if (!tableName || tableName.trim() === "") {
            throw new Error("DbRequest: tableName is required and cannot be empty");
        }
        if (!companyId || companyId.trim() === "") {
            throw new Error("DbRequest: companyId is required and cannot be empty");
        }
    }
    get fullTableName() {
        return `${this.companyId}_${this.tableName}`;
    }
}
exports.DbRequest = DbRequest;
class TableExistsRequest extends DbRequest {
    constructor(params) {
        super(params.tableName, params.companyId);
    }
    getRequestName() {
        return "TableExistsDbRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            companyId: this.companyId
        };
    }
    static fromMap(obj) {
        return new TableExistsRequest({ tableName: obj.tableName, companyId: obj.companyId });
    }
}
exports.TableExistsRequest = TableExistsRequest;
class SchemaModifierRequest {
    tableName;
    companyId;
    constructor(tableName, companyId) {
        this.tableName = tableName;
        this.companyId = companyId;
        if (!tableName || tableName.trim() === "") {
            throw new Error("SchemaModifierRequest: tableName is required and cannot be empty");
        }
        if (!companyId || companyId.trim() === "") {
            throw new Error("SchemaModifierRequest: companyId is required and cannot be empty");
        }
    }
    get fullTableName() {
        return `${this.companyId}_${this.tableName}`;
    }
}
exports.SchemaModifierRequest = SchemaModifierRequest;
class DbResponse {
}
exports.DbResponse = DbResponse;
/**
 * CreateTableDbRequest
 * Accepts the table definition object directly via params.
 * Uses definition.name as the logical table name.
 */
class CreateTableDbRequest extends SchemaModifierRequest {
    tableDefinition;
    constructor(params) {
        super(params.definition?.name, params.companyId);
        this.tableDefinition = table_definition_1.TableDefinition.fromMap(params.definition);
    }
    getRequestName() {
        return "CreateTableRequest";
    }
    toMap() {
        // Preserving your prior behavior: emit only the definition map.
        return this.tableDefinition.toMap();
    }
    static fromMap(obj) {
        // Backward compatible with earlier shape: { companyId, definition: {...} }
        return new CreateTableDbRequest({
            companyId: obj.companyId,
            definition: obj.definition
        });
    }
}
exports.CreateTableDbRequest = CreateTableDbRequest;
class FetchDbRequest extends DbRequest {
}
exports.FetchDbRequest = FetchDbRequest;
/**
 * AggregationRequest
 */
class AggregationRequest extends FetchDbRequest {
    tableName;
    sumFields;
    averageFields;
    countEnabled;
    filters;
    minimumFields;
    maximumFields;
    constructor(params) {
        super(params.tableName, params.companyId);
        this.tableName = params.tableName;
        this.sumFields = params.sumFields;
        this.averageFields = params.averageFields;
        this.countEnabled = params.countEnabled ?? false;
        this.filters = params.filters;
        this.minimumFields = params.minimumFields ?? [];
        this.maximumFields = params.maximumFields ?? [];
    }
    getRequestName() {
        return "DataHelperAggregationRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            companyId: this.companyId,
            sumFields: this.sumFields,
            countEnabled: this.countEnabled,
            averageFields: this.averageFields,
            filters: this.filters,
            minimumFields: this.minimumFields,
            maximumFields: this.maximumFields
        };
    }
    static fromMap(obj) {
        return new AggregationRequest({
            tableName: obj.tableName,
            companyId: obj.companyId,
            sumFields: obj.sumFields,
            averageFields: obj.averageFields,
            countEnabled: obj.countEnabled,
            filters: obj.filters,
            minimumFields: obj.minimumFields,
            maximumFields: obj.maximumFields
        });
    }
}
exports.AggregationRequest = AggregationRequest;
/**
 * GetDataDbRequest
 * Unified params object supports both offset and keyset pagination.
 */
class GetDataDbRequest extends FetchDbRequest {
    dataSort;
    filters;
    limit;
    offset;
    /** multi-key order by */
    orderKeys;
    /** cursor for keyset pagination (field -> value) */
    cursor;
    /** whether results must be strictly after cursor (default: true) */
    strictAfter;
    constructor(params) {
        super(params.tableName, params.companyId);
        this.dataSort = params.dataSort;
        this.filters = params.filters;
        this.limit = params.limit;
        this.offset = params.offset;
        this.orderKeys = params.orderKeys;
        this.cursor = params.cursor;
        this.strictAfter = params.strictAfter ?? true;
    }
    getRequestName() {
        return "GetDataDbRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            companyId: this.companyId,
            dataSort: this.dataSort,
            filters: this.filters,
            limit: this.limit,
            offset: this.offset,
            orderKeys: this.orderKeys,
            cursor: this.cursor,
            strictAfter: this.strictAfter
        };
    }
    static fromMap(obj) {
        return new GetDataDbRequest({
            tableName: obj.tableName,
            companyId: obj.companyId,
            dataSort: obj.dataSort,
            filters: obj.filters,
            limit: obj.limit,
            offset: obj.offset,
            orderKeys: obj.orderKeys,
            cursor: obj.cursor,
            strictAfter: obj.strictAfter
        });
    }
}
exports.GetDataDbRequest = GetDataDbRequest;
/**
 * GetSingleRecordRequest
 */
class GetSingleRecordRequest extends FetchDbRequest {
    primaryKeyColumn;
    primaryId;
    constructor(params) {
        super(params.tableName, params.companyId);
        this.primaryKeyColumn = params.primaryKeyColumn;
        this.primaryId = params.primaryId;
    }
    getRequestName() {
        return "GetSingleRecordRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            companyId: this.companyId,
            primaryKeyColumn: this.primaryKeyColumn,
            primaryId: this.primaryId
        };
    }
    static fromMap(obj) {
        return new GetSingleRecordRequest({
            tableName: obj.tableName,
            companyId: obj.companyId,
            primaryKeyColumn: obj.primaryKeyColumn,
            primaryId: obj.primaryId
        });
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
    updates;
    primaryKeyColumn;
    primaryId;
    constructor(params) {
        super(params.tableName, params.companyId);
        this.updates = params.updates;
        this.primaryKeyColumn = params.primaryKeyColumn;
        this.primaryId = params.primaryId;
    }
    getRequestName() {
        return "UpdateSingleDbRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            companyId: this.companyId,
            updates: this.updates,
            primaryKeyColumn: this.primaryKeyColumn,
            primaryId: this.primaryId
        };
    }
    static fromMap(obj) {
        return new UpdateSingleDbRequest({
            tableName: obj.tableName,
            companyId: obj.companyId,
            updates: obj.updates,
            primaryKeyColumn: obj.primaryKeyColumn,
            primaryId: obj.primaryId
        });
    }
}
exports.UpdateSingleDbRequest = UpdateSingleDbRequest;
/**
 * DeleteRowDbRequest
 */
class DeleteRowDbRequest extends EditDbRequest {
    primaryKeyColumn;
    primaryId;
    constructor(params) {
        super(params.tableName, params.companyId);
        this.primaryKeyColumn = params.primaryKeyColumn;
        this.primaryId = params.primaryId;
    }
    getRequestName() {
        return "DeleteRowDbRequest";
    }
    getFilters() {
        return [
            {
                fieldName: this.primaryKeyColumn,
                value: this.primaryId,
                filterType: filters_1.SQLDataFilterType.equals,
                modifier: {
                    distinct: true,
                    caseInSensitive: false,
                    nullsOrder: filters_1.NullsSortOrder.default_
                }
            },
            {
                fieldName: "companyId",
                value: this.companyId,
                filterType: filters_1.SQLDataFilterType.equals,
                modifier: {
                    distinct: true,
                    caseInSensitive: false,
                    nullsOrder: filters_1.NullsSortOrder.default_
                }
            }
        ];
    }
    toMap() {
        return {
            tableName: this.tableName,
            companyId: this.companyId,
            primaryKeyColumn: this.primaryKeyColumn,
            primaryId: this.primaryId
        };
    }
    static fromMap(obj) {
        return new DeleteRowDbRequest({
            tableName: obj.tableName,
            companyId: obj.companyId,
            primaryKeyColumn: obj.primaryKeyColumn,
            primaryId: obj.primaryId
        });
    }
}
exports.DeleteRowDbRequest = DeleteRowDbRequest;
/**
 * AddSingleDbRequest
 */
class AddSingleDbRequest extends EditDbRequest {
    primaryKeyColumn;
    data;
    constructor(params) {
        super(params.tableName, params.companyId);
        this.primaryKeyColumn = params.primaryKeyColumn;
        this.data = params.data;
    }
    getRequestName() {
        return "AddSingleDbRequest";
    }
    toMap() {
        return {
            tableName: this.tableName,
            companyId: this.companyId,
            primaryKeyColumn: this.primaryKeyColumn,
            data: this.data
        };
    }
    static fromMap(obj) {
        return new AddSingleDbRequest({
            tableName: obj.tableName,
            companyId: obj.companyId,
            primaryKeyColumn: obj.primaryKeyColumn,
            data: obj.data
        });
    }
}
exports.AddSingleDbRequest = AddSingleDbRequest;
