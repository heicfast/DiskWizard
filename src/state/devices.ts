/**
 * Devices store — inventory + enumeration lifecycle + SMART reports.
 * Mirrors the core contract: `enumerate_devices` (behind the splash),
 * per-device health lookups, and the elevation state for the title
 * chip.
 */
import { create } from "zustand";
import type { DeviceInfo, DiskHealthReport } from "../domain";
import { invoke, listen } from "../lib/ipc";

interface DevicesStore {
  scanning: boolean;
  devices: DeviceInfo[];
  /** The selected device id on the landing page (Scan CTA target). */
  selectedId: string | null;
  elevated: boolean;
  adminDeclined: boolean;
  health: Record<string, DiskHealthReport | null>;

  refresh(): Promise<void>;
  select(id: string | null): void;
  selectedDevice(): DeviceInfo | null;
  loadHealth(diskId: string): Promise<void>;
  loadAllHealth(): Promise<void>;
}

export const useDevices = create<DevicesStore>((set, get) => ({
  scanning: false,
  devices: [],
  selectedId: null,
  elevated: false,
  adminDeclined: false,
  health: {},

  async refresh() {
    set({ scanning: true });
    try {
      const devices = await invoke<DeviceInfo[]>("enumerate_devices");
      const elevated = await invoke<boolean>("is_elevated");
      const prev = get().selectedId;
      set({
        devices,
        elevated,
        scanning: false,
        selectedId: prev != null && devices.some((d) => d.id === prev) ? prev : null,
      });
    } catch (e) {
      set({ scanning: false });
      console.error("enumerate_devices failed", e);
    }
  },

  select(id) {
    set({ selectedId: id });
  },

  selectedDevice() {
    const { devices, selectedId } = get();
    return devices.find((d) => d.id === selectedId) ?? null;
  },

  async loadHealth(diskId) {
    const report = await invoke<DiskHealthReport | null>("get_disk_health", { diskId });
    set((s) => ({ health: { ...s.health, [diskId]: report } }));
  },

  async loadAllHealth() {
    const reports = await invoke<Array<DiskHealthReport | null>>("get_health_reports");
    const map: Record<string, DiskHealthReport | null> = {};
    for (const r of reports) {
      if (r) map[r.diskId] = r;
    }
    set({ health: map });
  },
}));

/** The admin-decline toast subscription (mounted once by App). */
export function watchAdminEvents(): () => void {
  const unsub = listen<{ reason: string }>("admin-restart-failed", () => {
    useDevices.setState({ adminDeclined: true });
    void import("./toast").then(({ toast }) =>
      toast("warn", "Elevation was declined — raw disk access needs administrator rights. Restart as admin to continue."),
    );
  });
  return () => {
    void unsub.then((f) => f());
  };
}

/** Device arrival/removal notices (mount events parity). */
export function watchDevicesNotice(): () => void {
  return () => undefined; // mock core enumerates on refresh; live events land with the Rust core
}
