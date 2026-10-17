/**
 * TourDriver (DEV-only component — the agent harness contract):
 * drives the full UI through its states with window-title markers so
 * the screenshot harness can capture exactly one named frame per
 * step (the DiskGenie CI approach: poll MainWindowTitle, dedupe on
 * the tNN-name marker, settle, capture).
 *
 * Steps auto-advance with dwell; the driver is mounted only in the
 * browser mock (never in the Tauri release build).
 */
import { useEffect, useState } from "react";
import { invoke, isTauri } from "../lib/ipc";
import { useDevices } from "../state/devices";
import { useResults } from "../state/results";
import { useScan } from "../state/scan";
import { useView } from "../state/view";

interface TourStep {
  marker: string;
  dwell: number;
  run: () => void | Promise<void>;
}

const TOUR: TourStep[] = [
  { marker: "t01-landing", dwell: 2600, run: () => {
      useView.getState().go("home", "hardware");
    } },
  { marker: "t02-device-selected", dwell: 2200, run: () => {
      useDevices.getState().select("disk0-part-c");
    } },
  { marker: "t03-scan-quick", dwell: 3200, run: async () => {
      const d = useDevices.getState().selectedDevice();
      if (d) await useScan.getState().start(d);
      useView.getState().setStep(2);
      useView.getState().go("detail");
    } },
  { marker: "t04-scan-advanced", dwell: 4200, run: () => {
      /* advanced pass begins automatically */
    } },
  { marker: "t05-scan-paused", dwell: 2000, run: () => {
      void useScan.getState().pause();
    } },
  { marker: "t06-scan-resumed", dwell: 2400, run: () => {
      void useScan.getState().resume();
    } },
  { marker: "t07-results", dwell: 3200, run: () => {
      /* results browsing */
    } },
  { marker: "t08-disk-health", dwell: 2600, run: () => {
      useView.getState().go("disk-health", "disk-health");
    } },
  { marker: "t09-sd-card", dwell: 2200, run: () => {
      useView.getState().go("sd-card", "sd-card");
    } },
  { marker: "t10-file-repair", dwell: 2200, run: () => {
      useView.getState().go("file-repair", "file-repair");
    } },
  { marker: "t11-license-dialog", dwell: 2400, run: () => {
      useView.getState().go("home", "hardware");
      void import("../state/license").then(({ useLicense }) => useLicense.getState().openDialog());
    } },
  { marker: "t12-theme-picker", dwell: 2400, run: () => {
      void import("../state/license").then(({ useLicense }) => useLicense.getState().closeDialog());
      useView.getState().setThemePickerOpen(true);
    } },
];

export function TourDriver() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isTauri()) return undefined;
    void invoke<{ tour: boolean }>("get_dev_hooks").then((h) => {
      if (h.tour) setActive(true);
    });
    return undefined;
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const s = TOUR[step];
    if (!s) {
      document.title = "DiskWizard · tour-complete";
      return undefined;
    }
    document.title = `DiskWizard · ${s.marker}`;
    void Promise.resolve(s.run());
    const t = window.setTimeout(() => setStep((v) => v + 1), s.dwell);
    return () => window.clearTimeout(t);
  }, [active, step]);

  if (!active) return null;
  return (
    <div style={{ position: "fixed", left: 10, bottom: 10, zIndex: 300, fontSize: 10, opacity: 0.5 }} className="mono">
      tour: {TOUR[step]?.marker ?? "done"}
    </div>
  );
}

/** Agent SDK surface (window.__dwMock is installed by the mock core). */
export function agentHooksDescription(): string {
  return [
    "window.__dwMock.devices() → device inventory",
    "window.__dwMock.setLicense('pro'|'unlicensed') → posture flip",
    "window.__dwMock.reset() → reset scan + license",
    "window.__dwMock.state() → { scanRun, license }",
    "?tour=1 → auto tour with tNN-name title markers",
  ].join("\n");
}

void useResults;
