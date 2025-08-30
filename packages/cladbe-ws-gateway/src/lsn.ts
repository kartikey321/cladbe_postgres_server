// src/lsn.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

export const HEADERS = {
    LSN: "lsn"
} as const;
export type SubState = {
    cursorLsn: bigint;
    buffering: boolean;
    buffer: Array<{ lsn: bigint; payload: Buffer }>;
};

export let LAST_SEEN_LSN: bigint = 0n;

export function readLsnHeader(raw: any): bigint {
    const hs: Array<{ key: string; value: any }> | undefined = raw?.headers;
    if (!hs) return 0n;
    const h = hs.find(x => x?.key === HEADERS.LSN);
    if (!h?.value) return 0n;
    const buf = Buffer.isBuffer(h.value) ? h.value : Buffer.from(String(h.value), "binary");
    return buf.length === 8 ? buf.readBigUInt64BE(0) : 0n;
}

export function asArrayBuffer(buf: Buffer): ArrayBuffer {
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}