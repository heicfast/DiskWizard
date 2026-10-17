/**
 * Domain types — the command-surface contract shared by the UI, the
 * browser mock core, and (later) the Rust core. Modeled 1:1 on the
 * reverse-engineered architecture: device inventory with 50-state icon
 * semantics, two-phase scan engine (quick → advanced carving), the
 * three-branch results tree, recoverability grading, SMART health, and
 * the license posture machine.
 */

/* ── Devices ─────────────────────────────────────────────────────────── */

export type DeviceKind =
  | "internal-disk"
  | "internal-partition"
  | "external-disk"
  | "usb"
  | "sd"
  | "lost-partition"
  | "bitlocker-locked"
  | "recycle-bin"
  | "desktop"
  | "folder";

export type FileSystemKind =
  | "NTFS"
  | "NTFS5"
  | "FAT32"
  | "FAT16"
  | "exFAT"
  | "ReFS"
  | "ext4"
  | "ext3"
  | "HFS+"
  | "RAW"
  | "BitLocker"
  | "—";

export type HealthState = "good" | "caution" | "bad";

export interface DeviceInfo {
  /** Stable id (mock: deterministic; core: volume/disk identity card). */
  id: string;
  kind: DeviceKind;
  /** Display name — "Windows (C:)", "Samsung T7 (E:)", "Recycle Bin". */
  name: string;
  /** Hardware model when the row is a physical disk. */
  model?: string;
  busType?: "NVMe" | "SATA" | "USB" | "SD";
  fileSystem: FileSystemKind;
  capacityBytes: number;
  usedBytes?: number;
  health?: HealthState;
  /** SSD TRIM advisory chip ("TRIM ON" suppresses deleted-file odds). */
  trim?: "on" | "off";
  /** BitLocker locked volume (needs unlock before scan). */
  locked?: boolean;
  isSystem?: boolean;
  /** Estimated recoverable data surfaced on tiles (grading preview). */
  recoverableBytes?: number;
}

/* ── Disk health (SMART — the always-free feature) ───────────────────── */

export interface SmartAttribute {
  id: number;
  name: string;
  current: number;
  worst: number;
  threshold: number;
  raw: string;
  status: "ok" | "caution" | "bad";
}

export interface DiskHealthReport {
  diskId: string;
  diskName: string;
  state: HealthState;
  temperatureC: number;
  powerOnHours: number;
  powerCycles: number;
  interface: string;
  firmware: string;
  serial: string;
  attributes: SmartAttribute[];
}

/* ── Scan ────────────────────────────────────────────────────────────── */

export type ScanPhase =
  | "idle"
  | "sdr"
  | "quick"
  | "quick-complete"
  | "advanced"
  | "organizing"
  | "complete"
  | "paused"
  | "stopped";

export interface ScanProgress {
  phase: ScanPhase;
  /** 0..100 within the CURRENT phase. */
  percent: number;
  filesFound: number;
  bytesFound: number;
  /** Sector ticker (advanced phase): "Reading sector: X/Y". */
  sector: number;
  sectorsTotal: number;
  remainingSec: number;
  elapsedMs: number;
  /** The live "Searching: <path>" ticker value. */
  searching: string;
  /** Quick-phase file count (the CQuickScanCompleteWnd stat). */
  quickFiles?: number;
}

/* ── Results tree (the three-branch grammar + special branches) ─────── */

export type FileCategory =
  | "folder"
  | "photo"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "email"
  | "bookmark"
  | "other";

export type FileStatus = "existing" | "deleted" | "reconstructed";

/** Recovery-chance grading (CCheckNodeThread semantics: 0 poor, 2 high). */
export type RecoveryGrade = "high" | "medium" | "low" | "unknown";

export interface FileNode {
  id: string;
  parentId: string | null;
  name: string;
  /** Full display path (mock builds it; core owns it). */
  path: string;
  isFolder: boolean;
  sizeBytes: number;
  modifiedMs: number;
  category: FileCategory;
  status: FileStatus;
  grade: RecoveryGrade;
  /** Folder aggregate — file count under the folder. */
  fileCount?: number;
}

export type TreeMode = "path" | "type";

/* ── Preview ─────────────────────────────────────────────────────────── */

export interface FilePreview {
  fileId: string;
  previewable: boolean;
  /** Emoji-free placeholder token the UI renders per category. */
  placeholder: "image" | "video" | "audio" | "document" | "archive" | "generic";
  widthPx?: number;
  heightPx?: number;
  /** Free-tier cap flags (DRW parity: 100 MB cap, 15 s video cap). */
  capReason?: "size" | "video-trial" | "format" | "unreadable";
}

/* ── Recovery ────────────────────────────────────────────────────────── */

export interface RecoveryProgress {
  jobId: string;
  filesDone: number;
  filesTotal: number;
  bytesDone: number;
  currentFile: string;
  failed: number;
  finished: boolean;
}

export interface ScanSession {
  id: string;
  volume: string;
  scannedAt: string;
  filesFound: number;
  sizeBytes: number;
  durationMs: number;
}

/* ── License (DiskGenie posture machine, DiskWizard prefix) ──────────── */

export type LicensePosture = "unlicensed" | "pro" | "grace" | "degraded";

export interface LicenseState {
  posture: LicensePosture;
  tier: "trial" | "yearly" | "lifetime" | null;
  name?: string;
  email?: string;
  activatedAt?: number;
  expiresAt?: number;
  /** CI/agent simulation marker — never true in production builds. */
  simulated: boolean;
  /** Trial allowance consumed (bytes) — the 2 GB free ladder. */
  trialRecoveredBytes: number;
}

/* ── App / misc ──────────────────────────────────────────────────────── */

export interface DevHooks {
  tour: boolean;
  tourMode?: "ui" | "license";
  licenseSim?: boolean;
  scanTarget?: string;
  window?: string;
}

export interface UpdateCheck {
  current: string;
  latest: string;
  upToDate: boolean;
}
