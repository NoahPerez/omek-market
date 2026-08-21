FROM oven/bun:1.3.11 AS builder
WORKDIR /repo

# Copy workspace configuration and dependencies
COPY package.json bun.lock turbo.json tsconfig.base.json tsconfig.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/vendor/package.json apps/vendor/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY packages/api/package.json packages/api/package.json

# Install dependencies across all workspace packages
RUN bun install --frozen-lockfile

# Copy application code
COPY . .

# Build the Medusa API target using Turbo
RUN bunx turbo run build --filter=@acme/api...

# Production Runtime Stage
FROM oven/bun:1.3.11 AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy compiled standalone server bundle from builder stage
COPY --from=builder /repo/packages/api/.medusa/server ./

EXPOSE 9000

CMD ["sh", "-c", "bun run db:migrate && bun run start"]