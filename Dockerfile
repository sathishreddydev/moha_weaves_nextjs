# Multi-stage build for Next.js
FROM node:20-alpine AS base

# ── deps stage: install dependencies ──────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Use npm ci for reproducible, locked installs
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── builder stage: compile the application ────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Only NEXT_PUBLIC_* values are safe to embed at build time — they are
# written into the JS bundle and visible to the browser.
# Server-side secrets (DB, JWT, Razorpay secret, etc.) must NOT be ARGs here;
# they are injected at runtime via env_file in docker-compose / the host.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_IMAGE_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_IMAGE_URL=$NEXT_PUBLIC_IMAGE_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID

# Build the application
RUN npm run build

# ── runner stage: lean production image ───────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/public ./public

# Create .next dir with correct ownership
RUN mkdir -p .next && chown -R nodejs:nodejs /app/.next

# Leverage Next.js output traces for a minimal standalone image
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
