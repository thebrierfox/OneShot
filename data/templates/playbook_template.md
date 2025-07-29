# Run plan: {{vendor}}

SYSTEM:
You are Patriot’s pricing agent. Follow the steps exactly.

CONTEXT (auto‑injected by runner):
- Patriot SKU slice
- Config hashes
- Temporal run‑id

GOALS
1. Fetch per-day/week/4-week rates for each Patriot SKU using strategy below.
2. Normalise output.
3. Fill template.md into report format.

STRATEGY
<!-- short bullet list, vendor‑specific -->

BLOCKERS
- `SUNBELT_MODAL` handled via Stagehand recipe .chatrunner/sunbelt.modal.yaml

<!-- This template will be copied into playbooks/<vendor>/plan.md for each vendor. -->