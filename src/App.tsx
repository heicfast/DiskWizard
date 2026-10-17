import { AnimatePresence, motion } from "framer-motion";
import { MotionConfig } from "framer-motion";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HamburgerMenu } from "./components/HamburgerMenu";
import { LicenseDialog } from "./components/LicenseDialog";
import { ThemePicker } from "./components/ThemePicker";
import { DetailPage } from "./detail/DetailPage";
import { DiskHealthView } from "./diskhealth/DiskHealthView";
import { FileRepairView } from "./home/FileRepairView";
import { HomeView } from "./home/HomeView";
import { isTauri } from "./lib/ipc";
import { watchAdminEvents, watchDevicesNotice } from "./state/devices";
import { watchLicenseEvents, useLicense } from "./state/license";
import { watchRecoveryEvents } from "./state/recovery";
import { watchScanEvents } from "./state/scan";
import { useToast, toast } from "./state/toast";
import { useView } from "./state/view";
import { Sidebar } from "./shell/Sidebar";
import { Splash } from "./shell/Splash";
import { TitleBar } from "./shell/TitleBar";
import { TourDriver } from "./shell/TourDriver";

/**
 * AppShell — the single-window composition: custom title bar, sidebar
 * + main stack (page-swap with the CSS settle-in), the splash
 * lifecycle, event-bus wiring, overlays (license, theme, hamburger),
 * the toast bus, and the DEV tour driver.
 */
/** Persistent posture banner: grace (offline, N days left) and
 * degraded (reconnect to validate) — never shown for pro/unlicensed. */
function PostureBanner() {
  const state = useLicense((s) => s.state);
  if (!state) return null;
  if (state.posture === "grace") {
    const days = state.expiresAt ? Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 86400_000)) : 0;
    return (
      <div className="dw-posture dw-posture--grace">
        <TriangleAlert size={14} />
        Offline — {days} day{days === 1 ? "" : "s"} left to validate your license. Features stay fully unlocked.
      </div>
    );
  }
  if (state.posture === "degraded") {
    return (
      <div className="dw-posture dw-posture--degraded">
        <TriangleAlert size={14} />
        Your license needs to reconnect to validate. Recovery is paused until the connection returns.
      </div>
    );
  }
  return null;
}

export function App() {
  const page = useView((s) => s.page);
  const menuOpen = useView((s) => s.menuOpen);
  const setMenuOpen = useView((s) => s.setMenuOpen);
  const toastCurrent = useToast((s) => s.current);
  const dismissToast = useToast((s) => s.dismiss);
  const licenseLoaded = useLicense((s) => s.loaded);

  const [splash, setSplash] = useState(true);
  const [elevated, setElevated] = useState(false);
  const bootedRef = useRef(false);

  /* Boot: splash → enumerate devices → land. */
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    void (async () => {
      const { useDevices } = await import("./state/devices");
      const store = useDevices.getState();
      await store.refresh(); // ~0.9s "Reading the disk information" beat
      setElevated(store.elevated);
      window.setTimeout(() => setSplash(false), 1250);
    })();

    void useLicense.getState().load();
  }, []);

  /* Event-bus wiring (once). */
  useEffect(() => {
    const offs = [watchScanEvents(), watchRecoveryEvents(), watchLicenseEvents(), watchAdminEvents(), watchDevicesNotice()];
    return () => offs.forEach((f) => f());
  }, []);

  /* First-unlicensed-boot: auto-open the activation dialog once. */
  useEffect(() => {
    if (licenseLoaded && useLicense.getState().state?.posture === "unlicensed" && !splash) {
      const seen = sessionStorage.getItem("dw.act_prompted");
      if (!seen) {
        sessionStorage.setItem("dw.act_prompted", "1");
        window.setTimeout(() => useLicense.getState().openDialog(), 900);
      }
    }
  }, [licenseLoaded, splash]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="dw-app">
        <TitleBar onMenu={() => setMenuOpen(!menuOpen)} />
        <div className="dw-body">
          <Sidebar />
          <main className="dw-main">
            {page === "home" && <HomeView key="home" />}
            {page === "sd-card" && <HomeView key="sd" />}
            {page === "detail" && <DetailPage key="detail" />}
            {page === "disk-health" && <DiskHealthView key="health" />}
            {page === "file-repair" && <FileRepairView key="repair" />}
          </main>
        </div>

        {/* Posture banners (grace / degraded — the licensing contract). */}
        <PostureBanner />

        {/* Overlays */}
        <HamburgerMenu />
        <ThemePicker />
        <LicenseDialog />
        <Splash visible={splash} elevated={elevated} />

        <AnimatePresence>
          {toastCurrent && (
            <motion.div
              key={toastCurrent.id}
              className={`dw-toast dw-toast--${toastCurrent.icon}`}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 460, damping: 32 }}
              onClick={dismissToast}
              role="status"
            >
              <span className="dw-toast__icon">
                {toastCurrent.icon === "success" ? <CircleCheck /> : toastCurrent.icon === "error" ? <CircleAlert /> : toastCurrent.icon === "warn" ? <TriangleAlert /> : <Info />}
              </span>
              {toastCurrent.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DEV tour driver (mock/agent harness — never in release). */}
        {!isTauri() && <TourDriver />}
      </div>
    </MotionConfig>
  );
}

export { toast };
