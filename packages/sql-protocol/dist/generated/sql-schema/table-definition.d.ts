import * as flatbuffers from 'flatbuffers';
import { TableColumn } from '../sql-schema/table-column.js';
import { TableOptions } from '../sql-schema/table-options.js';
export declare class TableDefinition {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TableDefinition;
    static getRootAsTableDefinition(bb: flatbuffers.ByteBuffer, obj?: TableDefinition): TableDefinition;
    static getSizePrefixedRootAsTableDefinition(bb: flatbuffers.ByteBuffer, obj?: TableDefinition): TableDefinition;
    name(): string | null;
    name(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    columns(index: number, obj?: TableColumn): TableColumn | null;
    columnsLength(): number;
    comment(): string | null;
    comment(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    tableOptions(obj?: TableOptions): TableOptions | null;
    static startTableDefinition(builder: flatbuffers.Builder): void;
    static addName(builder: flatbuffers.Builder, nameOffset: flatbuffers.Offset): void;
    static addColumns(builder: flatbuffers.Builder, columnsOffset: flatbuffers.Offset): void;
    static createColumnsVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startColumnsVector(builder: flatbuffers.Builder, numElems: number): void;
    static addComment(builder: flatbuffers.Builder, commentOffset: flatbuffers.Offset): void;
    static addTableOptions(builder: flatbuffers.Builder, tableOptionsOffset: flatbuffers.Offset): void;
    static endTableDefinition(builder: flatbuffers.Builder): flatbuffers.Offset;
}
//# sourceMappingURL=table-definition.d.ts.map