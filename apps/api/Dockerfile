# ==========================================
# OJALOGS API CONTAINER BUILD
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@9.12.3

# Copy root and workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared library and API
RUN pnpm --filter @ojalogs/shared build
RUN pnpm --filter api build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@9.12.3

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --prod --frozen-lockfile

COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/apps/api/dist ./apps/api/dist

EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]

