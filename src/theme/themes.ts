/**
 * Theme registry (DiskGenie-parity two-layer system, DiskWizard default
 * flipped to BLOSSOM — the cherry-blossom palette is the shipped look).
 *
 *   data-theme="<id>"        the concrete palette (token block in
 *                            tokens.css) — what the user picks.
 *   data-scheme="light|dark" the FAMILY the palette belongs to.
 *
 * `light` and `dark` remain the canonical pair (the title bar's quick
 * toggle flips between exactly those two — a custom theme never becomes
 * the toggle's target; the picker owns the custom themes).
 *
 * Palette directions (identical family set to DiskGenie so the theme
 * system, gradients, and crossfade behave the same):
 *   blossom  blush cream + rich rose      (the shipped DEFAULT)
 *   light    neutral white + coral
 *   dark     neutral graphite + coral
 *   ember    warm espresso + honey gold
 *   tide     deep marine + lagoon cyan
 */

/** The persisted theme ids, in picker order. */
export const THEME_IDS = ["blossom", "light", "dark", "ember", "tide"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeFamily = "light" | "dark";

/** Display metadata — the picker's labels/tooltips + the toggle hint. */
export interface ThemeMeta {
  id: ThemeId;
  label: string;
  family: ThemeFamily;
}

export const THEMES: Record<ThemeId, ThemeMeta> = {
  blossom: { id: "blossom", label: "Blossom", family: "light" },
  light: { id: "light", label: "Light", family: "light" },
  dark: { id: "dark", label: "Dark", family: "dark" },
  ember: { id: "ember", label: "Ember", family: "dark" },
  tide: { id: "tide", label: "Tide", family: "dark" },
};

/** The picker's ordered list (THEME_IDS guaranteed present). */
export const THEME_LIST: ThemeMeta[] = THEME_IDS.map((id) => THEMES[id]);

/** Family lookup for the scheme attribute. */
export function familyOf(id: ThemeId): ThemeFamily {
  return THEMES[id].family;
}

/** The pre-mount/apply DOM writes for one theme — BOTH attributes,
 * always together (every consumer of data-scheme depends on this
 * pairing). */
export function applyThemeAttributes(id: ThemeId): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", id);
  root.setAttribute("data-scheme", familyOf(id));
}

/** The native window theme the Tauri side should match (families map
 * onto the two values setTheme accepts; custom themes follow their
 * family so native menus/tooltips stay coherent). */
export function nativeThemeFor(id: ThemeId): "light" | "dark" {
  return familyOf(id);
}

const STORAGE_KEY = "diskwizard.theme";

/** Validate a stored/loaded value — anything unknown falls back to the
 * blossom default (the pre-mount script and useTheme share this). */
export function validateThemeId(value: string | null | undefined): ThemeId {
  return value != null && (THEME_IDS as readonly string[]).includes(value)
    ? (value as ThemeId)
    : "blossom";
}

/** Read the persisted choice (best-effort; hardened WebView profiles
 * can throw on localStorage access). */
export function readSavedTheme(): ThemeId {
  try {
    return validateThemeId(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return "blossom";
  }
}

/** Persist a choice (same best-effort contract as readSavedTheme). */
export function persistTheme(id: ThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage can throw in hardened WebView profiles; the theme
    // still applies for this session, it just will not persist.
  }
}

/** Read the theme the pre-mount script already applied (fallback:
 * blossom — matches the default the script guarantees). */
export function currentDomTheme(): ThemeId {
  const dom = document.documentElement.getAttribute("data-theme");
  return validateThemeId(dom);
}
