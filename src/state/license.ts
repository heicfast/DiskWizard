/**
 * License store — the posture machine (DiskGenie architecture,
 * DiskWizard key prefix). The gate interception raises the activation
 * dialog when a command is refused (ACTIVATION_REQUIRED / LICENSE_STALE).
 */
import { create } from "zustand";
import type { LicenseState } from "../domain";
import { invoke, listen } from "../lib/ipc";
import { normalizeKey } from "../lib/licenseKey";

interface LicenseStore {
  state: LicenseState | null;
  loaded: boolean;
  dialogOpen: boolean;
  /** The error surfaced by the last refused command (typed copy). */
  gateError: string | null;
  busy: boolean;

  load(): Promise<void>;
  openDialog(): void;
  closeDialog(): void;
  activate(key: string): Promise<{ ok: boolean; error?: string }>;
  validateNow(): Promise<void>;
  simulate(posture: "pro" | "unlicensed"): Promise<void>;

  /** True when the recovery funnel is locked (hard gate). */
  locked(): boolean;
}

export const TRIAL_QUOTA_GB = 2;

export const useLicense = create<LicenseStore>((set, get) => ({
  state: null,
  loaded: false,
  dialogOpen: false,
  gateError: null,
  busy: false,

  async load() {
    const state = await invoke<LicenseState>("license_state");
    set({ state, loaded: true });
  },

  openDialog() {
    set({ dialogOpen: true, gateError: null });
  },
  closeDialog() {
    set({ dialogOpen: false, gateError: null });
  },

  async activate(key) {
    set({ busy: true, gateError: null });
    try {
      const state = await invoke<LicenseState>("activate_license", { key: normalizeKey(key) });
      set({ state, busy: false, dialogOpen: false });
      // Resume a recovery that was gated at the moment of value.
      const { resumePendingRecovery } = await import("./recovery");
      resumePendingRecovery();
      return { ok: true };
    } catch (e) {
      const msg = String(e);
      set({ busy: false, gateError: userFacingLicenseError(msg) });
      return { ok: false, error: msg };
    }
  },

  async validateNow() {
    set({ busy: true });
    const state = await invoke<LicenseState>("validate_license").catch(() => get().state);
    set({ state, busy: false });
  },

  async simulate(posture) {
    const state = await invoke<LicenseState>("license_sim_set", { posture });
    set({ state });
  },

  locked() {
    const s = get().state;
    return !s || s.posture === "unlicensed" || s.posture === "degraded";
  },
}));

/** Map raw error markers to user-facing copy (the typed ladder). */
export function userFacingLicenseError(raw: string): string {
  if (raw.includes("trial recovery limit"))
    return "Free trial limit reached — you have recovered the 2 GB allowance. Activate DiskWizard Pro for unlimited recovery.";
  if (raw.includes("not found")) return "License code not found. Check the code and try again.";
  if (raw.includes("expired")) return "This license code has expired.";
  if (raw.includes("another device")) return "This license is already active on another device.";
  if (raw.includes("format")) return "The license code format is invalid.";
  if (raw.includes("LICENSE_STALE")) return "Your license needs to reconnect to validate.";
  return "Activation failed. Please try again.";
}

/**
 * Gate interception — called by lib/ipc on EVERY refused command.
 * Raises the activation dialog with the typed error.
 */
export function interceptLicenseGate(rawError: string): void {
  if (rawError.includes("ACTIVATION_REQUIRED") || rawError.includes("LICENSE_STALE")) {
    const st = useLicense.getState();
    st.openDialog();
    useLicense.setState({ gateError: userFacingLicenseError(rawError) });
  }
}

/** Mounted once by App. */
export function watchLicenseEvents(): () => void {
  const unsub = listen<LicenseState>("license-changed", (s) => {
    useLicense.setState({ state: s });
  });
  return () => {
    void unsub.then((f) => f());
  };
}
