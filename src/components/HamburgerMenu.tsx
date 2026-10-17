import { AnimatePresence, motion } from "framer-motion";
import {
  CircleHelp,
  CircleUser,
  FileCog,
  Globe,
  Info,
  MessageSquareText,
  RefreshCw,
  Share2,
  UserPlus,
} from "lucide-react";
import { useView } from "../state/view";
import { useLicense } from "../state/license";
import { toast } from "../state/toast";

/**
 * The hamburger menu (Drw_More_Menu parity, AI/products stripped):
 * Language, Help, Activate, Check for Updates, Share, Refer Friends,
 * File Repair, Settings, About.
 */
export function HamburgerMenu() {
  const open = useView((s) => s.menuOpen);
  const setOpen = useView((s) => s.setMenuOpen);
  const pro = useLicense((s) => s.state?.posture === "pro");

  if (!open) return null;

  function item(icon: React.ReactNode, label: string, onClick: () => void, badge?: string) {
    return (
      <button className="dw-hamburger__item" onClick={() => { onClick(); setOpen(false); }}>
        {icon}
        {label}
        {badge && <span className="dw-chip dw-chip--ink" style={{ marginLeft: "auto", height: 17, fontSize: 9.5 }}>{badge}</span>}
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="dw-hamburger"
        role="menu"
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.16, ease: [0.2, 0.8, 0.3, 1] }}
      >
        {item(<Globe />, "Language", () => toast("info", "25 languages available — ships with the production build."))}
        {item(<CircleHelp />, "Help", () => toast("info", "Quick start guide, tutorials, and FAQs."))}
        <div className="dw-hamburger__sep" />
        {item(<CircleUser />, pro ? "License" : "Activate", () => useLicense.getState().openDialog(), pro ? undefined : "KEY")}
        {item(<RefreshCw />, "Check for Updates", () => void invokeUpdates())}
        {item(<Share2 />, "Share DiskWizard", () => toast("info", "Share link copied."))}
        {item(<UserPlus />, "Refer Friends", () => toast("info", "Refer friends and both get a free month."))}
        <div className="dw-hamburger__sep" />
        {item(<FileCog />, "File Repair", () => useView.getState().go("file-repair"), "SOON")}
        <div className="dw-hamburger__sep" />
        {item(<MessageSquareText />, "Send Feedback", () => toast("info", "Feedback opens the support form."))}
        {item(<Info />, "About DiskWizard", () => toast("info", `DiskWizard ${__APP_VERSION__ ?? "0.1.0"} — Bring your files back.`))}
      </motion.div>
    </AnimatePresence>
  );
}

async function invokeUpdates(): Promise<void> {
  toast("info", "Checking for updates…");
  const { invoke } = await import("../lib/ipc");
  const r = await import("../domain").then(() => invoke<{ upToDate: boolean; latest: string }>("check_updates"));
  if (r.upToDate) toast("success", "You're up to date.");
  else toast("info", `Update available: ${r.latest}`);
}

declare const __APP_VERSION__: string | undefined;
