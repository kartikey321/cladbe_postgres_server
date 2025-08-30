import * as flatbuffers from 'flatbuffers';
import { ColumnConstraint } from '../sql-schema/column-constraint.js';
import { CustomOptions } from '../sql-schema/custom-options.js';
import { SQLDataType } from '../sql-schema/sqldata-type.js';
export declare class TableColumn {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TableColumn;
    static getRootAsTableColumn(bb: flatbuffers.ByteBuffer, obj?: TableColumn): TableColumn;
    static getSizePrefixedRootAsTableColumn(bb: flatbuffers.ByteBuffer, obj?: TableColumn): TableColumn;
    name(): string | null;
    name(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    dataType(): SQLDataType;
    isNullable(): boolean;
    constraints(index: number): ColumnConstraint | null;
    constraintsLength(): number;
    constraintsArray(): Uint8Array | null;
    customOptions(obj?: CustomOptions): CustomOptions | null;
    static startTableColumn(builder: flatbuffers.Builder): void;
    static addName(builder: flatbuffers.Builder, nameOffset: flatbuffers.Offset): void;
    static addDataType(builder: flatbuffers.Builder, dataType: SQLDataType): void;
    static addIsNullable(builder: flatbuffers.Builder, isNullable: boolean): void;
    static addConstraints(builder: flatbuffers.Builder, constraintsOffset: flatbuffers.Offset): void;
    static createConstraintsVector(builder: flatbuffers.Builder, data: ColumnConstraint[]): flatbuffers.Offset;
    static startConstraintsVector(builder: flatbuffers.Builder, numElems: number): void;
    static addCustomOptions(builder: flatbuffers.Builder, customOptionsOffset: flatbuffers.Offset): void;
    static endTableColumn(builder: flatbuffers.Builder): flatbuffers.Offset;
}
//# sourceMappingURL=table-column.d.ts.map