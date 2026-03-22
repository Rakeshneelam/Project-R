# ─────────────────────────────────────────────────────────────
# Stage 1: base – install pnpm and all workspace dependencies
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace manifests first (for layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────
# Stage 2: builder – copy source and build the API
# ─────────────────────────────────────────────────────────────
FROM base AS builder

# Copy all source files
COPY apps/api ./apps/api
COPY packages ./packages

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build the monorepo (turbo will build deps first, then the API)
RUN pnpm exec turbo build --filter=@bondbridge/api

# ─────────────────────────────────────────────────────────────
# Stage 3: runner – lean production image
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace manifests (needed for pnpm workspace symlink resolution)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Copy node_modules from builder — already built for linux/alpine
# This includes the correct native binaries (bcrypt, prisma engines, etc.)
COPY --from=builder /app/node_modules ./node_modules

# Copy built API output
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy compiled shared packages
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 3000

WORKDIR /app/apps/api

CMD ["node", "dist/main"]

