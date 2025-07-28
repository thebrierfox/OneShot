# Security & Secrets Policy

This project handles sensitive information such as API keys and cookies. To safeguard data and meet regulatory requirements:

1. **Environment Variables** – All secrets (e.g. `SCRAPINGBEE_API_KEY`, `HTTP_PROXY_STRING`, `WEAVIATE_API_KEY`) must be loaded from environment variables. A `.env.example` file lists required keys without real values. Never commit actual secrets to the repository.
2. **Pre‑Commit Checks** – The root pre‑commit hook should run `pnpm exec grep -R --line-number -E "(API_KEY|apikey|ScrapingBee|BEGIN PRIVATE KEY)" packages/` to detect accidental leakage of secrets. Commits are rejected if any secrets are found.
3. **Secret Rotation** – Rotate API keys periodically and update the environment accordingly. Document rotation procedures and maintain least privilege for each credential.
4. **Artefact Sanitisation** – When storing scraped artefacts (cookies, PDFs) in `playbooks/<vendor>/runs/<timestamp>/3-artefacts/`, ensure sensitive tokens are redacted or encrypted before committing.

By following these guidelines, we minimise the risk of exposing credentials and maintain a secure development process.