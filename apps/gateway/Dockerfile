# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile

FROM base AS builder

COPY --from=deps /app/ ./
COPY . .

RUN pnpm --filter @fyxvo/config build \
  && pnpm --filter @fyxvo/database build \
  && pnpm --filter @fyxvo/gateway build \
  && pnpm --filter @fyxvo/gateway deploy --prod --legacy /out \
  && deploy_prisma_dir="$(find /out/node_modules/.pnpm -maxdepth 1 -type d -name '@prisma+client@*' | head -n 1)" \
  && build_prisma_dir="$(find /app/node_modules/.pnpm -maxdepth 1 -type d -name '@prisma+client@*' | head -n 1)" \
  && mkdir -p "${deploy_prisma_dir}/node_modules/.prisma/client" \
  && cp -R "${build_prisma_dir}/node_modules/.prisma/client/." "${deploy_prisma_dir}/node_modules/.prisma/client/"

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.23.0 --activate \
  && useradd --create-home --home-dir /home/fyxvo --shell /bin/bash --uid 10001 fyxvo

WORKDIR /app

COPY --from=builder /out/ ./

EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "const port = process.env.PORT || process.env.GATEWAY_PORT || '4100'; fetch(`http://127.0.0.1:${port}/health`).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1));"

USER fyxvo

CMD ["node", "dist/index.js"]
