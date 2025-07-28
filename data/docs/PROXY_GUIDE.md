# Proxy Guide

Many competitor websites employ bot detection and geo‑fencing. To maximise scraping success, the **OneShot** system supports HTTP and SOCKS proxies.

* Configure proxies via environment variables (e.g. `HTTP_PROXY_STRING`) in your `.env` file. See `.env.example` for a list of supported variables.
* The scraper package will automatically detect the proxy string and pass it to Playwright. For high‑volume scraping, consider rotating proxies to minimise blocking.
* When using Stagehand recipes (e.g. for modals or captcha), ensure the proxy is also configured for the Stagehand session.

Use proxies responsibly and in compliance with legal and ethical guidelines.