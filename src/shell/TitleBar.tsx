import { getCurrentWindow } from "@tauri-apps/api/window";
import { Palette, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import { Btn } from "../components/buttons";
import { WinCloseGlyph, WinMaxGlyph, WinMinGlyph, WinRestoreGlyph } from "../components/Icon";
import { isTauri } from "../lib/ipc";
import { useLicense } from "../state/license";
import { useView } from "../state/view";

/**
 * Custom title bar (decorations: false in tauri.conf) — brand cluster,
 * Buy Now (gold), theme picker, hamburger menu, and Windows caption
 * buttons. In the browser mock the caption verbs log instead of
 * invoking the native window.
 */
export function TitleBar({ onMenu }: { onMenu: () => void }) {
  const [maximized, setMaximized] = useState(true);
  const license = useLicense((s) => s.state);
  const setThemePickerOpen = useView((s) => s.setThemePickerOpen);

  const pro = license?.posture === "pro" || license?.posture === "grace";

  useEffect(() => {
    if (!isTauri()) return undefined;
    const w = getCurrentWindow();
    const p = w.onResized(async () => {
      setMaximized(await w.isMaximized());
    });
    void w.isMaximized().then(setMaximized);
    return () => {
      void p.then((f) => f());
    };
  }, []);

  async function caption(verb: "min" | "max" | "close") {
    if (!isTauri()) {
      // Browser-dev: caption verbs log nowhere — the native window
      // contract only exists in the Tauri shell.
      return;
    }
    const w = getCurrentWindow();
    if (verb === "min") await w.minimize();
    else if (verb === "max") await w.toggleMaximize();
    else await w.close();
  }

  return (
    <header className="dw-titlebar" data-tauri-drag-region>
      <div className="dw-titlebar__brand" data-tauri-drag-region>
        <BrandMark size={26} />
        <span className="dw-titlebar__name">DiskWizard</span>
        <span className={`dw-titlebar__edition${pro ? " dw-titlebar__edition--pro" : ""}`}>
          {pro ? "PRO" : "FREE TRIAL"}
        </span>
      </div>

      <div className="dw-titlebar__spacer" data-tauri-drag-region />

      <div className="dw-titlebar__actions">
        {!pro && (
          <Btn
            variant="gold"
            compact
            className="dw-titlebar__buy"
            leading={<ShoppingCart size={14} />}
            onClick={() => useLicense.getState().openDialog()}
          >
            Buy Now
          </Btn>
        )}
        <button
          className="dw-iconbtn"
          title="Appearance"
          aria-label="Appearance"
          onClick={() => setThemePickerOpen(true)}
        >
          <Palette size={16} />
        </button>
        <div className="dw-titlebar__divider" />
        <button
          className="dw-iconbtn"
          title={pro ? "Activate / License" : "Activate DiskWizard"}
          aria-label="Activate DiskWizard"
          onClick={() => useLicense.getState().openDialog()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </button>
        <button className="dw-iconbtn" title="Menu" aria-label="Menu" onClick={onMenu}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="dw-titlebar__divider" />
        <button className="dw-caption" aria-label="Minimize" onClick={() => void caption("min")}>
          <WinMinGlyph />
        </button>
        <button className="dw-caption" aria-label={maximized ? "Restore" : "Maximize"} onClick={() => void caption("max")}>
          {maximized ? <WinRestoreGlyph /> : <WinMaxGlyph />}
        </button>
        <button className="dw-caption dw-caption--close" aria-label="Close" onClick={() => void caption("close")}>
          <WinCloseGlyph />
        </button>
      </div>
    </header>
  );
}
