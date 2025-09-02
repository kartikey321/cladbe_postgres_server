// src/ws/schemas.ts
import { z } from "zod";

/** Schema for client→server subscribe op. Includes optional resume LSN hint. */
export const subscribeSchema = z.object({
  op: z.literal("subscribe"),
  table: z.string().min(1),
  hashId: z.string().min(1),
  queryFbB64: z.string().min(1),
  resumeFromVersion: z.number().int().nonnegative().optional(),
});

/** Schema for client→server unsubscribe op. */
export const unsubscribeSchema = z.object({
  op: z.literal("unsubscribe"),
  table: z.string().min(1),
  hashId: z.string().min(1),
});
