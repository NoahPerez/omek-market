FROM oven/bun:1.3.11 AS builder
WORKDIR /repo

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace root manifests
COPY package.json bun.lock turbo.json tsconfig.base.json tsconfig.json ./

# Copy all package manifests across workspace
COPY apps/admin/package.json apps/admin/
COPY apps/vendor/package.json apps/vendor/
COPY apps/storefront/package.json apps/storefront/
COPY packages/api/package.json packages/api/
COPY packages/ packages/

RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
# Increase Node memory limit to prevent Vite/Node crash during build
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV TURBO_TELEMETRY_DISABLED=1

# Run the Turbo build for the API and its dependencies
RUN bunx turbo run build --filter=@acme/api...

# Clean devDependencies from backend package manifest
RUN node -e "const fs=require('fs');const p='packages/api/.medusa/server/package.json';const pkg=JSON.parse(fs.readFileSync(p,'utf8'));delete pkg.devDependencies;fs.writeFileSync(p,JSON.stringify(pkg,null,2));"

# Install production dependencies inside compiled backend directory
RUN cd packages/api/.medusa/server && bun install --production

FROM oven/bun:1.3.11 AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

ARG DATABASE_URL
ARG REDIS_URL
ARG MEDUSA_WORKER_MODE

ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
ENV MEDUSA_WORKER_MODE=$MEDUSA_WORKER_MODE

COPY --from=builder /repo/packages/api/.medusa/server ./

EXPOSE 9000

CMD ["sh", "-c", "bunx medusa db:migrate && bun run start"]