FROM oven/bun:1.3.11 AS builder

WORKDIR /repo

COPY package.json bun.lock turbo.json tsconfig.base.json tsconfig.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/vendor/package.json apps/vendor/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY packages/api/package.json packages/api/package.json

RUN bun install --frozen-lockfile

COPY . .

ARG MERCUR_BACKEND_URL
ENV NODE_ENV=production
ENV MERCUR_BACKEND_URL=$MERCUR_BACKEND_URL

RUN bunx turbo run build --filter=@acme/api...
RUN cd packages/api/.medusa/server && bun install --production

FROM oven/bun:1.3.11 AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /repo/packages/api/.medusa/server ./

EXPOSE 9000

CMD ["bun", "run", "start"]

