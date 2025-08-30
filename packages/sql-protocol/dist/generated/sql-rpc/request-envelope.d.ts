import * as flatbuffers from 'flatbuffers';
import { RpcMethod } from '../sql-rpc/rpc-method.js';
import { RpcPayload } from '../sql-rpc/rpc-payload.js';
export declare class RequestEnvelope {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): RequestEnvelope;
    static getRootAsRequestEnvelope(bb: flatbuffers.ByteBuffer, obj?: RequestEnvelope): RequestEnvelope;
    static getSizePrefixedRootAsRequestEnvelope(bb: flatbuffers.ByteBuffer, obj?: RequestEnvelope): RequestEnvelope;
    correlationId(): string | null;
    correlationId(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    replyTopic(): string | null;
    replyTopic(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    method(): RpcMethod;
    payloadType(): RpcPayload;
    payload<T extends flatbuffers.Table>(obj: any): any | null;
    static startRequestEnvelope(builder: flatbuffers.Builder): void;
    static addCorrelationId(builder: flatbuffers.Builder, correlationIdOffset: flatbuffers.Offset): void;
    static addReplyTopic(builder: flatbuffers.Builder, replyTopicOffset: flatbuffers.Offset): void;
    static addMethod(builder: flatbuffers.Builder, method: RpcMethod): void;
    static addPayloadType(builder: flatbuffers.Builder, payloadType: RpcPayload): void;
    static addPayload(builder: flatbuffers.Builder, payloadOffset: flatbuffers.Offset): void;
    static endRequestEnvelope(builder: flatbuffers.Builder): flatbuffers.Offset;
    static finishRequestEnvelopeBuffer(builder: flatbuffers.Builder, offset: flatbuffers.Offset): void;
    static finishSizePrefixedRequestEnvelopeBuffer(builder: flatbuffers.Builder, offset: flatbuffers.Offset): void;
    static createRequestEnvelope(builder: flatbuffers.Builder, correlationIdOffset: flatbuffers.Offset, replyTopicOffset: flatbuffers.Offset, method: RpcMethod, payloadType: RpcPayload, payloadOffset: flatbuffers.Offset): flatbuffers.Offset;
}
//# sourceMappingURL=request-envelope.d.ts.map