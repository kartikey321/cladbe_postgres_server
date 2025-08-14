import { ColumnConstraint, SQLDataType } from "./enums";
declare class TableDefinition {
    name: string;
    columns: TableColumn[];
    comment?: string;
    tableOptions?: Record<string, any>;
    constructor({ name, columns, comment, tableOptions, }: {
        name: string;
        columns: TableColumn[];
        comment?: string;
        tableOptions?: Record<string, any>;
    });
    copyWith({ name, columns, comment, tableOptions, }: {
        name?: string;
        columns?: TableColumn[];
        comment?: string;
        tableOptions?: Record<string, any>;
    }): TableDefinition;
    toMap(): {
        [key: string]: any;
    };
    static fromMap(map: {
        [key: string]: any;
    }): TableDefinition;
    toJson(): string;
    static fromJson(source: string): TableDefinition;
    toString(): string;
    equals(other: TableDefinition): boolean;
}
declare class TableColumn {
    name: string;
    dataType: SQLDataType;
    isNullable: boolean;
    constraints: ColumnConstraint[];
    customOptions?: Record<string, any>;
    constructor({ name, dataType, isNullable, constraints, customOptions, }: {
        name: string;
        dataType: SQLDataType;
        isNullable: boolean;
        constraints: ColumnConstraint[];
        customOptions?: Record<string, any>;
    });
    copyWith({ name, dataType, isNullable, constraints, customOptions, }: {
        name?: string;
        dataType?: SQLDataType;
        isNullable?: boolean;
        constraints?: ColumnConstraint[];
        customOptions?: Record<string, any>;
    }): TableColumn;
    toMap(): {
        [key: string]: any;
    };
    static fromMap(map: {
        [key: string]: any;
    }): TableColumn;
    toJson(): string;
    static fromJson(source: string): TableColumn;
    toString(): string;
    equals(other: TableColumn): boolean;
}
export { TableDefinition, TableColumn };
//# sourceMappingURL=table_definition.d.ts.map