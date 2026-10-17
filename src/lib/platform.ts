/**
 * Platform helpers — the UI speaks neutral nouns; the platform layer
 * decides the concrete wording. In the Tauri build this is the OS
 * truth; in the browser mock it reports Windows (the product's primary
 * target, matching the research corpus).
 */
export type Platform = "windows" | "macos" | "browser-dev";

export function platform(): Platform {
  if (typeof window === "undefined") return "browser-dev";
  if ("__TAURI_INTERNALS__" in window || "__TAURI__" in window) {
    const nav = window.navigator;
    return /Mac|iPhone|iPad/i.test(nav.platform || nav.userAgent) ? "macos" : "windows";
  }
  return "browser-dev";
}

/** The human noun for the machine in first-run / hero copy. */
export function machineNoun(): string {
  return platform() === "macos" ? "Mac" : "PC";
}
