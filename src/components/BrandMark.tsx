import brandMark from "../assets/brand-mark.png";

/**
 * The DiskWizard product mark — theme-reactive everywhere it appears
 * (the DiskGenie "beautiful system").
 *
 * The asset is the wizard-hat + drive + orbiting-files cutout (the navy
 * tile removed at the pixel level — the artwork keeps its own 3D
 * lighting and shadows). The CIRCLE is painted by CSS with
 * `var(--ink-grad)` — the exact gradient every ink-filled control uses
 * — so the mark follows the selected theme live and rides the same
 * View-Transition crossfade as the rest of the chrome (the token
 * change re-paints the background; the transition wraps the whole app).
 *
 * The glow matches the ink-button language (`--ink-glow`), keeping the
 * mark in symmetry with the interactive ink surfaces.
 */
export function BrandMark({ size = 22, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <span
      className="dw-brand-mark"
      style={{ width: size, height: size, boxShadow: glow ? "var(--ink-glow)" : undefined }}
      aria-hidden="true"
    >
      <img src={brandMark} alt="" draggable={false} />
    </span>
  );
}
