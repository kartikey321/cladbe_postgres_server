import * as flatbuffers from 'flatbuffers';
export declare class UpdateSingleReq {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): UpdateSingleReq;
    static getRootAsUpdateSingleReq(bb: flatbuffers.ByteBuffer, obj?: UpdateSingleReq): UpdateSingleReq;
    static getSizePrefixedRootAsUpdateSingleReq(bb: flatbuffers.ByteBuffer, obj?: UpdateSingleReq): UpdateSingleReq;
    companyId(): string | null;
    companyId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    tableName(): string | null;
    tableName(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    primaryKeyColumn(): string | null;
    primaryKeyColumn(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    primaryId(): string | null;
    primaryId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    updatesJson(): string | null;
    updatesJson(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startUpdateSingleReq(builder: flatbuffers.Builder): void;
    static addCompanyId(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset): void;
    static addTableName(builder: flatbuffers.Builder, tableNameOffset: flatbuffers.Offset): void;
    static addPrimaryKeyColumn(builder: flatbuffers.Builder, primaryKeyColumnOffset: flatbuffers.Offset): void;
    static addPrimaryId(builder: flatbuffers.Builder, primaryIdOffset: flatbuffers.Offset): void;
    static addUpdatesJson(builder: flatbuffers.Builder, updatesJsonOffset: flatbuffers.Offset): void;
    static endUpdateSingleReq(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createUpdateSingleReq(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset, tableNameOffset: flatbuffers.Offset, primaryKeyColumnOffset: flatbuffers.Offset, primaryIdOffset: flatbuffers.Offset, updatesJsonOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=update-single-req.d.ts.map