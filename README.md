## Running the Project with Docker

This project is structured as a multi-service application with several TypeScript/Node.js and Python components, each containerized for development and production use. The setup uses Docker Compose to orchestrate all services and their dependencies.

### Getting Started

For local development, first ensure the infrastructure is running:
```sh
docker compose up -d
```

Install dependencies and build the workspace packages before starting any service:
```bash
pnpm install
pnpm turbo run build
cp .env.example .env && pnpm turbo run dev
```

### Project-Specific Requirements

- **Node.js Version:**
  - Most Node.js services require Node 22.x (see `NODE_VERSION` build args in Dockerfiles, e.g., `22.13.1` or `22.14.0`).
- **Python Version:**
  - The analytics service uses Python 3.11 (see `FROM python:3.11-slim`).
- **Package Managers:**
  - Some services use `npm`, others use `pnpm` (see `PNPM_VERSION` in Dockerfiles, e.g., `10.4.1`).
- **Non-root Users:**
  - All services run as non-root users for security.

### Required Environment Variables

- **Database and Service Credentials:**
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (set in the `postgres` service)
  - Other services may require environment variables (e.g., `.env` files), but these are not copied into the images by default. Uncomment the `env_file` lines in the compose file if you need to pass environment variables.
- **Temporal Service:**
  - Uses `DYNAMIC_CONFIG_FILE_PATH` for dynamic configuration (see the `temporal` service).

### Build and Run Instructions

1. **Build and Start All Services:**
   ```sh
   docker compose up --build
   ```
   This will build all images as defined in the Dockerfiles and start the services.

2. **Environment Files:**
   - If you have `.env` files for any service, uncomment the `env_file` lines in the `docker-compose.yaml` and ensure the files are present in the correct locations.

3. **Volumes and Data Persistence:**
   - Data for Postgres, Weaviate, and Temporal is persisted using Docker volumes (`postgres_data`, `weaviate_data`, `temporal_data`).

### Special Configuration Notes

- **Monorepo Structure:**
  - Some services (e.g., `report`, `scraper`) use `pnpm` and expect a monorepo layout. The Dockerfiles are set up to handle workspace dependencies.
- **No Lock Files:**
  - Lock files (e.g., `package-lock.json`, `pnpm-lock.yaml`) are not always copied; ensure your dependencies are up to date before building.
- **.env Files:**
  - Sensitive configuration is not included in the images. Pass secrets and environment variables at runtime.
- **Healthchecks:**
  - Postgres, Redis, and Weaviate have healthchecks defined for better orchestration.

### Ports Exposed Per Service

| Service              | Exposed Port |
|----------------------|--------------|
| postgres             | 5432         |
| redis                | 6379         |
| weaviate             | 8080         |
| temporal             | 7233         |
| typescript-scraper   | 3000         |
| (other app services) | (none)       |

- Only the `typescript-scraper` service exposes a port (3000) for external access by default. Other app services run as CLI tools or background workers and do not expose ports.

### Summary
- Use `docker compose up --build` to build and run the full stack.
- Ensure required environment variables are set, especially for database and service credentials.
- Only the scraper service is accessible on port 3000; other services are internal.
- All services run as non-root users for security.
- For advanced configuration (e.g., mounting custom Temporal configs), see the commented lines in the compose file.

Refer to the `docker-compose.yaml` and individual Dockerfiles for further customization as needed.