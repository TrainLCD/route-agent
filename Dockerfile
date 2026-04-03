FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/

RUN npx mastra build

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/.mastra/output ./

EXPOSE 4111

CMD ["node", "index.mjs"]
