/**
 * Recovery store — the destination dialog, the progress job, and the
 * completion summary (the recovery funnel's state).
 */
import { create } from "zustand";
import type { RecoveryProgress } from "../domain";
import { invoke, listen } from "../lib/ipc";

export interface DestinationTarget {
  id: string;
  name: string;
  capacityBytes: number;
  freeBytes: number;
  isSource: boolean;
}

interface RecoveryStore {
  dialogOpen: boolean;
  fileCount: number;
  bytesTotal: number;
  /** The file ids to recover (in-store — no window side-channels). */
  fileIds: string[];
  /** The pending intent kept across the license gate (activation resume). */
  pendingIntent: { fileCount: number; bytesTotal: number; fileIds: string[] } | null;
  targets: DestinationTarget[];
  /** The scan's source device — the save-to-source guard. */
  sourceId: string | null;
  selectedTargetId: string | null;
  customFolder: string | null;
  enableFileRepair: boolean;
  saveEnabled: boolean;
  busy: boolean;

  destPath: string;
  progress: RecoveryProgress | null;
  showProgress: boolean;
  showComplete: boolean;
  destSummary: { files: number; failed: number; dest: string } | null;

  openDialog(fileIds: string[], fileCount: number, bytesTotal: number): Promise<void>;
  closeDialog(): void;
  selectTarget(id: string | null): void;
  chooseFolder(): Promise<void>;
  setFileRepair(on: boolean): void;
  confirm(): Promise<void>;
  cancel(): void;
  dismissComplete(): void;
  reset(): void;
}

export const useRecovery = create<RecoveryStore>((set, get) => ({
  dialogOpen: false,
  fileCount: 0,
  bytesTotal: 0,
  fileIds: [],
  pendingIntent: null,
  targets: [],
  sourceId: null,
  selectedTargetId: null,
  customFolder: null,
  enableFileRepair: true,
  saveEnabled: false,
  busy: false,
  destPath: "D:\\Recovered Files",

  progress: null,
  showProgress: false,
  showComplete: false,
  destSummary: null,

  async openDialog(fileIds, fileCount, bytesTotal) {
    const { useScan } = await import("./scan");
    const source = useScan.getState().target;
    set({
      dialogOpen: true,
      fileIds,
      fileCount,
      bytesTotal,
      selectedTargetId: null,
      customFolder: null,
      sourceId: source?.id ?? null,
    });
    const targets = await invoke<DestinationTarget[]>("list_destinations");
    set({
      targets: targets.map((t) => ({ ...t, isSource: t.id === source?.id })),
    });
  },

  closeDialog() {
    set({ dialogOpen: false });
  },

  selectTarget(id) {
    set({ selectedTargetId: id, customFolder: null, saveEnabled: id != null || get().customFolder != null });
  },

  async chooseFolder() {
    const folder = await invoke<string>("select_folder");
    set({ customFolder: folder, selectedTargetId: null, saveEnabled: true });
  },

  setFileRepair(on) {
    set({ enableFileRepair: on });
  },

  async confirm() {
    const { selectedTargetId, customFolder, fileCount, fileIds, bytesTotal } = get();
    const dest = customFolder ?? get().targets.find((t) => t.id === selectedTargetId)?.name ?? "D:\\Recovered Files";
    set({ busy: true, showProgress: true, dialogOpen: false, destPath: dest });
    try {
      await invoke("recover_files", { fileIds, destination: dest });
    } catch (e) {
      // The license gate raises the activation dialog via the ipc
      // interceptor; keep the intent so activation can resume recovery.
      const gated = String(e).includes("ACTIVATION_REQUIRED") || String(e).includes("LICENSE_STALE");
      set({
        busy: false,
        showProgress: gated,
        pendingIntent: gated ? { fileCount, bytesTotal, fileIds } : null,
      });
      if (!gated) {
        set({ showProgress: false });
        void import("./toast").then(({ toast }) =>
          toast("error", "Recovery could not start — check the destination and try again."),
        );
      }
      return;
    }
    set({ busy: false });
  },

  cancel() {
    void invoke("cancel_recovery").catch(() => undefined);
    set({ showProgress: false, progress: null, dialogOpen: false, pendingIntent: null });
  },

  dismissComplete() {
    set({ showComplete: false, showProgress: false, progress: null, destSummary: null });
  },

  reset() {
    set({
      dialogOpen: false,
      pendingIntent: null,
      sourceId: null,
      progress: null,
      showProgress: false,
      showComplete: false,
      destSummary: null,
      selectedTargetId: null,
      customFolder: null,
      saveEnabled: false,
    });
  },
}));

/** Mounted once by App. */
export function watchRecoveryEvents(): () => void {
  const unsub = listen<RecoveryProgress>("recovery-progress", (p) => {
    const st = useRecovery.getState();
    // A finished event for a job the user cancelled is dropped.
    if (p.finished && !st.showProgress && !st.busy) return;
    useRecovery.setState({ progress: p });
    if (p.finished) {
      useRecovery.setState({
        showComplete: true,
        showProgress: false,
        destSummary: { files: p.filesTotal, failed: p.failed, dest: st.destPath },
      });
    }
  });
  return () => {
    void unsub.then((f) => f());
  };
}

/** Resume a pending recovery after successful activation. */
export function resumePendingRecovery(): void {
  const { pendingIntent } = useRecovery.getState();
  if (!pendingIntent) return;
  useRecovery.setState({ pendingIntent: null });
  void useRecovery.getState().openDialog(pendingIntent.fileIds, pendingIntent.fileCount, pendingIntent.bytesTotal);
}
