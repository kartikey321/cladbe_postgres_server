import { z } from "zod";

export const subscribeSchema = z.object({
    op: z.literal("subscribe"),
    table: z.string().min(1),
    hashId: z.string().min(1),
    // accept either a FlatBuffer b64 OR a JSON string (we’ll convert it server-side)
    queryFbB64: z.string().min(1).optional(),
    queryJson: z.string().min(1).optional(),
    resumeFromVersion: z.number().int().nonnegative().optional(),
}).refine(s => !!s.queryFbB64 || !!s.queryJson, {
    message: "Either queryFbB64 or queryJson must be provided",
});

export const unsubscribeSchema = z.object({
    op: z.literal("unsubscribe"),
    table: z.string().min(1),
    hashId: z.string().min(1),
});

export const rpcSchema = z.object({
    op: z.literal("rpc"),
    method: z.string().min(1), // e.g. "GET_SINGLE"
    companyId: z.string().optional(),
    table: z.string().optional(),
    payload: z.any().optional(),
    correlationId: z.string().optional(),
});