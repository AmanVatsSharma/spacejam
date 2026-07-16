# ════════════════════════════════════════════════════════════════
# SpaceJam Web — Multi-stage Dockerfile
# Builds the Next.js standalone output in Linux, then ships a
# minimal production image. Eliminates the Windows-path problem.
# ════════════════════════════════════════════════════════════════

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy ALL package.json files first (for Docker layer caching)
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY libs/ui/package.json ./libs/ui/

# Install dependencies — use --ignore-scripts to skip native builds (better-sqlite3 etc)
# We only need the web app build; API native deps aren't needed for the frontend image.
RUN npm install --ignore-scripts

# Copy the full source
COPY . .

# Build the Next.js standalone output directly (bypass Nx project graph
# to avoid playwright/native binding issues during Docker build)
ENV NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NODE_ENV=production
WORKDIR /app/apps/web
RUN npx next build

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the standalone build
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy static assets (not included in standalone by default)
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Copy public assets
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
