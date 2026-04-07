# --- ESTÁGIO 1: BUILDER ---
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g tsx

COPY package.json package-lock.json ./
COPY territorio-core/apps/server/package.json ./territorio-core/apps/server/
COPY territorio-core/packages/api/package.json ./territorio-core/packages/api/
COPY territorio-core/packages/db/package.json ./territorio-core/packages/db/

RUN npm install

COPY . .

# --- ESTÁGIO 2: RUNNER ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g tsx

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/territorio-core/apps/server ./territorio-core/apps/server
COPY --from=builder /app/territorio-core/packages/api ./territorio-core/packages/api
COPY --from=builder /app/territorio-core/packages/db ./territorio-core/packages/db

EXPOSE 3333

WORKDIR /app/territorio-core/apps/server

CMD ["tsx", "src/index.ts"]