import {
  BaseSqlDataFilter,
  DataSort,
  NullsSortOrder,
  SqlDataFilter,
  SQLDataFilterType,
  OrderKeySpec,
  SqlDataFilterWrapper
} from "./filters/filters";
import { TableDefinition } from "./table_definition";
import { DataHelperAggregation } from "./aggregation";

export abstract class DbRequest {
  constructor(public tableName: string, public companyId: string) {
    if (!tableName || tableName.trim() === "") {
      throw new Error("DbRequest: tableName is required and cannot be empty");
    }
    if (!companyId || companyId.trim() === "") {
      throw new Error("DbRequest: companyId is required and cannot be empty");
    }
  }

  abstract getRequestName(): keyof RequestResponseMap;
  abstract toMap(): Record<string, any>;

  get fullTableName(): string {
    return `${this.companyId}_${this.tableName}`;
  }
}

export class TableExistsRequest extends DbRequest {
  constructor(params: { tableName: string; companyId: string }) {
    super(params.tableName, params.companyId);
  }

  getRequestName(): keyof RequestResponseMap {
    return "TableExistsDbRequest";
  }

  toMap(): Record<string, any> {
    return {
      tableName: this.tableName,
      companyId: this.companyId
    };
  }

  static fromMap(obj: Record<string, any>): TableExistsRequest {
    return new TableExistsRequest({ tableName: obj.tableName, companyId: obj.companyId });
  }
}

export abstract class SchemaModifierRequest {
  protected constructor(public tableName: string, public companyId: string) {
    if (!tableName || tableName.trim() === "") {
      throw new Error("SchemaModifierRequest: tableName is required and cannot be empty");
    }
    if (!companyId || companyId.trim() === "") {
      throw new Error("SchemaModifierRequest: companyId is required and cannot be empty");
    }
  }

  get fullTableName(): string {
    return `${this.companyId}_${this.tableName}`;
  }
}

export class DbResponse {}

/**
 * CreateTableDbRequest
 * Accepts the table definition object directly via params.
 * Uses definition.name as the logical table name.
 */
export class CreateTableDbRequest extends SchemaModifierRequest {
  public tableDefinition: TableDefinition;

  constructor(params: { companyId: string; definition: Record<string, any> }) {
    super(params.definition?.name, params.companyId);
    this.tableDefinition = TableDefinition.fromMap(params.definition);
  }

  getRequestName(): keyof RequestResponseMap {
    return "CreateTableRequest";
  }

  toMap(): Record<string, any> {
    // Preserving your prior behavior: emit only the definition map.
    return this.tableDefinition.toMap();
  }

  static fromMap(obj: Record<string, any>): CreateTableDbRequest {
    // Backward compatible with earlier shape: { companyId, definition: {...} }
    return new CreateTableDbRequest({
      companyId: obj.companyId,
      definition: obj.definition
    });
  }
}

export abstract class FetchDbRequest extends DbRequest {}

/**
 * AggregationRequest
 */
export class AggregationRequest extends FetchDbRequest {
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
  }) {
    super(params.tableName, params.companyId);
    this.tableName = params.tableName;
    this.sumFields = params.sumFields;
    this.averageFields = params.averageFields;
    this.countEnabled = params.countEnabled ?? false;
    this.filters = params.filters;
    this.minimumFields = params.minimumFields ?? [];
    this.maximumFields = params.maximumFields ?? [];
  }

  getRequestName(): keyof RequestResponseMap {
    return "DataHelperAggregationRequest";
  }

  toMap(): Record<string, any> {
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

  static fromMap(obj: Record<string, any>): AggregationRequest {
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

/**
 * GetDataDbRequest
 * Unified params object supports both offset and keyset pagination.
 */
export class GetDataDbRequest extends FetchDbRequest {
  public dataSort?: DataSort;
  public filters?: BaseSqlDataFilter[];
  public limit?: number;
  public offset?: number;
  /** multi-key order by */
  public orderKeys?: OrderKeySpec[];
  /** cursor for keyset pagination (field -> value) */
  public cursor?: Record<string, any>;
  /** whether results must be strictly after cursor (default: true) */
  public strictAfter: boolean;

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
  }) {
    super(params.tableName, params.companyId);
    this.dataSort = params.dataSort;
    this.filters = params.filters;
    this.limit = params.limit;
    this.offset = params.offset;
    this.orderKeys = params.orderKeys;
    this.cursor = params.cursor;
    this.strictAfter = params.strictAfter ?? true;
  }

  getRequestName(): keyof RequestResponseMap {
    return "GetDataDbRequest";
  }

  toMap(): Record<string, any> {
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

  static fromMap(obj: Record<string, any>): GetDataDbRequest {
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

/**
 * GetSingleRecordRequest
 */
export class GetSingleRecordRequest extends FetchDbRequest {
  public primaryKeyColumn: string;
  public primaryId: string;

  constructor(params: {
    tableName: string;
    companyId: string;
    primaryKeyColumn: string;
    primaryId: string;
  }) {
    super(params.tableName, params.companyId);
    this.primaryKeyColumn = params.primaryKeyColumn;
    this.primaryId = params.primaryId;
  }

  getRequestName(): keyof RequestResponseMap {
    return "GetSingleRecordRequest";
  }

  toMap(): Record<string, any> {
    return {
      tableName: this.tableName,
      companyId: this.companyId,
      primaryKeyColumn: this.primaryKeyColumn,
      primaryId: this.primaryId
    };
  }

  static fromMap(obj: Record<string, any>): GetSingleRecordRequest {
    return new GetSingleRecordRequest({
      tableName: obj.tableName,
      companyId: obj.companyId,
      primaryKeyColumn: obj.primaryKeyColumn,
      primaryId: obj.primaryId
    });
  }
}

export abstract class EditDbRequest extends DbRequest {}

/**
 * UpdateSingleDbRequest
 */
export class UpdateSingleDbRequest extends EditDbRequest {
  public updates: Record<string, any>;
  public primaryKeyColumn: string;
  public primaryId: string;

  constructor(params: {
    tableName: string;
    companyId: string;
    updates: Record<string, any>;
    primaryKeyColumn: string;
    primaryId: string;
  }) {
    super(params.tableName, params.companyId);
    this.updates = params.updates;
    this.primaryKeyColumn = params.primaryKeyColumn;
    this.primaryId = params.primaryId;
  }

  getRequestName(): keyof RequestResponseMap {
    return "UpdateSingleDbRequest";
  }

  toMap(): Record<string, any> {
    return {
      tableName: this.tableName,
      companyId: this.companyId,
      updates: this.updates,
      primaryKeyColumn: this.primaryKeyColumn,
      primaryId: this.primaryId
    };
  }

  static fromMap(obj: Record<string, any>): UpdateSingleDbRequest {
    return new UpdateSingleDbRequest({
      tableName: obj.tableName,
      companyId: obj.companyId,
      updates: obj.updates,
      primaryKeyColumn: obj.primaryKeyColumn,
      primaryId: obj.primaryId
    });
  }
}

/**
 * DeleteRowDbRequest
 */
export class DeleteRowDbRequest extends EditDbRequest {
  public primaryKeyColumn: string;
  public primaryId: string;

  constructor(params: {
    tableName: string;
    companyId: string;
    primaryKeyColumn: string;
    primaryId: string;
  }) {
    super(params.tableName, params.companyId);
    this.primaryKeyColumn = params.primaryKeyColumn;
    this.primaryId = params.primaryId;
  }

  getRequestName(): keyof RequestResponseMap {
    return "DeleteRowDbRequest";
  }

  getFilters(): SqlDataFilter[] {
    return [
      {
        fieldName: this.primaryKeyColumn,
        value: this.primaryId,
        filterType: SQLDataFilterType.equals,
        modifier: {
          distinct: true,
          caseInSensitive: false,
          nullsOrder: NullsSortOrder.default_
        }
      } as SqlDataFilter,
      {
        fieldName: "companyId",
        value: this.companyId,
        filterType: SQLDataFilterType.equals,
        modifier: {
          distinct: true,
          caseInSensitive: false,
          nullsOrder: NullsSortOrder.default_
        }
      } as SqlDataFilter
    ];
  }

  toMap(): Record<string, any> {
    return {
      tableName: this.tableName,
      companyId: this.companyId,
      primaryKeyColumn: this.primaryKeyColumn,
      primaryId: this.primaryId
    };
  }

  static fromMap(obj: Record<string, any>): DeleteRowDbRequest {
    return new DeleteRowDbRequest({
      tableName: obj.tableName,
      companyId: obj.companyId,
      primaryKeyColumn: obj.primaryKeyColumn,
      primaryId: obj.primaryId
    });
  }
}

/**
 * AddSingleDbRequest
 */
export class AddSingleDbRequest extends EditDbRequest {
  public primaryKeyColumn: string;
  public data: Record<string, any>;

  constructor(params: {
    tableName: string;
    companyId: string;
    primaryKeyColumn: string;
    data: Record<string, any>;
  }) {
    super(params.tableName, params.companyId);
    this.primaryKeyColumn = params.primaryKeyColumn;
    this.data = params.data;
  }

  getRequestName(): keyof RequestResponseMap {
    return "AddSingleDbRequest";
  }

  toMap(): Record<string, any> {
    return {
      tableName: this.tableName,
      companyId: this.companyId,
      primaryKeyColumn: this.primaryKeyColumn,
      data: this.data
    };
  }

  static fromMap(obj: Record<string, any>): AddSingleDbRequest {
    return new AddSingleDbRequest({
      tableName: obj.tableName,
      companyId: obj.companyId,
      primaryKeyColumn: obj.primaryKeyColumn,
      data: obj.data
    });
  }
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