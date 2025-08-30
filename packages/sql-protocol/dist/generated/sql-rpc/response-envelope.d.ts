import * as flatbuffers from 'flatbuffers';
import { ErrorCode } from '../sql-rpc/error-code.js';
import { RpcResponse } from '../sql-rpc/rpc-response.js';
export declare class ResponseEnvelope {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): ResponseEnvelope;
    static getRootAsResponseEnvelope(bb: flatbuffers.ByteBuffer, obj?: ResponseEnvelope): ResponseEnvelope;
    static getSizePrefixedRootAsResponseEnvelope(bb: flatbuffers.ByteBuffer, obj?: ResponseEnvelope): ResponseEnvelope;
    correlationId(): string | null;
    correlationId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    ok(): boolean;
    errorCode(): ErrorCode;
    errorMessage(): string | null;
    errorMessage(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    dataType(): RpcResponse;
    data<T extends flatbuffers.Table>(obj: any): any | null;
    static startResponseEnvelope(builder: flatbuffers.Builder): void;
    static addCorrelationId(builder: flatbuffers.Builder, correlationIdOffset: flatbuffers.Offset): void;
    static addOk(builder: flatbuffers.Builder, ok: boolean): void;
    static addErrorCode(builder: flatbuffers.Builder, errorCode: ErrorCode): void;
    static addErrorMessage(builder: flatbuffers.Builder, errorMessageOffset: flatbuffers.Offset): void;
    static addDataType(builder: flatbuffers.Builder, dataType: RpcResponse): void;
    static addData(builder: flatbuffers.Builder, dataOffset: flatbuffers.Offset): void;
    static endResponseEnvelope(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createResponseEnvelope(builder: flatbuffers.Builder, correlationIdOffset: flatbuffers.Offset, ok: boolean, errorCode: ErrorCode, errorMessageOffset: flatbuffers.Offset, dataType: RpcResponse, dataOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=response-envelope.d.ts.map