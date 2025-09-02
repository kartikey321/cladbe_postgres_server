// src/ws/app.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import uWS from "uWebSockets.js";
import { sessions } from "../state.js";
import { SLOW_SOCKETS } from "../delivery.js";
import { createWsHandlers } from "./handlers.js";
import type { WsDeps } from "./wire.js";

/**
 * Create the uWS application with WS endpoint and a health probe.
 *
 * Why: Aggregates the WS behavior (subscribe/unsubscribe handling via handlers)
 * and exposes /health to aid orchestration and debugging.
 * How it fits: Mounted by main.ts to accept client connections and surface
 * slow socket metrics used by the CDC flow-control.
 */
export function createWsApp(deps: WsDeps) {
  const handlers = createWsHandlers(deps);

  return uWS.App({})
    .ws("/*", handlers)
    .get("/health", (res, _req) => {
      res.writeHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        status: "healthy",
        connections: [...sessions.keys()].length,
        sessions: sessions.size,
        uptime: process.uptime(),
        slowSockets: SLOW_SOCKETS
      }));
    })
    .any("/*", (res, _req) => void res.writeStatus("200 OK").end("cladbe-ws-gateway"));
}
