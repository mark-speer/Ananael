# Build from repository root:
#   docker build -f server/Dockerfile .
# Compose sets context: . and dockerfile: server/Dockerfile

# -----------------------------------------------------------------------------
# Stage 1: Vite production build (React client)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS client-builder

WORKDIR /client

COPY client/package.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: compile Express TypeScript → JavaScript
# -----------------------------------------------------------------------------
FROM node:20-alpine AS server-builder

WORKDIR /app

COPY server/package.json ./
RUN npm install

COPY server/tsconfig.json ./
COPY server/src ./src

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: production runtime (API + static UI on one port)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY server/package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=server-builder /app/dist ./dist
COPY --from=client-builder /client/dist ./dist/public

EXPOSE 80
EXPOSE 443

CMD ["node", "dist/server.js"]
