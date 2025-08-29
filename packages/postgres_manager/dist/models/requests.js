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
    tableName;
    companyId;
    constructor(tableName, companyId) {
        super(tableName, companyId);
        this.tableName = tableName;
        this.companyId = companyId;
    }
    getRequestName() {
        return 'TableExistsDbRequest';
    }
    toMap() {
        return {
            'tableName': this.tableName,
            'companyId': this.companyId
        };
    }
    static fromMap(obj) {
        return new TableExistsRequest(obj.tableName, obj.companyId);
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
 */
class CreateTableDbRequest extends SchemaModifierRequest {
    getRequestName() {
        return 'CreateTableRequest';
    }
    toMap() {
        return this.tableDefinition.toMap();
    }
    tableDefinition;
    constructor(table) {
        super(table.definition.name, table.companyId);
        this.tableDefinition = table_definition_1.TableDefinition.fromMap(table.definition);
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
        return 'DataHelperAggregationRequest';
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
            maximumFields: this.maximumFields,
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
            maximumFields: obj.maximumFields,
        });
    }
}
exports.AggregationRequest = AggregationRequest;
/**
 * GetDataDbRequest
 */
class GetDataDbRequest extends FetchDbRequest {
    tableName;
    companyId;
    dataSort;
    filters;
    limit;
    offset;
    orderKeys;
    cursor;
    strictAfter;
    constructor(tableName, companyId, dataSort, filters, limit, offset, 
    /** NEW: multi-key order by */
    orderKeys, 
    /** NEW: cursor for keyset pagination (field -> value) */
    cursor, 
    /** NEW: whether results must be strictly after cursor (default: true) */
    strictAfter = true) {
        super(tableName, companyId);
        this.tableName = tableName;
        this.companyId = companyId;
        this.dataSort = dataSort;
        this.filters = filters;
        this.limit = limit;
        this.offset = offset;
        this.orderKeys = orderKeys;
        this.cursor = cursor;
        this.strictAfter = strictAfter;
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
        return new GetDataDbRequest(obj.tableName, obj.companyId, obj.dataSort, obj.filters, obj.limit, obj.offset, obj.orderKeys, obj.cursor, obj.strictAfter ?? true);
    }
}
exports.GetDataDbRequest = GetDataDbRequest;
/**
 * GetSingleRecordRequest
 */
class GetSingleRecordRequest extends FetchDbRequest {
    tableName;
    companyId;
    primaryKeyColumn;
    primaryId;
    constructor(tableName, companyId, primaryKeyColumn, primaryId) {
        super(tableName, companyId);
        this.tableName = tableName;
        this.companyId = companyId;
        this.primaryKeyColumn = primaryKeyColumn;
        this.primaryId = primaryId;
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
        return new GetSingleRecordRequest(obj.tableName, obj.companyId, obj.primaryKeyColumn, obj.primaryId);
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
    companyId;
    updates;
    primaryKeyColumn;
    primaryId;
    constructor(tableName, companyId, updates, primaryKeyColumn, primaryId) {
        super(tableName, companyId);
        this.tableName = tableName;
        this.companyId = companyId;
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
            companyId: this.companyId,
            updates: this.updates,
            primaryKeyColumn: this.primaryKeyColumn,
            primaryId: this.primaryId
        };
    }
    static fromMap(obj) {
        return new UpdateSingleDbRequest(obj.tableName, obj.companyId, obj.updates, obj.primaryKeyColumn, obj.primaryId);
    }
}
exports.UpdateSingleDbRequest = UpdateSingleDbRequest;
/**
 * DeleteRowDbRequest
 */
class DeleteRowDbRequest extends EditDbRequest {
    primaryKeyColumn;
    primaryId;
    constructor({ tableName, companyId, primaryKeyColumn, primaryId }) {
        super(tableName, companyId);
        this.primaryKeyColumn = primaryKeyColumn;
        this.primaryId = primaryId;
    }
    getRequestName() {
        return 'DeleteRowDbRequest';
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
                    nullsOrder: filters_1.NullsSortOrder.default_,
                }
            },
            {
                fieldName: 'companyId',
                value: this.companyId,
                filterType: filters_1.SQLDataFilterType.equals,
                modifier: {
                    distinct: true,
                    caseInSensitive: false,
                    nullsOrder: filters_1.NullsSortOrder.default_,
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
    tableName;
    companyId;
    primaryKeyColumn;
    data;
    constructor(tableName, companyId, primaryKeyColumn, data) {
        super(tableName, companyId);
        this.tableName = tableName;
        this.companyId = companyId;
        this.primaryKeyColumn = primaryKeyColumn;
        this.data = data;
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
        return new AddSingleDbRequest(obj.tableName, obj.companyId, obj.primaryKeyColumn, obj.data);
    }
}
exports.AddSingleDbRequest = AddSingleDbRequest;
