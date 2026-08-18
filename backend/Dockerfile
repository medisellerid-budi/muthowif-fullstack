FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package*.json ./
# Install dependencies
RUN npm ci
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build the Next.js app
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
EXPOSE 8651
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npm start"]
