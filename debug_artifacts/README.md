# Debug Artifacts

This folder is **git-ignored** but lives in the repo so the code can reference it at runtime.

1.  `flaresolverr_cookies.json` – JSON array of cookie `{ name, value }` objects captured from a *real* browser session after you successfully view Sunbelt pricing.
   • Grab cookies via DevTools → Application → Cookies for `sunbeltrentals.com`.
   • Save as JSON and drop the file here.

2.  `sunbelt_rates.json` – written automatically by `sunbelt_api_replay.ts` for inspection. 