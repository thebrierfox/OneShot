# syntax=docker/dockerfile:1.4
ARG NODE_VERSION=20.11.1

################################################################################
# Production stage: Create a lean final image
################################################################################
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy production dependencies
COPY --chown=appuser:appgroup node_modules ./node_modules
COPY --chown=appuser:appgroup packages/report/node_modules ./packages/report/node_modules
COPY --chown=appuser:appgroup packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --chown=appuser:appgroup packages/crawler/node_modules ./packages/crawler/node_modules
COPY --chown=appuser:appgroup packages/scraper/node_modules ./packages/scraper/node_modules

# Copy built code
COPY --chown=appuser:appgroup packages/report/dist ./packages/report/dist
COPY --chown=appuser:appgroup packages/shared-types/dist ./packages/shared-types/dist
COPY --chown=appuser:appgroup packages/crawler/dist ./packages/crawler/dist
COPY --chown=appuser:appgroup packages/scraper/dist ./packages/scraper/dist
COPY --chown=appuser:appgroup packages/report/src/templates ./packages/report/src/templates
COPY --chown=appuser:appgroup packages/report/package.json ./packages/report/package.json

USER appuser

ENV NODE_ENV=production

WORKDIR /app/packages/report

CMD ["node", "./dist/index.js"]

# Notes:
# - .env and secrets are NOT copied. Pass env vars at runtime.
# - .dockerignore should exclude .env, .git, lock files, etc.
# - This image is for running the report generator as a CLI tool.
#   To pass CLI args, use: docker run ... <args>
