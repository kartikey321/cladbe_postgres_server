# ---------- Stage 1: build ----------
FROM node:20-bullseye AS builder

WORKDIR /app

# Build deps for node-rdkafka (needs librdkafka headers)
RUN apt-get update && apt-get install -y \
    build-essential pkg-config python3 librdkafka-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy monorepo
COPY . .

# Install deps for all workspaces (uses root package.json workspaces)
RUN npm install

# Build each workspace
RUN npm run --workspace @cladbe/postgres_manager build \
 && npm run --workspace @cladbe/server build \
 && npm run --workspace @cladbe/postgres_rpc build \
 && npm run --workspace cladbe-ws-gateway build \
 && npm run --workspace @cladbe/shared-config build \
 && npm run --workspace @cladbe/sql-protocol build || true

# ---------- Stage 2: runtime ----------
FROM node:20-bullseye

WORKDIR /app

# Runtime libs for node-rdkafka
RUN apt-get update && apt-get install -y \
    librdkafka1 \
    && rm -rf /var/lib/apt/lists/*

# PM2 to run multiple processes defined in ecosystem.config.js
RUN npm i -g pm2

# Bring built app + node_modules
COPY --from=builder /app /app

# Expose HTTP + WS ports (match your ecosystem configs)
EXPOSE 7500 7000

# Start all apps via PM2
CMD ["pm2-runtime", "ecosystem.config.js"]