import { startRpcWorker } from "./rpc/worker";

startRpcWorker().catch((err) => {
    console.error("RPC worker failed to start:", err);
    process.exit(1);
});
