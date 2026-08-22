FROM oven/bun:1.3.11 AS builder

WORKDIR /repo

# Install Node.js because Medusa uses Node.js tooling during the build
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Copy root workspace files
COPY package.json bun.lock turbo.json tsconfig.base.json tsconfig.json ./

# Copy workspace package manifests
COPY apps/admin/package.json apps/admin/package.json
COPY apps/vendor/package.json apps/vendor/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY packages/api/package.json packages/api/package.json

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the complete repository
COPY . .

# Build settings
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV TURBO_TELEMETRY_DISABLED=1

# Build the API and everything it depends on
RUN bunx turbo run build --filter=@acme/api...

# Remove development dependencies from the generated Medusa server
RUN node -e "\
const fs=require('fs'); \
const p='packages/api/.medusa/server/package.json'; \
const pkg=JSON.parse(fs.readFileSync(p,'utf8')); \
delete pkg.devDependencies; \
fs.writeFileSync(p,JSON.stringify(pkg,null,2)); \
"

# Install only production dependencies
RUN cd packages/api/.medusa/server && bun install --production


# ============================================================
# Production image
# ============================================================

FROM oven/bun:1.3.11 AS runtime

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates nodejs npm \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Runtime environment variables
ARG DATABASE_URL
ARG REDIS_URL
ARG MEDUSA_WORKER_MODE

ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
ENV MEDUSA_WORKER_MODE=$MEDUSA_WORKER_MODE

# Copy the compiled Medusa server
COPY --from=builder /repo/packages/api/.medusa/server ./

# Copy seed scripts into the production image
COPY --from=builder /repo/packages/api/src/scripts ./src/scripts

EXPOSE 9000

# Run database migrations before starting Medusa
CMD ["sh", "-c", "bunx medusa db:migrate && bun run start"]