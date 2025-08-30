//packages/postgres_rpc/src/index.ts
import { startRpcWorker } from "./rpc/worker.js";
startRpcWorker().catch((err) => {
    console.error("RPC worker failed to start:", err);
    process.exit(1);
});
