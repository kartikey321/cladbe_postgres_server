import * as flatbuffers from 'flatbuffers';
import { TableDefinition } from '../sql-schema/table-definition.js';
export declare class CreateTableReq {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): CreateTableReq;
    static getRootAsCreateTableReq(bb: flatbuffers.ByteBuffer, obj?: CreateTableReq): CreateTableReq;
    static getSizePrefixedRootAsCreateTableReq(bb: flatbuffers.ByteBuffer, obj?: CreateTableReq): CreateTableReq;
    companyId(): string | null;
    companyId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    definition(obj?: TableDefinition): TableDefinition | null;
    static startCreateTableReq(builder: flatbuffers.Builder): void;
    static addCompanyId(builder: flatbuffers.Builder, companyIdOffset: flatbuffers.Offset): void;
    static addDefinition(builder: flatbuffers.Builder, definitionOffset: flatbuffers.Offset): void;
    static endCreateTableReq(builder: flatbuffers.Builder): flatbuffers.Offset;
}
//# sourceMappingURL=create-table-req.d.ts.map