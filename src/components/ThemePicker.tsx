import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { THEME_LIST } from "../theme/themes";
import { useView } from "../state/view";

/**
 * The theme picker — miniature-app swatches with FIXED literal preview
 * colors (the DiskGenie contract: swatch canvases never read the live
 * tokens, so every option previews its own palette).
 */
const SWATCHES: Record<string, { bg: string; panel: string; ink: string; label: string }> = {
  blossom: { bg: "#fbf1ee", panel: "#f6e9e5", ink: "#d8506b", label: "Blossom" },
  light: { bg: "#ffffff", panel: "#f5f5f7", ink: "#ff6b4a", label: "Light" },
  dark: { bg: "#1e1e20", panel: "#28282b", ink: "#ff7a5c", label: "Dark" },
  ember: { bg: "#201a15", panel: "#292119", ink: "#f2b04e", label: "Ember" },
  tide: { bg: "#101722", panel: "#18202e", ink: "#3fc5f2", label: "Tide" },
};

export function ThemePicker() {
  const open = useView((s) => s.themePickerOpen);
  const setOpen = useView((s) => s.setThemePickerOpen);
  const { theme, setTheme } = useTheme();

  return (
    <AnimatePresence>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 139 }} onClick={() => setOpen(false)} />
          <motion.div
            className="dw-themepicker"
            role="menu"
            aria-label="Appearance"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.3, 1] }}
          >
            {THEME_LIST.map((t) => {
              const sw = SWATCHES[t.id];
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  className={`dw-themeswatch${active ? " is-active" : ""}`}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  aria-pressed={active}
                >
                  <span
                    className="dw-themeswatch__canvas"
                    style={{ background: `linear-gradient(160deg, ${sw.bg} 55%, ${sw.panel} 55%)` }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: `linear-gradient(180deg, ${sw.ink}dd, ${sw.ink})`,
                        boxShadow: `0 2px 8px ${sw.ink}55`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      {active && <Check size={12} strokeWidth={3.5} />}
                    </span>
                    <span className="dw-themeswatch__chip" style={{ background: sw.panel, color: sw.ink }}>
                      {t.family}
                    </span>
                  </span>
                  <span className="dw-themeswatch__label">{sw.label}</span>
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Inline variant for the LicenseDialog (theming is never gated). */
export function ThemePickerInline() {
  const { theme, setTheme } = useTheme();
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {THEME_LIST.map((t) => {
        const sw = SWATCHES[t.id];
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            className={`dw-themeswatch${active ? " is-active" : ""}`}
            style={{ width: 74 }}
            onClick={() => setTheme(t.id)}
            aria-pressed={active}
            title={`${sw.label} theme`}
          >
            <span
              className="dw-themeswatch__canvas"
              style={{ height: 40, background: `linear-gradient(160deg, ${sw.bg} 55%, ${sw.panel} 55%)` }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: sw.ink,
                  boxShadow: `0 2px 6px ${sw.ink}66`,
                }}
              />
            </span>
            <span className="dw-themeswatch__label" style={{ fontSize: 10.5, padding: "5px 8px 0" }}>
              {sw.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
