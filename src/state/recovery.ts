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
  targets: DestinationTarget[];
  selectedTargetId: string | null;
  customFolder: string | null;
  enableFileRepair: boolean;
  saveEnabled: boolean;
  busy: boolean;

  progress: RecoveryProgress | null;
  showProgress: boolean;
  showComplete: boolean;
  destSummary: { files: number; failed: number; dest: string } | null;

  openDialog(fileCount: number, bytesTotal: number): Promise<void>;
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
  targets: [],
  selectedTargetId: null,
  customFolder: null,
  enableFileRepair: true,
  saveEnabled: false,
  busy: false,

  progress: null,
  showProgress: false,
  showComplete: false,
  destSummary: null,

  async openDialog(fileCount, bytesTotal) {
    set({ dialogOpen: true, fileCount, bytesTotal, selectedTargetId: null, customFolder: null });
    const targets = await invoke<DestinationTarget[]>("list_destinations");
    set({ targets });
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
    const { selectedTargetId, customFolder, fileCount } = get();
    const dest = customFolder ?? get().targets.find((t) => t.id === selectedTargetId)?.name ?? "D:\\Recovered Files";
    // File ids arrive from the results store via the caller context.
    set({ busy: true, showProgress: true, dialogOpen: false });
    const ids = (window as unknown as { __dwRecoverIds?: string[] }).__dwRecoverIds ?? [];
    try {
      await invoke("recover_files", { fileIds: ids, destination: dest });
    } finally {
      set({ busy: false });
    }
    void fileCount;
  },

  cancel() {
    set({ showProgress: false, progress: null, dialogOpen: false });
  },

  dismissComplete() {
    set({ showComplete: false, showProgress: false, progress: null, destSummary: null });
  },

  reset() {
    set({
      dialogOpen: false,
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
    useRecovery.setState({ progress: p });
    if (p.finished) {
      useRecovery.setState({
        showComplete: true,
        showProgress: false,
        destSummary: { files: p.filesTotal, failed: p.failed, dest: "D:\\Recovered Files" },
      });
    }
  });
  return () => {
    void unsub.then((f) => f());
  };
}
