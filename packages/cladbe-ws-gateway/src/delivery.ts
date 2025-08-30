// src/delivery.ts
import type { SubState } from "./lsn.js";
import { asArrayBuffer } from "./lsn.js";
import { MAX_QUEUE } from "./config.js";
import { sessions } from "./state.js";

// global backpressure counter (exported so we can show in /health and pause CDC)
export let SLOW_SOCKETS = 0;

export function deliverBinaryLSN(hashId: string, payload: Buffer, lsn: bigint, onlySession?: any) {
    const targetSessions = onlySession ? [onlySession] : [...sessions.values()];
    let delivered = 0;

    for (const st of targetSessions) {
        for (const key of st.subs) {
            if (!key.endsWith(hashId)) continue;
            const subStates: Map<string, SubState> = (st as any).subStates ?? new Map();
            const sub = subStates.get(key);
            if (!sub) continue;

            if (sub.buffering) { sub.buffer.push({ lsn, payload }); continue; }
            if (lsn <= sub.cursorLsn) continue;

            const ok = st.socket.send(asArrayBuffer(payload), true, false);
            if (ok) {
                sub.cursorLsn = lsn;
                delivered++;
            } else {
                const b64 = payload.toString("base64");
                st.sendQueue.push(JSON.stringify({ op: "diffB64", hashId, b64 }));
                if (!(st as any)._slow) { (st as any)._slow = true; SLOW_SOCKETS++; }
                if (st.sendQueue.length > MAX_QUEUE) {
                    st.sendQueue.length = 0;
                    st.socket.send(JSON.stringify({ op: "error", code: "overflow", message: "reset-to-snapshot" }));
                }
            }
        }
    }
    return delivered;
}