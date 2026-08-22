# Self-host the Next.js app (Coolify / any Docker host) — no Vercel needed.
# Multi-stage build using Next.js "standalone" output for a small runtime image.

# 1) Install dependencies
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2) Build
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public envs must be present at BUILD time (they're inlined). Server-only secrets
# (OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, ELEVENLABS_*, ROBOFLOW_*, SKIN_CV_*,
# SESSION_SECRET, ADMIN_ACCESS_TOKEN) are read at RUNTIME — set them in Coolify.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Runtime — minimal standalone server
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs nextjs
# standalone server + static assets + public (fonts, mediapipe wasm, product images)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
