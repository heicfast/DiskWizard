# DiskWizard

**Bring your files back.**

DiskWizard is premium data recovery software: restore files from any storage media,
preview before recovery, and repair corrupted files with simple clicks. Powerful
scanning algorithms identify and retrieve a huge file-type library — all popular
video, audio, photo, and document formats.

> **Status:** UI/UX complete (production grade), core simulated. The Rust core is
> being built separately and will connect through the documented command surface.

## What it does

- **Recover data** — deleted files from Recycle Bin, HDD, SSD, USB, and SD cards
- **Recover any file type** — 8 category classifier with 1,489+ extensions
- **Recover from any storage media** — internal disks, external drives, lost partitions,
  BitLocker-locked volumes
- **Restore from all file systems** — NTFS/NTFS5, FAT12/16/32, exFAT, ReFS, ext2/3/4, HFS+
- **BitLocker data recovery** — unlock with password or recovery key, then scan
- **Preview files before recovery** — images, video, audio, documents, archives with
  recovery-chance grading
- **Disk Health (free)** — integrated S.M.A.R.T. monitoring with risk warnings
- **File Repair (next)** — advanced photo/video/document repair, integrated into the
  recovery flow

## The 3-step flow

1. **Select a location** — device tiles with capacity, file system, TRIM status, and
   health badges; lost partitions surfaced automatically
2. **Scan** — two-phase engine (quick MFT pass → advanced sector-by-sector carving)
   with pause/resume/stop, live "Searching:" ticker, and progressive results you can
   browse while scanning
3. **Preview & recover** — filter (type/date/size + smart de-dup that cuts noise ~65%),
   search, per-file recovery chances, and a destination guard that prevents
   save-to-source accidents

## Tech stack

- **Rust core + Tauri 2 (WebView2)** — no Electron, no browser bloat
- **React 18 + TypeScript** UI, Zustand state, Framer Motion transitions
- **Hand-crafted CSS token system** (5 themes, cherry-blossom default)
- **Lucide icons** + purpose-drawn pictograms

## Theme system

Five palettes — **Blossom** (cherry blossom, the default), Light, Dark, Ember, Tide —
with a two-layer attribute system (`data-theme` + `data-scheme`), View-Transition
crossfade, and the **theme-reactive brand mark**: the logo's circle is painted by CSS
with the active ink gradient, so it follows every theme change live.

## Development

```bash
npm install
npm run dev          # browser dev with the mock core (full command surface simulated)
npm run tauri dev    # desktop shell (requires Rust toolchain)
npm run build        # production frontend bundle
npm run typecheck    # strict TS
npm run test         # vitest
```

### The mock core

The entire UI runs in a plain browser against `src/mock/` — a realistic simulated
engine implementing the exact command surface (devices, two-phase scan, file tree,
recovery funnel, SMART, license posture machine). The mock is **DEV-gated and never
ships in release builds** (dynamic import behind `isTauri()`).

**Agent hooks** (browser console / Playwright):

```js
window.__dwMock.devices()               // device inventory
window.__dwMock.setLicense("pro")       // posture flip (CI screenshots)
window.__dwMock.reset()                 // reset scan + license
window.__dwMock.state()                 // { scanRun, license }
```

**Tour mode** — `?tour=1` auto-drives the full UI with `tNN-name` window-title
markers (one screenshot frame per step for the CI harness).

## Licensing

DiskWizard is a paid product. The trial recovers up to 2 GB (preview is unlimited);
Disk Health stays free. Activation: `DW-XXXXX-XXXXX-XXXXX-XXXXX` keys, posture
machine (unlicensed / pro / grace / degraded), gate markers
(`ACTIVATION_REQUIRED` / `LICENSE_STALE`) intercepted on every refused command.
See `docs/LICENSING-ARCHITECTURE.md`.

## Project layout

```
src/
  theme/      tokens.css (5 palettes), themes.ts, useTheme
  styles/     base / shell / home / detail / overlays / diskhealth
  shell/      TitleBar, Sidebar, Splash, TourDriver
  home/       landing (device tiles), SD card rescue, File Repair
  detail/     scan+results page (toolbar, tree, list, preview, HUD, filters)
  recovery/   destination dialog, progress, celebration, stop-confirm
  diskhealth/ SMART dashboard
  components/ BrandMark (theme-reactive), LicenseDialog, ThemePicker, Gauge…
  state/      Zustand stores (view, devices, scan, results, recovery, license, toast)
  mock/       the simulated core (commands, inventory, filetree, rng)
  lib/        ipc seam, platform, motion, format, licenseKey
src-tauri/    Tauri 2 shell (window config, capabilities, commands)
```

© 2026 DiskWizard
