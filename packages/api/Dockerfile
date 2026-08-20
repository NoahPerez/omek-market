FROM oven/bun:1.3.11 AS builder

WORKDIR /repo

# 1. Removed unnecessary nodejs package
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock turbo.json tsconfig.base.json tsconfig.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/vendor/package.json apps/vendor/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY packages/api/package.json packages/api/package.json

RUN bun install --frozen-lockfile

COPY . .

# 2. Simplified build-time ARGs for Turbo build
ARG MERCUR_BACKEND_URL
ARG DATABASE_URL
ARG REDIS_URL
ARG STORE_CORS
ARG ADMIN_CORS
ARG VENDOR_CORS
ARG AUTH_CORS
ARG JWT_SECRET
ARG COOKIE_SECRET
ARG FILE_BACKEND_URL
ARG STOREFRONT_REVALIDATE_URL
ARG STOREFRONT_REVALIDATE_SECRET
ARG MERCUR_VENDOR_URL
ENV NODE_ENV=production

RUN bunx turbo run build --filter=@acme/api...
RUN node -e "const fs=require('fs');const p='packages/api/.medusa/server/package.json';const pkg=JSON.parse(fs.readFileSync(p,'utf8'));delete pkg.devDependencies;fs.writeFileSync(p,JSON.stringify(pkg,null,2));"
RUN cd packages/api/.medusa/server && bun install --production

FROM oven/bun:1.3.11 AS runtime

WORKDIR /app

# 3. Clean runtime dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /repo/packages/api/.medusa/server ./

EXPOSE 9000

# 4. Correct start command (uses medusa binary directly or bun start script)
CMD ["sh", "-c", "bun run db:migrate && bun run start"]