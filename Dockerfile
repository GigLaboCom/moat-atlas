# syntax=docker/dockerfile:1

# ── build ────────────────────────────────────────────────────────────────────
# The PUBLIC_ variables are inlined into the bundle by Astro, so the image is
# per-environment: to point it at another host, rebuild it.
FROM node:22-alpine AS build

ARG PUBLIC_SITE_URL="https://moa.giglabo.com"
ARG PUBLIC_GA_ID=""
ARG PUBLIC_GEO_ENDPOINT=""

ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_GA_ID=$PUBLIC_GA_ID \
    PUBLIC_GEO_ENDPOINT=$PUBLIC_GEO_ENDPOINT \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    ASTRO_TELEMETRY_DISABLED=1 \
    CI=1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Build, then lay a .gz next to everything worth compressing — nginx serves
# those directly (gzip_static) instead of re-compressing on every request.
RUN npm run build \
 && find dist -type f -size +1k \
      \( -name '*.html' -o -name '*.css'  -o -name '*.js'  -o -name '*.mjs' \
      -o -name '*.svg'  -o -name '*.json' -o -name '*.xml' -o -name '*.txt' \
      -o -name '*.md' \
      -o -name '*.webmanifest' \) \
      -exec gzip -9 -k {} +

# ── serve ────────────────────────────────────────────────────────────────────
FROM nginx:1.29-alpine AS runtime

LABEL org.opencontainers.image.source="https://github.com/GigLaboCom/moat-atlas" \
      org.opencontainers.image.description="Moat Atlas — the static site behind nginx" \
      org.opencontainers.image.licenses="MIT"

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/conf.d/ /etc/nginx/conf.d/
COPY docker/snippets/ /etc/nginx/snippets/
COPY --from=build /app/dist /usr/share/nginx/html

# Unprivileged on 8080: no root in the container, nothing outside /tmp is
# written, so the filesystem can be mounted read-only.
USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1
