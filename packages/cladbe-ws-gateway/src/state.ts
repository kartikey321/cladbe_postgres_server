import type { SubKey } from "./types";

export interface Session {
    id: string;
    socket: any;             // uWS.WebSocket
    userId: string;
    tenantId: string;
    subs: Set<SubKey>;
    sendQueue: string[];     // backpressure buffer (serialized frames)
};

export const sessions = new Map<string, Session>();

// Subscriptions: subKey -> Set(sessionId)
export const subToSessions = new Map<SubKey, Set<string>>();

export function addSub(s: Session, key: SubKey) {
    if (!s.subs.has(key)) {
        s.subs.add(key);
        if (!subToSessions.has(key)) subToSessions.set(key, new Set());
        subToSessions.get(key)!.add(s.id);
    }
}

export function removeSub(s: Session, key: SubKey) {
    if (s.subs.delete(key)) {
        const g = subToSessions.get(key);
        if (g) {
            g.delete(s.id);
            if (g.size === 0) subToSessions.delete(key);
        }
    }
}