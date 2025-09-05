// src/keydb.ts
/* Redis/KeyDB-backed HotCache with the same API used by the gateway.
   Data layout (per hashId):
     snap:{hashId} → JSON string of { rows, cursor:{lsn}, ts }  (SET PX ttl)
     diff:{hashId} → Redis LIST of JSON strings { lsn, b64 }    (RPUSH, LTRIM, EXPIRE)
*/

import IORedis, { Redis } from "ioredis";
import {
    KEYDB_PREFIX,
    HOTCACHE_MAX_DIFFS,
    HOTCACHE_RETENTION_MS,
    KEYDB_HOST,
    KEYDB_PORT,
    KEYDB_PASS,
} from "./config.js";

type LsnString = string;

/**
 * SnapshotPayload
 *
 * Why: Encodes a point-in-time view for a given query hashId returned to a subscriber.
 * How it fits: Stored under `snap:{hashId}` in KeyDB for quick warm snapshots, paired
 * with diffs to replay strict-after fence LSN. `cursor.lsn` tracks the WAL position.
 */
export type SnapshotPayload = {
    rows: any[];
    cursor: { lsn: LsnString };
    ts: number; // epoch millis
};

type Diff = { lsn: LsnString; b64: string };

/**
 * HotCache options
 *
 * - maxDiffsPerKey: cap diff history to bound memory; newest retained.
 * - retentionMs: TTL for snapshots/diffs to self-clean stale keys.
 * - url/prefix/redis: override connection and namespacing.
 */
export type HotCacheOpts = {
    /** cap per-hash diff list length (default from env). */
    maxDiffsPerKey?: number;
    /** expire snapshots & diffs after this many ms (0/undefined to disable). */
    retentionMs?: number;
    /** override redis connection or url/prefix if needed */
    url?: string;
    prefix?: string;
    redis?: Redis;
};

/**
 * HotCache
 *
 * Role: Small Redis/KeyDB-backed cache that keeps a recent snapshot and a tail of diffs
 * per query hashId. This enables fast subscribe-time snapshots and deterministic catch-up:
 * replay of diffs strictly after the subscribe fence LSN.
 *
 * External systems: Uses KeyDB/Redis for durability across process restarts and to serve
 * multiple gateway instances consistently.
 */
export class HotCache {
    private redis: Redis;
    private prefix: string;
    private maxDiffsPerKey: number;
    private retentionMs: number | null;

    /** Create a new HotCache instance; by default uses env-provided URL/prefix. */
    constructor(opts: HotCacheOpts = {}) {
        this.redis = opts.redis ?? new Redis({
            host: KEYDB_HOST,
            port: Number(KEYDB_PORT),
            password: KEYDB_PASS
        });
        this.prefix = (opts.prefix ?? KEYDB_PREFIX).replace(/\s+/g, "");
        this.maxDiffsPerKey = opts.maxDiffsPerKey ?? HOTCACHE_MAX_DIFFS;
        const r = opts.retentionMs ?? HOTCACHE_RETENTION_MS;
        this.retentionMs = r && r > 0 ? r : null;
    }


    /**
 * Fetch the ordered PK list for a page: LRANGE hcache:range:{hashId} 0 -1
 * Returns [] if key is missing/expired.
 */
    async range(hashId: string): Promise<string[]> {
        try {
            const key = `${this.prefix}range:${hashId}`;
            // node-redis v4
            // const pks = await this.redis.lRange(key, 0, -1);

            // ioredis
            const pks = await (this as any).redis.lrange(key, 0, -1);
            return Array.isArray(pks) ? pks.map(String) : [];
        } catch {
            return [];
        }
    }

    // ---------- Public API (unchanged shape) ----------

    /**
     * Fetch a cached snapshot for `hashId` if present.
     * Assumptions: Snapshots are reasonably fresh; callers may enforce freshness by
     * comparing `cursor.lsn` or timestamp vs. subscribe fence.
     */
    async getSnapshot(hashId: string): Promise<SnapshotPayload | null> {
        const s = await this.redis.get(this.kSnap(hashId));
        if (!s) return null;
        try {
            const parsed = JSON.parse(s);
            // shape guard
            if (!parsed || typeof parsed !== "object") return null;
            return parsed as SnapshotPayload;
        } catch {
            return null;
        }
    }

    /**
     * Persist a snapshot and align the diff list to start strictly after `snap.cursor.lsn`.
     * Why: Prevents re-sending diffs that are already reflected in the snapshot.
     */
    async setSnapshot(hashId: string, snap: SnapshotPayload): Promise<void> {
        const snapKey = this.kSnap(hashId);
        const diffKey = this.kDiff(hashId);
        const px = this.retentionMs ?? undefined;

        const pipe = this.redis.pipeline();

        // use psetex when TTL is present; set otherwise (avoids the TS overload issue)
        if (px) {
            pipe.psetex(snapKey, px, JSON.stringify(snap));
            pipe.pexpire(diffKey, px);
        } else {
            pipe.set(snapKey, JSON.stringify(snap));
        }

        // optional pruning: drop diffs <= snapshot cursor
        pipe.lrange(diffKey, 0, -1);

        const res = await pipe.exec();

        try {
            const arr: string[] = (res?.[res.length - 1]?.[1] as string[]) || [];
            if (arr.length > 0) {
                const fence = BigInt(snap.cursor?.lsn ?? "0");
                let keepFrom = 0;
                for (let i = 0; i < arr.length; i++) {
                    const d = JSON.parse(arr[i]) as { lsn: string };
                    if (BigInt(d.lsn) > fence) { keepFrom = i; break; }
                    if (i === arr.length - 1) keepFrom = arr.length;
                }
                if (keepFrom > 0) {
                    await this.redis.ltrim(diffKey, keepFrom, -1);
                }
            }
        } catch {
            // non-fatal
        }
    }

    /** Store a diff for replay; append to tail and trim to `maxDiffsPerKey`. */
    async addDiff(hashId: string, lsn: LsnString, b64: string): Promise<void> {
        const diffKey = this.kDiff(hashId);
        const item = JSON.stringify({ lsn, b64 } satisfies Diff);
        const pipe = this.redis.pipeline();
        pipe.rpush(diffKey, item);
        // keep last N items
        pipe.ltrim(diffKey, -this.maxDiffsPerKey, -1);
        if (this.retentionMs) pipe.pexpire(diffKey, this.retentionMs);
        await pipe.exec();
    }

    /** Return diffs with LSN strictly greater than `fence` (strict-after replay). */
    async diffsAfter(hashId: string, fence: bigint): Promise<Diff[]> {
        const raw = await this.redis.lrange(this.kDiff(hashId), 0, -1);
        if (!raw || raw.length === 0) return [];
        const out: Diff[] = [];
        for (let i = 0; i < raw.length; i++) {
            try {
                const d = JSON.parse(raw[i]) as Diff;
                if (BigInt(d.lsn) > fence) out.push(d);
            } catch { /* ignore bad entries */ }
        }
        return out;
    }

    /** Optional: purge everything for a key (e.g., on unsubscribe or cleanup). */
    async clear(hashId: string): Promise<void> {
        await this.redis.del(this.kSnap(hashId), this.kDiff(hashId));
    }

    // ---------- internals ----------
    private kSnap(hashId: string) { return `${this.prefix}snap:${hashId}`; }
    private kDiff(hashId: string) { return `${this.prefix}diff:${hashId}`; }
}
