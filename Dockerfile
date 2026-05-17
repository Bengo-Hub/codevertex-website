# syntax=docker/dockerfile:1
# Codevertex Website — Production Dockerfile
# Next.js 16 standalone output, node:20-alpine

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before build
RUN pnpm exec prisma generate

# NEXT_PUBLIC_* are baked at build time — must be passed as build args
ARG NEXT_PUBLIC_TREASURY_TENANT=codevertex
ARG NEXT_PUBLIC_SSO_URL=https://accounts.codevertexitsolutions.com
ARG NEXT_PUBLIC_TREASURY_PAY_URL=https://books.codevertexitsolutions.com/pay
ENV NEXT_PUBLIC_TREASURY_TENANT=$NEXT_PUBLIC_TREASURY_TENANT
ENV NEXT_PUBLIC_SSO_URL=$NEXT_PUBLIC_SSO_URL
ENV NEXT_PUBLIC_TREASURY_PAY_URL=$NEXT_PUBLIC_TREASURY_PAY_URL

RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install CLI tools and seed runtime deps globally.
# NODE_PATH (set below) exposes /usr/local/lib/node_modules to Node.js module
# resolution. This is necessary because prisma/seed.ts is not a Next.js route —
# its imports (@prisma/adapter-pg, pg) are never traced into standalone/node_modules
# by Next.js file tracing. Global install + NODE_PATH is the only approach that
# is guaranteed to work regardless of the standalone output structure.
RUN npm install -g prisma@7 tsx @prisma/adapter-pg@7 pg@8
ENV NODE_PATH=/usr/local/lib/node_modules

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema needed for db push at runtime.
# prisma.config.ts is NOT copied — it imports 'prisma/config' which is absent
# from the standalone node_modules. Without prisma.config.ts the Prisma 7 CLI
# falls back to the --url flag passed in entrypoint.sh.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# src/config is needed by prisma/seed/courses.ts at seed time (relative import).
COPY --from=builder --chown=nextjs:nodejs /app/src/config ./src/config

# Entrypoint: migrate → seed → start
COPY --chown=nextjs:nodejs scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

CMD ["./entrypoint.sh"]
