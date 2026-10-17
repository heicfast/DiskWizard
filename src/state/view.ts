/**
 * View store — the page router (no react-router; the app is a
 * single-window stack like the product it re-imagines).
 */
import { create } from "zustand";

export type Page = "home" | "detail" | "disk-health" | "file-repair" | "sd-card";

export type SidebarSection = "hardware" | "sd-card" | "lost-partition" | "disk-health" | "file-repair";

interface ViewStore {
  page: Page;
  /** The sidebar's highlighted item (drives landing content variants). */
  sidebar: SidebarSection;
  /** The wizard step (1 Select → 2 Scan → 3 Preview & Recover). */
  step: 1 | 2 | 3;
  /** Hamburger menu open state. */
  menuOpen: boolean;
  /** Theme picker open state. */
  themePickerOpen: boolean;
  /** First-run tour seen flag. */
  introSeen: boolean;

  go(page: Page, sidebar?: SidebarSection): void;
  setStep(step: 1 | 2 | 3): void;
  setMenuOpen(open: boolean): void;
  setThemePickerOpen(open: boolean): void;
  setIntroSeen(): void;
}

export const useView = create<ViewStore>((set) => ({
  page: "home",
  sidebar: "hardware",
  step: 1,
  menuOpen: false,
  themePickerOpen: false,
  introSeen: false,

  go(page, sidebar) {
    set({ page, sidebar: sidebar ?? pageToSidebar(page), menuOpen: false });
  },
  setStep(step) {
    set({ step });
  },
  setMenuOpen(open) {
    set({ menuOpen: open });
  },
  setThemePickerOpen(open) {
    set({ themePickerOpen: open });
  },
  setIntroSeen() {
    set({ introSeen: true });
  },
}));

function pageToSidebar(page: Page): SidebarSection {
  switch (page) {
    case "sd-card":
      return "sd-card";
    case "disk-health":
      return "disk-health";
    case "file-repair":
      return "file-repair";
    default:
      return "hardware";
  }
}
