# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

# Set up working directory
WORKDIR /app

# --- Builder stage: install dependencies into a venv ---
FROM base AS builder

# Install system dependencies for pip packages (psycopg2-binary, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt only (for better cache usage)
COPY ./packages/analytics/requirements.txt ./

# Create venv and install dependencies using pip cache
RUN python -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install --upgrade pip wheel && \
    pip install -r requirements.txt

# --- Final stage: copy app and venv, set up non-root user ---
FROM base AS final

# Create non-root user
RUN useradd -m appuser

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY ./packages/analytics/src/ ./src/

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Switch to non-root user
USER appuser

# Default command (can be overridden)
CMD ["python", "src/main_analytics.py", "--help"]
