// src/state.ts
import type { SubKey } from "./types.js";

/**
 * Session
 *
 * Represents a connected WS client and its active subscriptions. Delivery paths
 * use this to route diffs, buffer JSON frames under backpressure, and keep
 * per-connection context.
 */
export interface Session {
    id: string;
    socket: any;             // uWS.WebSocket
    userId: string;
    tenantId: string;
    subs: Set<SubKey>;
    sendQueue: string[];     // backpressure buffer (serialized frames)
};

/** All active sessions keyed by connection id. */
export const sessions = new Map<string, Session>();

/**
 * Reverse index: subKey → set of session ids.
 * subKey is whatever callers pass (we typically use `hashId`). If you support
 * multi-tenant routing, ensure the string is already namespaced upstream to avoid
 * collisions; the gateway treats it as opaque.
 */
export const subToSessions = new Map<SubKey, Set<string>>();

/** Add a subscription mapping for a session. */
export function addSub(s: Session, key: SubKey) {
    if (!s.subs.has(key)) {
        s.subs.add(key);
        if (!subToSessions.has(key)) subToSessions.set(key, new Set());
        subToSessions.get(key)!.add(s.id);
    }
}

/** Remove a subscription mapping; drops the index entry if last subscriber leaves. */
export function removeSub(s: Session, key: SubKey) {
    if (s.subs.delete(key)) {
        const g = subToSessions.get(key);
        if (g) {
            g.delete(s.id);
            if (g.size === 0) subToSessions.delete(key);
        }
    }
}