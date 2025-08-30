import * as flatbuffers from 'flatbuffers';
export declare class DeleteRowReq {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): DeleteRowReq;
    static getRootAsDeleteRowReq(bb: flatbuffers.ByteBuffer, obj?: DeleteRowReq): DeleteRowReq;
    static getSizePrefixedRootAsDeleteRowReq(bb: flatbuffers.ByteBuffer, obj?: DeleteRowReq): DeleteRowReq;
    companyId(): string | null;
    companyId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    tableName(): string | null;
    tableName(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    primaryKeyColumn(): string | null;
    primaryKeyColumn(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    primaryId(): string | null;
    primaryId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startDeleteRowReq(builder: flatbuffers.Builder): void;
    static addCompanyId(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset): void;
    static addTableName(builder: flatbuffers.Builder, tableNameOffset: flatbuffers.Offset): void;
    static addPrimaryKeyColumn(builder: flatbuffers.Builder, primaryKeyColumnOffset: flatbuffers.Offset): void;
    static addPrimaryId(builder: flatbuffers.Builder, primaryIdOffset: flatbuffers.Offset): void;
    static endDeleteRowReq(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createDeleteRowReq(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset, tableNameOffset: flatbuffers.Offset, primaryKeyColumnOffset: flatbuffers.Offset, primaryIdOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=delete-row-req.d.ts.map