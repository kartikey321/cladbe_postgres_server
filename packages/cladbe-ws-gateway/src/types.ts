export type ClientMsg =
    | { op: "ping" }
    | { op: "subscribe"; table: string; hashId: string; queryFbB64: string; resumeFromVersion?: number }
    | { op: "unsubscribe"; table: string; hashId: string };

export type ServerMsg =
    | { op: "pong" }
    | { op: "ack"; hashId: string }
    | { op: "snapshot"; hashId: string; version: number; cursor: Record<string, any>; rows: any[] }
    | { op: "diff"; hashId: string; version: number; cursor: Record<string, any>; changes: any[] }
    | { op: "diffB64"; hashId: string; b64: string }
    | { op: "error"; code: string; message: string };

export type SubKey = string; // `${table}|${hashId}`
export const subKey = (_table: string, hashId: string) => hashId; // <— route by hashId only