FROM oven/bun:1.3.11 AS builder

WORKDIR /repo

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates nodejs \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock turbo.json tsconfig.base.json tsconfig.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/vendor/package.json apps/vendor/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY packages/api/package.json packages/api/package.json

RUN bun install --frozen-lockfile

COPY . .

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
ENV MERCUR_BACKEND_URL=$MERCUR_BACKEND_URL
ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
ENV STORE_CORS=$STORE_CORS
ENV ADMIN_CORS=$ADMIN_CORS
ENV VENDOR_CORS=$VENDOR_CORS
ENV AUTH_CORS=$AUTH_CORS
ENV JWT_SECRET=$JWT_SECRET
ENV COOKIE_SECRET=$COOKIE_SECRET
ENV FILE_BACKEND_URL=$FILE_BACKEND_URL
ENV STOREFRONT_REVALIDATE_URL=$STOREFRONT_REVALIDATE_URL
ENV STOREFRONT_REVALIDATE_SECRET=$STOREFRONT_REVALIDATE_SECRET
ENV MERCUR_VENDOR_URL=$MERCUR_VENDOR_URL

RUN bunx turbo run build --filter=@acme/api...
RUN node -e "const fs=require('fs');const p='packages/api/.medusa/server/package.json';const pkg=JSON.parse(fs.readFileSync(p,'utf8'));delete pkg.devDependencies;fs.writeFileSync(p,JSON.stringify(pkg,null,2));"
RUN cd packages/api/.medusa/server && bun install --production

FROM oven/bun:1.3.11 AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates nodejs \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /repo/packages/api/.medusa/server ./

EXPOSE 9000

CMD ["bun", "run", "start"]
