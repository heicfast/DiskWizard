import { useCallback, useEffect, useState } from "react";
import { applyThemeAttributes, currentDomTheme, persistTheme, THEME_IDS, type ThemeId } from "./themes";

/**
 * Theme hook — set + toggle with the View-Transition crossfade (the
 * "beautiful system" from DiskGenie): the whole app (including the
 * CSS-painted BrandMark circle) rides one crossfade when the palette
 * changes. Falls back to an instant switch when the API is missing or
 * the user prefers reduced motion.
 */
export function useTheme(): {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  toggleScheme: () => void;
} {
  const [theme, setThemeState] = useState<ThemeId>(() => currentDomTheme());

  const setTheme = useCallback(
    (id: ThemeId) => {
      if (!(THEME_IDS as readonly string[]).includes(id)) return;
      const apply = () => {
        applyThemeAttributes(id);
        persistTheme(id);
        setThemeState(id);
        // Keep the native window chrome (menus, tooltips) coherent.
        void import("@tauri-apps/api/window")
          .then(({ getCurrentWindow }) => getCurrentWindow().setTheme(id === "blossom" || id === "light" ? "light" : "dark"))
          .catch(() => {
            /* plain-browser dev — no native window to sync */
          });
      };
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (doc.startViewTransition && !reduced) {
        doc.startViewTransition(apply);
      } else {
        apply();
      }
    },
    [],
  );

  const toggleScheme = useCallback(() => {
    // The quick toggle flips between the canonical light/dark pair.
    setTheme(theme === "blossom" || theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  // The pre-mount script owns first paint; sync React state if the
  // attribute was changed elsewhere (dev tools, another window).
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeState(currentDomTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return { theme, setTheme, toggleScheme };
}
