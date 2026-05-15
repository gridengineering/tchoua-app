FROM node:20-alpine AS base

# ─── Stage 1 : Dépendances ───────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci

# ─── Stage 2 : Build Next.js ─────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement nécessaires au build (valeurs fictives, remplacées au runtime)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="placeholder-secret-for-build-only"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_FIREBASE_API_KEY="dummy-key"
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="dummy-domain"
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID="dummy-id"
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="dummy-bucket"
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="dummy-sender"
ENV NEXT_PUBLIC_FIREBASE_APP_ID="dummy-app"

# Générer le client Prisma et builder l'app
RUN npx prisma generate
RUN npm run build

# ─── Stage 3 : Image de production (minimale) ───────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copier uniquement les artefacts de build nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]