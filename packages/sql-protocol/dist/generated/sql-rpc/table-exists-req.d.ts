import * as flatbuffers from 'flatbuffers';
export declare class TableExistsReq {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TableExistsReq;
    static getRootAsTableExistsReq(bb: flatbuffers.ByteBuffer, obj?: TableExistsReq): TableExistsReq;
    static getSizePrefixedRootAsTableExistsReq(bb: flatbuffers.ByteBuffer, obj?: TableExistsReq): TableExistsReq;
    companyId(): string | null;
    companyId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    tableName(): string | null;
    tableName(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startTableExistsReq(builder: flatbuffers.Builder): void;
    static addCompanyId(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset): void;
    static addTableName(builder: flatbuffers.Builder, tableNameOffset: flatbuffers.Offset): void;
    static endTableExistsReq(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createTableExistsReq(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset, tableNameOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=table-exists-req.d.ts.map