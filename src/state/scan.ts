/**
 * Scan store — the two-phase scan lifecycle (quick → advanced →
 * organizing → complete) with pause/resume/stop, the celebration
 * modal, and the stop-confirm dialog. All progress arrives via the
 * `scan-progress` event (the star-topology engine → UI channel).
 */
import { create } from "zustand";
import type { DeviceInfo, FileNode, ScanProgress } from "../domain";
import { invoke, listen } from "../lib/ipc";

export interface ScanStats {
  filesFound: number;
  bytesFound: number;
  usedTimeMs: number;
}

interface ScanStore {
  running: boolean;
  paused: boolean;
  progress: ScanProgress | null;
  target: DeviceInfo | null;
  stats: ScanStats | null;
  /** Quick-phase completion payload (the CQuickScanCompleteWnd beat). */
  quickStats: { files: number; bytes: number } | null;
  showQuickComplete: boolean;
  showCelebration: boolean;
  showStopConfirm: boolean;
  reconNodes: FileNode[];

  start(device: DeviceInfo): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  askStop(): void;
  cancelStop(): void;
  confirmStop(): Promise<void>;
  dismissCelebration(): void;
  dismissQuickComplete(): void;
  reset(): void;
}

export const useScan = create<ScanStore>((set, get) => ({
  running: false,
  paused: false,
  progress: null,
  target: null,
  stats: null,
  quickStats: null,
  showQuickComplete: false,
  showCelebration: false,
  showStopConfirm: false,
  reconNodes: [],

  async start(device) {
    set({
      running: true,
      paused: false,
      progress: null,
      target: device,
      stats: null,
      quickStats: null,
      showQuickComplete: false,
      showCelebration: false,
      reconNodes: [],
    });
    try {
      await invoke("start_scan", { deviceId: device.id });
    } catch (e) {
      // Roll back the optimistic running state — the scan never started.
      set({ running: false, paused: false, target: null });
      void import("./toast").then(({ toast }) =>
        toast("error", "The scan could not start — the device may have been disconnected."),
      );
      throw e;
    }
  },

  async pause() {
    if (!get().running) return;
    await invoke("pause_scan");
    set({ paused: true });
  },

  async resume() {
    if (!get().running) return;
    await invoke("resume_scan");
    set({ paused: false });
  },

  askStop() {
    set({ showStopConfirm: true });
  },
  cancelStop() {
    set({ showStopConfirm: false });
  },
  async confirmStop() {
    set({ showStopConfirm: false, running: false, paused: false });
    await invoke("stop_scan");
  },

  dismissCelebration() {
    set({ showCelebration: false });
  },
  dismissQuickComplete() {
    set({ showQuickComplete: false });
  },

  reset() {
    set({
      running: false,
      paused: false,
      progress: null,
      target: null,
      stats: null,
      quickStats: null,
      showQuickComplete: false,
      showCelebration: false,
      showStopConfirm: false,
      reconNodes: [],
    });
  },
}));

/** Mounted once by App — wires the scan event bus into the store. */
export function watchScanEvents(): () => void {
  const unsubs = [
    listen<ScanProgress>("scan-progress", (p) => {
      useScan.setState({ progress: p });
      if (p.phase === "complete") {
        useScan.setState({
          running: false,
          paused: false,
          stats: {
            filesFound: p.filesFound,
            bytesFound: p.bytesFound,
            usedTimeMs: p.elapsedMs,
          },
          showCelebration: true,
        });
      }
    }),

    listen<{ files: number; bytes: number }>("scan-quick-complete", (s) => {
      useScan.setState({ quickStats: s, showQuickComplete: true });
      // Auto-dismiss the quick-complete beat as the advanced pass takes over.
      window.setTimeout(() => useScan.setState({ showQuickComplete: false }), 4_600);
    }),

    listen<{ nodes: FileNode[] }>("scan-recon-batch", (b) => {
      useScan.setState({ reconNodes: b.nodes });
    }),
  ];
  return () => {
    for (const p of unsubs) void p.then((f) => f());
  };
}
