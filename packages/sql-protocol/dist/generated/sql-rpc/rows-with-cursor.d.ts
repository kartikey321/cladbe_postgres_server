import * as flatbuffers from 'flatbuffers';
import { CursorEntry } from '../sql-schema/cursor-entry.js';
export declare class RowsWithCursor {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): RowsWithCursor;
    static getRootAsRowsWithCursor(bb: flatbuffers.ByteBuffer, obj?: RowsWithCursor): RowsWithCursor;
    static getSizePrefixedRootAsRowsWithCursor(bb: flatbuffers.ByteBuffer, obj?: RowsWithCursor): RowsWithCursor;
    rows(index: number): string;
    rows(index: number, optionalEncoding: flatbuffers.Encoding): string | Uint8Array;
    rowsLength(): number;
    cursor(index: number, obj?: CursorEntry): CursorEntry | null;
    cursorLength(): number;
    static startRowsWithCursor(builder: flatbuffers.Builder): void;
    static addRows(builder: flatbuffers.Builder, rowsOffset: flatbuffers.Offset): void;
    static createRowsVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startRowsVector(builder: flatbuffers.Builder, numElems: number): void;
    static addCursor(builder: flatbuffers.Builder, cursorOffset: flatbuffers.Offset): void;
    static createCursorVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startCursorVector(builder: flatbuffers.Builder, numElems: number): void;
    static endRowsWithCursor(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createRowsWithCursor(builder: flatbuffers.Builder, rowsOffset: flatbuffers.Offset, cursorOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=rows-with-cursor.d.ts.map