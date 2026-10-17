import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "../components/BrandMark";

/**
 * The opening splash — short, smooth, on-brand (owner direction:
 * "not very lengthy, keep it short smooth").
 *
 * Sequence: the theme-painted BrandMark breathes in with a ring pulse
 * (~2.1s while the core enumerates devices behind it), then the whole
 * surface cross-fades to the landing page. The elevation chip ("Running
 * as administrator") appears once the UAC contract resolves — the app
 * requires elevation for raw disk access.
 */
export function Splash({ visible, elevated }: { visible: boolean; elevated: boolean }) {
  const [showShield, setShowShield] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = window.setTimeout(() => setShowShield(true), 900);
      return () => window.clearTimeout(t);
    }
    setShowShield(false);
    return undefined;
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="dw-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] } }}
          data-tauri-drag-region
        >
          <div className="dw-splash__mark">
            <div className="dw-splash__ring" />
            <div className="dw-splash__ring" style={{ animationDelay: "0.55s" }} />
            <BrandMark size={128} />
          </div>
          <h1 className="dw-splash__name">DiskWizard</h1>
          <p className="dw-splash__tagline">Bring your files back.</p>
          <div className="dw-splash__status">
            <span className="dw-splash__dot" />
            Reading the disk information, please wait...
          </div>
          {elevated && showShield && (
            <motion.div
              className="dw-splash__shield"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ShieldCheck size={14} />
              Running as administrator
            </motion.div>
          )}
          <div className="dw-splash__progress">
            <div className="dw-splash__progress-fill" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
