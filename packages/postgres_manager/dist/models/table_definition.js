"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableColumn = exports.TableDefinition = void 0;
const enums_1 = require("./enums");
class TableDefinition {
    name;
    columns;
    comment;
    tableOptions;
    constructor({ name, columns, comment, tableOptions, }) {
        this.name = name;
        this.columns = columns;
        this.comment = comment;
        this.tableOptions = tableOptions;
    }
    copyWith({ name, columns, comment, tableOptions, }) {
        return new TableDefinition({
            name: name ?? this.name,
            columns: columns ?? this.columns,
            comment: comment ?? this.comment,
            tableOptions: tableOptions ?? this.tableOptions,
        });
    }
    toMap() {
        return {
            name: this.name,
            columns: this.columns.map((x) => x.toMap()),
            comment: this.comment,
            tableOptions: this.tableOptions,
        };
    }
    static fromMap(map) {
        return new TableDefinition({
            name: map['name'],
            columns: map['columns'].map((x) => TableColumn.fromMap(x)),
            comment: map['comment'] ?? undefined,
            tableOptions: map['tableOptions']
                ? { ...map['tableOptions'] }
                : undefined,
        });
    }
    toJson() {
        return JSON.stringify(this.toMap());
    }
    static fromJson(source) {
        return TableDefinition.fromMap(JSON.parse(source));
    }
    toString() {
        return `SQLTableDefinition(name: ${this.name}, columns: ${this.columns}, comment: ${this.comment}, tableOptions: ${JSON.stringify(this.tableOptions)})`;
    }
    equals(other) {
        if (this === other)
            return true;
        return (this.name === other.name &&
            JSON.stringify(this.columns) === JSON.stringify(other.columns) &&
            this.comment === other.comment &&
            JSON.stringify(this.tableOptions) === JSON.stringify(other.tableOptions));
    }
}
exports.TableDefinition = TableDefinition;
class TableColumn {
    name;
    dataType;
    isNullable;
    constraints;
    customOptions;
    constructor({ name, dataType, isNullable, constraints, customOptions, }) {
        this.name = name;
        this.dataType = dataType;
        this.isNullable = isNullable;
        this.constraints = constraints;
        this.customOptions = customOptions;
    }
    copyWith({ name, dataType, isNullable, constraints, customOptions, }) {
        return new TableColumn({
            name: name ?? this.name,
            dataType: dataType ?? this.dataType,
            isNullable: isNullable ?? this.isNullable,
            constraints: constraints ?? this.constraints,
            customOptions: customOptions ?? this.customOptions,
        });
    }
    toMap() {
        return {
            name: this.name,
            dataType: this.dataType,
            isNullable: this.isNullable,
            constraints: this.constraints.map((x) => x),
            customOptions: this.customOptions,
        };
    }
    static fromMap(map) {
        return new TableColumn({
            name: map['name'],
            dataType: enums_1.SQLDataType.fromString(map['dataType']),
            isNullable: map['isNullable'],
            constraints: map['constraints'].map((x) => enums_1.ColumnConstraint.fromString(x)),
            customOptions: map['customOptions']
                ? { ...map['customOptions'] }
                : undefined,
        });
    }
    toJson() {
        return JSON.stringify(this.toMap());
    }
    static fromJson(source) {
        return TableColumn.fromMap(JSON.parse(source));
    }
    toString() {
        return `SQLTableColumn(name: ${this.name}, dataType: ${this.dataType}, isNullable: ${this.isNullable}, constraints: ${this.constraints}, customOptions: ${JSON.stringify(this.customOptions)})`;
    }
    equals(other) {
        if (this === other)
            return true;
        return (this.name === other.name &&
            this.dataType === other.dataType &&
            this.isNullable === other.isNullable &&
            JSON.stringify(this.constraints) === JSON.stringify(other.constraints) &&
            JSON.stringify(this.customOptions) === JSON.stringify(other.customOptions));
    }
}
exports.TableColumn = TableColumn;
