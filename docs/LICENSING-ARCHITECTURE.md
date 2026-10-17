# DiskWizard Licensing Architecture

*Borrowed as-is from DiskGenie's licensing system, adapted to the DW- key prefix
and DiskWizard's product surface. Everything below is **mocked** in this session
(the posture machine runs client-side with simulated activation) but the contracts,
markers, and postures are production-shaped so the core drops in without UI changes.*

## Product posture

DiskWizard is a **paid application** — nothing is free except **Disk Health (S.M.A.R.T.)**,
which mirrors DiskGenie's Monitor-mode (always available, never gated).

| Capability | Trial (unlicensed) | Pro |
|---|---|---|
| Scan any device / file system | ✔ | ✔ |
| Browse + filter results | ✔ | ✔ |
| Preview files | ✔ (100 MB cap, 15 s video) | ✔ unlimited |
| Recover files | **2 GB cumulative** | Unlimited |
| BitLocker-locked recovery | ✔ (gated at recovery) | ✔ |
| File Repair (next release) | preview only | save repaired files |
| Disk Health (S.M.A.R.T.) | **✔ always free** | ✔ |
| Priority support | — | ✔ |

The 2 GB trial ladder is the DRW-funnel: enough to prove recovery works, then the
limit gate converts. Disk Health stays free as the trust-building surface (it warns
users their disk is dying — the natural moment to need recovery).

## Key format

```
DW-XXXXX-XXXXX-XXXXX-XXXXX
```

- Crockford base32 alphabet (excludes I, L, O, U) — 20 random chars = 100 bits.
- normalize: uppercase + strip non-alphanumerics → 22 chars total.
- Activate button enables only at exactly 22 chars (`src/lib/licenseKey.ts`).
- Typed server errors: `BAD_REQUEST`, `BAD_SIGNATURE`, `REPLAYED`, `KEY_REVOKED`,
  `KEY_REFUNDED`, `KEY_PENDING`, `DEVICE_MISMATCH`, `DEVICE_SLOT_TAKEN`,
  `KEY_NOT_FOUND`, `RATE_LIMITED`.

## Posture machine

```
unlicensed ──activate──▶ pro
pro ──24h revalidation──▶ pro            (scheduler thread)
pro ──offline ≤14 days──▶ grace          ("offline — N days left" banner)
grace ──reconnect──────▶ pro
grace ──14 days pass───▶ degraded        (locked + reconnect banner)
pro/grace ──revoke────▶ unlicensed
```

`licenseLocked = posture !== "pro" && posture !== "grace"`.

## Gate markers (L6 — command-layer enforcement)

Every privileged command re-checks the license in the core (Rust). Refusals carry
marker prefixes the frontend intercepts on the single IPC seam:

- `ACTIVATION_REQUIRED. <reason>` — trial limit reached, locked tier, or pro-only surface.
  → the App opens `LicenseDialog` with the typed error copy.
- `LICENSE_STALE. …` — degraded posture; reconnect to validate.

The 2 GB trial gate (recovery-specific):

```
ACTIVATION_REQUIRED. Free trial recovery limit (2 GB) reached — 0.42 GB recovered.
Activate DiskWizard Pro for unlimited recovery.
```

mapped to: *"Free trial limit reached — you have recovered the 2 GB allowance.
Activate DiskWizard Pro for unlimited recovery."*

## Mock / CI simulation

- Browser mock starts `unlicensed` and enforces the same gate.
- `?license_sim=1` boots PRO_SIM (Alex Morgan / lifetime / `simulated: true`).
- `license_sim_set` command flips pro↔unlicensed for tour screenshots.
- Rust side: the `ci-license-sim` cargo feature gates the sim body; production
  builds compile a **hard refusal** (`LICENSE_SIM_REFUSED.`), and the feature is
  never enabled in NSIS/MSIX builds.

## UI surfaces

- **LicenseDialog** — entry state (key input with live formatting, Paste,
  Activate, Buy a License Now, "No reinstallation or rescan required"), busy
  state, typed errors, and the Pro status card (tier, holder, expiry, Validate
  now). The theme picker lives inside BOTH states — theming is never gated.
- **Title bar** — Buy Now (unlicensed only), activate key glyph, PRO/FREE
  TRIAL edition chip.
- **Sidebar footer** — posture summary line.

## Core TODO (when the Rust license worker lands)

L0 D1 rate limits (10/60/10 per hour per key/IP) → L1 TLS → L2 request HMAC-SHA256
over (ts, nonce, method, path, body-sha256) ±300 s + nonce replay table →
L3 server-side entitlement (worker + D1) → L4 Ed25519-signed entitlement token
(`b64url(payload).b64url(sig)`; payload: iss `dw-license`, ver 1, jti, iat,
exp = iat + 14 d, key = sha256(key), tier, name, email, hw fingerprint, plat, lexp;
client verifies with the embedded public key — a spoofed server cannot forge) →
L5 device binding (SHA-256 of MachineGuid + volume serial + CPUID, DPAPI-wrapped
at rest) → L5b 1-per-platform live slot index → **L6 command-layer gates** (above) →
L7 binary hardening (strip/LTO/panic=abort + Store signature) → L8 24 h
revalidation + at-launch → L9 revocation/expiry → L10 audit telemetry.
