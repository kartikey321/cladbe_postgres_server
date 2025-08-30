import * as flatbuffers from 'flatbuffers';
export declare class AddSingleReq {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): AddSingleReq;
    static getRootAsAddSingleReq(bb: flatbuffers.ByteBuffer, obj?: AddSingleReq): AddSingleReq;
    static getSizePrefixedRootAsAddSingleReq(bb: flatbuffers.ByteBuffer, obj?: AddSingleReq): AddSingleReq;
    companyId(): string | null;
    companyId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    tableName(): string | null;
    tableName(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    primaryKeyColumn(): string | null;
    primaryKeyColumn(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    rowJson(): string | null;
    rowJson(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startAddSingleReq(builder: flatbuffers.Builder): void;
    static addCompanyId(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset): void;
    static addTableName(builder: flatbuffers.Builder, tableNameOffset: flatbuffers.Offset): void;
    static addPrimaryKeyColumn(builder: flatbuffers.Builder, primaryKeyColumnOffset: flatbuffers.Offset): void;
    static addRowJson(builder: flatbuffers.Builder, rowJsonOffset: flatbuffers.Offset): void;
    static endAddSingleReq(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createAddSingleReq(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset, tableNameOffset: flatbuffers.Offset, primaryKeyColumnOffset: flatbuffers.Offset, rowJsonOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=add-single-req.d.ts.map