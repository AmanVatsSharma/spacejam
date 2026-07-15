# Production Dockerfile for SpaceJam API
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/api/package*.json ./apps/api/

# Install all dependencies (needs devDeps for webpack-cli build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN cd apps/api && npm run build

# Stage 2: Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 spacejam

# Copy built application and production dependencies from builder
COPY --from=builder --chown=spacejam:nodejs /app/apps/api/dist/ ./dist
COPY --from=builder --chown=spacejam:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=spacejam:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=spacejam:nodejs /app/package.json ./package.json

# Create upload directory
RUN mkdir -p /app/uploads && chown spacejam:nodejs /app/uploads

# Switch to non-root user
USER spacejam

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/main.js"]