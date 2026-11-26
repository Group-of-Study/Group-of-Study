# syntax=docker/dockerfile:1
# Imagem de produção (Next.js standalone). Construível sem Compose:
#   docker build -t group-of-study:prod .
#
# Prisma 7: config em prisma7.config.ts (auto-detectada pelo CLI 7.10+).
# Usamos --config explicitamente para não depender da ordem de busca.

# Imagem base fixada por digest (manifest list multi-arch) para builds reproduzíveis
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:be979e5523c76fa4d5ca4ebd3099078f220aa47ec39c48ad5b5df9314debd6eb

# -----------------------------------------------------------------------------
# Dependências (cache de layer com package-lock)
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./

# postinstall executa `prisma generate`; a URL não precisa ser um DB real
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"

RUN npm ci

# -----------------------------------------------------------------------------
# Build
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1

# Garante o client em src/generated/prisma (output do schema) após o COPY do código
RUN npx prisma generate --config prisma7.config.ts \
  && npm run build

# -----------------------------------------------------------------------------
# Runtime (não-root, standalone)
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Cliente Prisma (output customizado fora de node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts

USER nextjs

EXPOSE 3000

# Standalone: não use `npm start` / `next start` aqui — o servidor é server.js
CMD ["node", "server.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
