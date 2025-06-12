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
COPY --chown=appuser:appgroup packages/etl/node_modules ./packages/etl/node_modules
COPY --chown=appuser:appgroup packages/shared-types/node_modules ./packages/shared-types/node_modules


# Copy built code
COPY --chown=appuser:appgroup packages/etl/dist ./packages/etl/dist
COPY --chown=appuser:appgroup packages/shared-types/dist ./packages/shared-types/dist
COPY --chown=appuser:appgroup packages/etl/package.json ./packages/etl/package.json


USER appuser

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app/packages/etl

CMD ["node", "./dist/index.js"]
