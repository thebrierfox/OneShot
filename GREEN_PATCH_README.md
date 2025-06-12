# Green Baseline Patch

1. **Extract** the contents so each file overwrites the same path in your repo.
2. Run:

```powershell
Remove-Item -Force pnpm-lock.yaml
pnpm install
pnpm run clean
pnpm run build -- --force
```

That's it – build should finish with 0 errors.