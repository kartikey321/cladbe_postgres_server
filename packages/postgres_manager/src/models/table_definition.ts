import {ColumnConstraint, SQLDataType} from "./enums";

class TableDefinition {
    name: string;
    columns: TableColumn[];
    comment?: string;
    tableOptions?: Record<string, any>;

    constructor({
                    name,
                    columns,
                    comment,
                    tableOptions,
                }: {
        name: string;
        columns: TableColumn[];
        comment?: string;
        tableOptions?: Record<string, any>;
    }) {
        this.name = name;
        this.columns = columns;
        this.comment = comment;
        this.tableOptions = tableOptions;
    }

    copyWith({
                 name,
                 columns,
                 comment,
                 tableOptions,
             }: {
        name?: string;
        columns?: TableColumn[];
        comment?: string;
        tableOptions?: Record<string, any>;
    }): TableDefinition {
        return new TableDefinition({
            name: name ?? this.name,
            columns: columns ?? this.columns,
            comment: comment ?? this.comment,
            tableOptions: tableOptions ?? this.tableOptions,
        });
    }

    toMap(): { [key: string]: any } {
        return {
            name: this.name,
            columns: this.columns.map((x) => x.toMap()),
            comment: this.comment,
            tableOptions: this.tableOptions,
        };
    }

    static fromMap(map: { [key: string]: any }): TableDefinition {
        return new TableDefinition({
            name: map['name'] as string,
            columns: (map['columns'] as any[]).map((x) => TableColumn.fromMap(x)),
            comment: map['comment'] ?? undefined,
            tableOptions: map['tableOptions']
                ? {...(map['tableOptions'] as Record<string, any>)}
                : undefined,
        });
    }

    toJson(): string {
        return JSON.stringify(this.toMap());
    }

    static fromJson(source: string): TableDefinition {
        return TableDefinition.fromMap(JSON.parse(source));
    }

    toString(): string {
        return `SQLTableDefinition(name: ${this.name}, columns: ${this.columns}, comment: ${this.comment}, tableOptions: ${JSON.stringify(this.tableOptions)})`;
    }

    equals(other: TableDefinition): boolean {
        if (this === other) return true;

        return (
            this.name === other.name &&
            JSON.stringify(this.columns) === JSON.stringify(other.columns) &&
            this.comment === other.comment &&
            JSON.stringify(this.tableOptions) === JSON.stringify(other.tableOptions)
        );
    }
}

class TableColumn {
    name: string;
    dataType: SQLDataType;
    isNullable: boolean;
    constraints: ColumnConstraint[];
    customOptions?: Record<string, any>;

    constructor({
                    name,
                    dataType,
                    isNullable,
                    constraints,
                    customOptions,
                }: {
        name: string;
        dataType: SQLDataType;
        isNullable: boolean;
        constraints: ColumnConstraint[];
        customOptions?: Record<string, any>;
    }) {
        this.name = name;
        this.dataType = dataType;
        this.isNullable = isNullable;
        this.constraints = constraints;
        this.customOptions = customOptions;
    }

    copyWith({
                 name,
                 dataType,
                 isNullable,
                 constraints,
                 customOptions,
             }: {
        name?: string;
        dataType?: SQLDataType;
        isNullable?: boolean;
        constraints?: ColumnConstraint[];
        customOptions?: Record<string, any>;
    }): TableColumn {
        return new TableColumn({
            name: name ?? this.name,
            dataType: dataType ?? this.dataType,
            isNullable: isNullable ?? this.isNullable,
            constraints: constraints ?? this.constraints,
            customOptions: customOptions ?? this.customOptions,
        });
    }

    toMap(): { [key: string]: any } {
        return {
            name: this.name,
            dataType: this.dataType,
            isNullable: this.isNullable,
            constraints: this.constraints.map((x) => x),
            customOptions: this.customOptions,
        };
    }

    static fromMap(map: { [key: string]: any }): TableColumn {
        return new TableColumn({
            name: map['name'] as string,
            dataType: SQLDataType.fromString(map['dataType']),
            isNullable: map['isNullable'] as boolean,
            constraints: (map['constraints'] as string[]).map((x) =>
                ColumnConstraint.fromString(x)
            ),
            customOptions: map['customOptions']
                ? {...(map['customOptions'] as Record<string, any>)}
                : undefined,
        });
    }

    toJson(): string {
        return JSON.stringify(this.toMap());
    }

    static fromJson(source: string): TableColumn {
        return TableColumn.fromMap(JSON.parse(source));
    }

    toString(): string {
        return `SQLTableColumn(name: ${this.name}, dataType: ${this.dataType}, isNullable: ${this.isNullable}, constraints: ${this.constraints}, customOptions: ${JSON.stringify(this.customOptions)})`;
    }

    equals(other: TableColumn): boolean {
        if (this === other) return true;

        return (
            this.name === other.name &&
            this.dataType === other.dataType &&
            this.isNullable === other.isNullable &&
            JSON.stringify(this.constraints) === JSON.stringify(other.constraints) &&
            JSON.stringify(this.customOptions) === JSON.stringify(other.customOptions)
        );
    }
}

export {TableDefinition, TableColumn};