FROM oven/bun:1.3.11 AS builder

WORKDIR /repo

# Copy workspace setup files
COPY package.json bun.lock turbo.json tsconfig.base.json tsconfig.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/vendor/package.json apps/vendor/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY packages/api/package.json packages/api/package.json

RUN bun install --frozen-lockfile

COPY . .

# Build API target
RUN bunx turbo run build --filter=@acme/api...
RUN node -e "const fs=require('fs');const p='packages/api/.medusa/server/package.json';const pkg=JSON.parse(fs.readFileSync(p,'utf8'));delete pkg.devDependencies;fs.writeFileSync(p,JSON.stringify(pkg,null,2));"
RUN cd packages/api/.medusa/server && bun install --production

FROM oven/bun:1.3.11 AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Install essential dependencies (removed duplicate nodejs package to save ~100MB)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /repo/packages/api/.medusa/server ./

EXPOSE 9000

# Automatically run migrations before starting the Medusa API server
CMD ["sh", "-c", "bun run db:migrate && bun run start"]