# AGENTS.md

Working agreements for coding agents on DiskWizard.

## Before you start

1. Read `worklog.md` (the shared multi-agent log) — the current state lives there.
2. Read `SESSION_PROMPT.md`-level intent from `README.md` + `docs/`.
3. This is a **UI-complete, core-simulated** app: all engine behavior flows
   through `src/lib/ipc.ts` (single seam). NEVER talk to the mock directly from
   product components.

## Non-negotiables

- **No mock in release**: everything under `src/mock/` is DEV-gated. The
  production bundle must not contain it (CI audits `dist/`).
- **No TODO/FIXME/stub markers** in shipped source. Simulated core bodies live
  only in `src-tauri/src/commands/*` behind `// SIMULATED — core TODO:` comments
  and in `src/mock/` (excluded from release).
- **Theme tokens only** — never hardcode colors in components; use
  `var(--ink)`, `var(--panel)`… from `src/theme/tokens.css`.
- **Icons from one place** — lucide imports or the purpose-drawn glyphs in
  `src/components/Icon.tsx`. No emoji, no inline icon soup.
- **Every invoke error already flows through the license-gate interceptor** —
  do not add bespoke error handling for licensing.
- **The 3-step contract**: scan and results are ONE page (`detail`). Never
  split them.
- **Strict TS**: `npm run typecheck` must pass with zero errors.
- **No AI/robot features** — the product ships without AI surfaces.

## Quality gates (run before push)

```bash
npm run typecheck   # strict, zero errors
npm run test        # vitest
npm run build       # production bundle + mock-exclusion audit
```

## Verification

- `scripts/with_dev.sh <cmd>` keeps the DEV (mock) server alive for audits.
- `?tour=1` drives the full UI with `tNN-name` title markers.
- `window.__dwMock` = `{ devices, setLicense, reset, state }` (browser console).
- VLM-verify screenshots after visual changes; check the code too — never rely
  on VLM alone.

## Worklog protocol

Append to `worklog.md` (never rewrite): task id, agent, work log bullets,
stage summary. Push early, push often.
