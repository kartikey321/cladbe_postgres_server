import * as flatbuffers from 'flatbuffers';
export declare class GetSingleReq {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): GetSingleReq;
    static getRootAsGetSingleReq(bb: flatbuffers.ByteBuffer, obj?: GetSingleReq): GetSingleReq;
    static getSizePrefixedRootAsGetSingleReq(bb: flatbuffers.ByteBuffer, obj?: GetSingleReq): GetSingleReq;
    companyId(): string | null;
    companyId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    tableName(): string | null;
    tableName(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    primaryKeyColumn(): string | null;
    primaryKeyColumn(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    primaryId(): string | null;
    primaryId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startGetSingleReq(builder: flatbuffers.Builder): void;
    static addCompanyId(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset): void;
    static addTableName(builder: flatbuffers.Builder, tableNameOffset: flatbuffers.Offset): void;
    static addPrimaryKeyColumn(builder: flatbuffers.Builder, primaryKeyColumnOffset: flatbuffers.Offset): void;
    static addPrimaryId(builder: flatbuffers.Builder, primaryIdOffset: flatbuffers.Offset): void;
    static endGetSingleReq(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createGetSingleReq(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset, tableNameOffset: flatbuffers.Offset, primaryKeyColumnOffset: flatbuffers.Offset, primaryIdOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=get-single-req.d.ts.map