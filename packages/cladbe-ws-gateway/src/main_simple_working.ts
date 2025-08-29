import uWS from "uWebSockets.js";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.WS_PORT || 7000);
const PING_INTERVAL_MS = 30_000;

// Store active connections
const connections = new Map<string, {
    id: string;
    socket: uWS.WebSocket<any>;
    userId?: string;
}>();

// Message types
interface ClientMessage {
    type: string;
    data?: any;
}

interface ServerMessage {
    type: string;
    data?: any;
    timestamp?: number;
}

function safeSend(ws: uWS.WebSocket<any>, message: ServerMessage) {
    try {
        const payload = JSON.stringify({
            ...message,
            timestamp: Date.now()
        });
        ws.send(payload);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function broadcast(message: ServerMessage, excludeId?: string) {
    for (const [id, conn] of connections) {
        if (excludeId && id === excludeId) continue;
        safeSend(conn.socket, message);
    }
}

const app = uWS.App({})
    .ws("/*", {
        // WebSocket configuration
        idleTimeout: 60,
        maxBackpressure: 64 * 1024, // 64KB
        maxPayloadLength: 16 * 1024, // 16KB

        // Handle connection upgrade
        upgrade: (res, req, context) => {
            const userId = req.getHeader("x-user-id") || "anonymous";

            res.upgrade(
                { userId }, // user data
                req.getHeader("sec-websocket-key"),
                req.getHeader("sec-websocket-protocol"),
                req.getHeader("sec-websocket-extensions"),
                context
            );
        },

        // Handle new connection
        open: (ws) => {
            const id = randomUUID();
            const userId = (ws as any).userId;

            // Store connection
            connections.set(id, {
                id,
                socket: ws,
                userId
            });

            // Attach ID to socket for cleanup
            (ws as any).connectionId = id;

            console.log(`Client connected: ${id} (user: ${userId})`);

            // Send welcome message
            safeSend(ws, {
                type: "welcome",
                data: {
                    connectionId: id,
                    connectedClients: connections.size
                }
            });

            // Notify other clients
            broadcast({
                type: "user_joined",
                data: { userId, connectionId: id }
            }, id);

            // Setup heartbeat
            const heartbeat = setInterval(() => {
                try {
                    ws.ping();
                } catch (error) {
                    console.error('Heartbeat error:', error);
                    clearInterval(heartbeat);
                }
            }, PING_INTERVAL_MS);

            (ws as any).heartbeat = heartbeat;
        },

        // Handle incoming messages
        message: (ws, arrayBuffer, isBinary) => {
            const connectionId = (ws as any).connectionId;
            const conn = connections.get(connectionId);

            if (!conn) return;

            if (isBinary) {
                console.log(`Received binary message from ${connectionId}`);
                return;
            }

            let clientMessage: ClientMessage;
            try {
                const text = Buffer.from(arrayBuffer).toString("utf8");
                clientMessage = JSON.parse(text);
            } catch (error) {
                safeSend(ws, {
                    type: "error",
                    data: { message: "Invalid JSON message" }
                });
                return;
            }

            console.log(`Message from ${connectionId}:`, clientMessage);

            // Handle different message types
            switch (clientMessage.type) {
                case "ping":
                    safeSend(ws, { type: "pong" });
                    break;

                case "echo":
                    safeSend(ws, {
                        type: "echo_response",
                        data: clientMessage.data
                    });
                    break;

                case "broadcast":
                    broadcast({
                        type: "broadcast_message",
                        data: {
                            from: conn.userId,
                            message: clientMessage.data
                        }
                    });
                    break;

                case "get_status":
                    safeSend(ws, {
                        type: "status",
                        data: {
                            connectedClients: connections.size,
                            uptime: process.uptime()
                        }
                    });
                    break;

                default:
                    safeSend(ws, {
                        type: "error",
                        data: { message: `Unknown message type: ${clientMessage.type}` }
                    });
            }
        },

        // Handle connection close
        close: (ws) => {
            const connectionId = (ws as any).connectionId;
            const conn = connections.get(connectionId);

            if (conn) {
                console.log(`Client disconnected: ${connectionId}`);

                // Cleanup heartbeat
                if ((ws as any).heartbeat) {
                    clearInterval((ws as any).heartbeat);
                }

                // Remove from connections
                connections.delete(connectionId);

                // Notify other clients
                broadcast({
                    type: "user_left",
                    data: { userId: conn.userId, connectionId }
                });
            }
        },

        // Handle pong responses
        pong: (ws) => {
            // Client responded to ping - connection is alive
            const connectionId = (ws as any).connectionId;
            console.log(`Pong received from ${connectionId}`);
        },

        // Handle socket drain (backpressure relief)
        drain: (ws) => {
            const connectionId = (ws as any).connectionId;
            console.log(`Socket drained for ${connectionId}`);
        }
    })

    // Health check endpoint
    .get("/health", (res, req) => {
        res.writeHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            status: "healthy",
            connections: connections.size,
            uptime: process.uptime()
        }));
    })

    // Default route
    .any("/*", (res, req) => {
        res.writeStatus("404 Not Found");
        res.end("WebSocket server running");
    })

    // Start server
    .listen(PORT, (token) => {
        if (token) {
            console.log(`✅ WebSocket server listening on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        } else {
            console.error("❌ Failed to listen on port", PORT);
            process.exit(1);
        }
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📴 Shutting down WebSocket server...');

    // Close all connections
    for (const [id, conn] of connections) {
        safeSend(conn.socket, {
            type: "server_shutdown",
            data: { message: "Server is shutting down" }
        });
        conn.socket.close();
    }

    process.exit(0);
});

// Log server stats periodically
setInterval(() => {
    if (connections.size > 0) {
        console.log(`📊 Active connections: ${connections.size}`);
    }
}, 60_000);