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
COPY --chown=appuser:appgroup packages/scraper/node_modules ./packages/scraper/node_modules
COPY --chown=appuser:appgroup packages/shared-types/node_modules ./packages/shared-types/node_modules

# Copy built code
COPY --chown=appuser:appgroup packages/scraper/dist ./packages/scraper/dist
COPY --chown=appuser:appgroup packages/shared-types/dist ./packages/shared-types/dist
COPY --chown=appuser:appgroup packages/scraper/package.json ./packages/scraper/package.json

USER appuser

ENV NODE_ENV=production

WORKDIR /app/packages/scraper

EXPOSE 3000

CMD ["node", "./dist/index.js"]
