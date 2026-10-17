/**
 * Device inventory + SMART reports — realistic parameters modeled on
 * the research corpus (Windows runner machine: Samsung SSD 970 EVO
 * system disk with Windows(C:) 31 GB/149 GB, a second internal volume,
 * external USB + SD peripherals, a BitLocker-locked volume, and a lost
 * partition recoverable via deep scan).
 */
import type { DeviceInfo, DiskHealthReport, SmartAttribute } from "../domain";

const GB = 1024 ** 3;

export const DEVICES: DeviceInfo[] = [
  {
    id: "disk0-part-c",
    kind: "internal-partition",
    name: "Windows (C:)",
    model: "Samsung SSD 970 EVO Plus 500GB",
    busType: "NVMe",
    fileSystem: "NTFS",
    capacityBytes: 149.45 * GB,
    usedBytes: 31.15 * GB,
    health: "good",
    trim: "on",
    isSystem: true,
    recoverableBytes: 1.9 * GB,
  },
  {
    id: "disk0-part-d",
    kind: "internal-partition",
    name: "Data (D:)",
    model: "Samsung SSD 970 EVO Plus 500GB",
    busType: "NVMe",
    fileSystem: "NTFS",
    capacityBytes: 149.45 * GB,
    usedBytes: 146.07 * GB,
    health: "good",
    trim: "on",
    recoverableBytes: 12.4 * GB,
  },
  {
    id: "disk1",
    kind: "internal-disk",
    name: "Seagate BarraCuda 2TB",
    model: "ST2000DM008-2FR102",
    busType: "SATA",
    fileSystem: "RAW",
    capacityBytes: 2000.4 * GB,
    health: "caution",
    trim: "off",
    recoverableBytes: 87.1 * GB,
  },
  {
    id: "usb-sandisk",
    kind: "usb",
    name: "SanDisk Extreme (E:)",
    model: "SanDisk Extreme PRO 128GB",
    busType: "USB",
    fileSystem: "exFAT",
    capacityBytes: 119.5 * GB,
    usedBytes: 43.8 * GB,
    health: "good",
    recoverableBytes: 9.6 * GB,
  },
  {
    id: "sd-kingston",
    kind: "sd",
    name: "Kingston Canvas (F:)",
    model: "Kingston Canvas Go! Plus 64GB",
    busType: "SD",
    fileSystem: "RAW",
    capacityBytes: 59.5 * GB,
    usedBytes: 0,
    health: "caution",
    recoverableBytes: 22.3 * GB,
  },
  {
    id: "wd-bitlocker",
    kind: "bitlocker-locked",
    name: "My Book (G:) — BitLocker",
    model: "WD My Book 25EE 4TB",
    busType: "USB",
    fileSystem: "BitLocker",
    capacityBytes: 4000.7 * GB,
    usedBytes: 2100.4 * GB,
    health: "good",
    locked: true,
    recoverableBytes: 0,
  },
  {
    id: "lost-part-0",
    kind: "lost-partition",
    name: "Lost Partition (135.2 GB)",
    model: "On Seagate BarraCuda 2TB",
    busType: "SATA",
    fileSystem: "NTFS",
    capacityBytes: 135.2 * GB,
    health: "caution",
    recoverableBytes: 47.8 * GB,
  },
];

export const QUICK_LOCATIONS: DeviceInfo[] = [
  {
    id: "recycle-bin",
    kind: "recycle-bin",
    name: "Recycle Bin",
    fileSystem: "—",
    capacityBytes: 31.15 * GB,
    recoverableBytes: 0.42 * GB,
  },
  {
    id: "desktop",
    kind: "desktop",
    name: "Desktop",
    fileSystem: "NTFS",
    capacityBytes: 31.15 * GB,
    recoverableBytes: 0.11 * GB,
  },
];

/* ── SMART reports ─────────────────────────────────────────────────────── */

function attr(
  id: number,
  name: string,
  current: number,
  worst: number,
  threshold: number,
  raw: string,
  status: SmartAttribute["status"] = "ok",
): SmartAttribute {
  return { id, name, current, worst, threshold, raw, status };
}

export const HEALTH_REPORTS: Record<string, DiskHealthReport> = {
  "disk0-part-c": {
    diskId: "disk0-part-c",
    diskName: "Samsung SSD 970 EVO Plus 500GB",
    state: "good",
    temperatureC: 41,
    powerOnHours: 3814,
    powerCycles: 1092,
    interface: "PCIe 4.0 x4 NVMe",
    firmware: "2B2QEXM7",
    serial: "S4EWNX0N123456J",
    attributes: [
      attr(5, "Reallocated Sectors Count", 100, 100, 10, "0"),
      attr(9, "Power On Hours", 96, 96, 0, "3814"),
      attr(12, "Power Cycle Count", 99, 99, 0, "1092"),
      attr(170, "Available Reserved Space", 100, 100, 3, "10%"),
      attr(173, "Wear Leveling Count", 98, 98, 3, "42"),
      attr(176, "Program Fail Count", 100, 100, 10, "0"),
      attr(177, "Erase Fail Count", 100, 100, 10, "0"),
      attr(181, "Program Fail Count (Total)", 100, 100, 10, "0"),
      attr(182, "Erase Fail Count (Total)", 100, 100, 10, "0"),
      attr(187, "Uncorrectable Error Count", 100, 100, 0, "0"),
      attr(190, "Airflow/Temperature", 83, 72, 45, "41°C", "caution"),
      attr(194, "Temperature", 83, 72, 40, "41°C"),
      attr(195, "ECC Error Rate", 100, 100, 0, "0"),
      attr(199, "CRC Error Count", 100, 100, 0, "0"),
      attr(231, "SSD Life Left", 97, 97, 5, "97%"),
      attr(232, "Endurance Remaining", 97, 97, 5, "97%"),
      attr(241, "Total LBA Written", 100, 100, 0, "62.4 TB"),
      attr(242, "Total LBA Read", 100, 100, 0, "88.1 TB"),
    ],
  },
  "disk1": {
    diskId: "disk1",
    diskName: "Seagate BarraCuda 2TB",
    state: "caution",
    temperatureC: 46,
    powerOnHours: 26412,
    powerCycles: 3188,
    interface: "SATA 6 Gb/s",
    firmware: "SC60",
    serial: "ZA14X8Q2M",
    attributes: [
      attr(5, "Reallocated Sectors Count", 100, 100, 36, "0"),
      attr(9, "Power On Hours", 90, 90, 0, "26412"),
      attr(10, "Spin Retry Count", 100, 100, 97, "0"),
      attr(12, "Power Cycle Count", 98, 98, 0, "3188"),
      attr(187, "Reported Uncorrectable Errors", 84, 84, 0, "16", "caution"),
      attr(188, "Command Timeout", 88, 88, 0, "512", "caution"),
      attr(190, "Airflow/Temperature", 69, 62, 45, "46°C"),
      attr(194, "Temperature", 69, 62, 40, "46°C", "caution"),
      attr(197, "Current Pending Sector Count", 92, 92, 0, "112", "bad"),
      attr(198, "Uncorrectable Sector Count", 92, 92, 0, "112", "bad"),
      attr(199, "UDMA CRC Error Count", 200, 200, 0, "0"),
      attr(240, "Head Flying Hours", 91, 91, 0, "25980"),
    ],
  },
};

/** Derive a report for peripherals (SD/USB → bridge SMART subset). */
export function healthFor(device: DeviceInfo): DiskHealthReport | null {
  if (HEALTH_REPORTS[device.id]) return HEALTH_REPORTS[device.id];
  if (device.kind === "usb" || device.kind === "sd") {
    const caution = device.health === "caution";
    return {
      diskId: device.id,
      diskName: device.model ?? device.name,
      state: device.health ?? "good",
      temperatureC: caution ? 49 : 37,
      powerOnHours: caution ? 2210 : 640,
      powerCycles: caution ? 728 : 190,
      interface: device.busType === "SD" ? "UHS-I SD" : "USB 3.2 Gen 1",
      firmware: caution ? "1.00s" : "2.10",
      serial: caution ? "0000000000117" : "AA0103148821C",
      attributes: [
        attr(5, "Reallocated Sectors Count", 100, 100, 10, "0"),
        attr(9, "Power On Hours", 94, 94, 0, String(caution ? 2210 : 640)),
        attr(10, "Spin Retry Count", 100, 100, 97, "0"),
        attr(12, "Power Cycle Count", 99, 99, 0, String(caution ? 728 : 190)),
        attr(194, "Temperature", 76, 64, 40, `${caution ? 49 : 37}°C`, caution ? "caution" : "ok"),
        attr(196, "Reallocation Event Count", 100, 100, 0, "0"),
        attr(197, "Current Pending Sector Count", caution ? 96 : 100, 96, 0, caution ? "48" : "0", caution ? "caution" : "ok"),
        attr(198, "Uncorrectable Sector Count", caution ? 96 : 100, 96, 0, caution ? "48" : "0", caution ? "caution" : "ok"),
        attr(199, "UDMA CRC Error Count", 100, 100, 0, "0"),
      ],
    };
  }
  return null;
}

/** The session-resume banner payload (a prior .rsf on disk 0 C:). */
export const LAST_SESSION = {
  id: "auto_Windows_C_09_17_21_14_06",
  volume: "Windows (C:)",
  scannedAt: "09/17/2026 9:14 PM",
  filesFound: 481_204,
  sizeBytes: 61.3 * GB,
  durationMs: 14 * 60 * 1000 + 42 * 1000,
};
