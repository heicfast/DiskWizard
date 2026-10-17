/**
 * The browser mock core — implements the ENTIRE command surface with a
 * realistic simulated engine (two-phase scan with progress, sector
 * tickers, progressive tree growth, recovery funnel, SMART health, and
 * the license posture machine with the hard ACTIVATION_REQUIRED gate).
 *
 * DEV-gated: installed only when !isTauri() && import.meta.env.DEV, so
 * the mock never ships in a production bundle (DiskGenie contract).
 *
 * The same commands will be provided by the Rust core when it lands —
 * the UI is wired against this surface only via src/lib/ipc.ts.
 */
import type {
  DevHooks,
  DeviceInfo,
  DiskHealthReport,
  FileNode,
  FilePreview,
  LicenseState,
  RecoveryProgress,
  ScanProgress,
  ScanSession,
  UpdateCheck,
} from "../domain";
import { emitMockEvent, setMockBackend } from "../lib/ipc";
import { DEVICES, QUICK_LOCATIONS, LAST_SESSION, healthFor } from "./inventory";
import {
  DEVICE_PROFILES,
  MEDIA_RECON_FILES,
  MEDIA_ROOTS,
  QUICK_PHASE_FILES,
  RECON_FILES,
  ROOTS,
  childrenOf,
  mediaChildrenOf,
  nodeById,
  SEARCH_PATHS,
} from "./filetree";

const GB = 1024 ** 3;

/* ── Dev hooks (URL params for the tour harness) ───────────────────────── */

function readDevHooks(): DevHooks {
  const p = new URLSearchParams(window.location.search);
  return {
    tour: p.get("tour") === "1",
    tourMode: (p.get("tour_mode") as DevHooks["tourMode"]) ?? "ui",
    licenseSim: p.get("license_sim") === "1",
    scanTarget: p.get("scan") ?? undefined,
    window: p.get("window") ?? undefined,
  };
}

/* ── License state (mock posture machine) ──────────────────────────────── */

const SIM_USER = { name: "Alex Morgan", email: "alex@diskwizard.app" };

let license: LicenseState = readDevHooks().licenseSim
  ? {
      posture: "pro",
      tier: "lifetime",
      ...SIM_USER,
      activatedAt: Date.now() - 32 * 86400_000,
      simulated: true,
      trialRecoveredBytes: 0,
    }
  : { posture: "unlicensed", tier: "trial", simulated: false, trialRecoveredBytes: 0 };

const LICENSE_API_ERRORS = {
  badFormat: "ACTIVATION_FAILED. The license code format is invalid.",
  invalid: "ACTIVATION_FAILED. License code not found. Check the code and try again.",
  expired: "ACTIVATION_FAILED. This license code has expired.",
  deviceMismatch: "ACTIVATION_FAILED. This license is already active on another device.",
} as const;

/** The 2 GB trial recovery ladder (DRW free-tier funnel parity). */
const TRIAL_QUOTA = 2 * GB;

/* ── Scan engine simulation ────────────────────────────────────────────── */

interface ScanRun {
  scanId: string;
  device: DeviceInfo;
  /** Per-device realism profile (targets, corpus style, sector count). */
  profile: { files: number; bytes: number; media: boolean; sectors: number };
  phase: ScanProgress["phase"];
  startedAt: number;
  elapsedBefore: number;
  percent: number;
  filesFound: number;
  bytesFound: number;
  sector: number;
  paused: boolean;
  timer: number | null;
  tick: number;
  revealedRecon: number;
}

let scanRun: ScanRun | null = null;
let scanTick = 0;

const DEFAULT_SECTORS = 314_135_598;

/** Compressed-but-realistic phase durations (dev simulation). */
const PHASE_MS = { sdr: 3_200, quick: 9_000, advanced: 15_000, organizing: 2_400 };

function scanEvent(): void {
  if (!scanRun) return;
  const run = scanRun;
  const elapsedMs = run.elapsedBefore + (Date.now() - run.startedAt);
  const remainingSec = run.phase === "quick"
    ? Math.max(1, Math.round((1 - run.percent / 100) * (PHASE_MS.quick / 1000)))
    : Math.max(1, Math.round((1 - run.percent / 100) * (PHASE_MS.advanced / 1000) * 58)); // scaled to "real" minutes grammar
  const progress: ScanProgress = {
    phase: run.phase,
    percent: run.percent,
    filesFound: run.filesFound,
    bytesFound: run.bytesFound,
    sector: run.sector,
    sectorsTotal: run.profile.sectors,
    remainingSec:
      run.phase === "advanced"
        ? Math.max(6, Math.round((run.profile.sectors / DEFAULT_SECTORS) * (463 + (1 - run.percent / 100) * 60)))
        : remainingSec,
    elapsedMs,
    searching:
      run.phase === "sdr"
        ? "SD Card Rescue: restoring access to the card..."
        : run.phase === "quick" || run.phase === "advanced"
          ? SEARCH_PATHS[scanTick % SEARCH_PATHS.length]
          : "Organizing found files...",
    quickFiles: run.phase === "quick" || run.phase === "quick-complete" ? run.filesFound : undefined,
  };
  emitMockEvent("scan-progress", progress);
}

function advanceScan(): void {
  if (!scanRun || run_phase_paused(scanRun)) return;
  const run = scanRun;
  scanTick++;
  const dt = 500;
  // Per-device realism targets (the scan profile).
  const FILES_TARGET = run.profile.files;
  const BYTES_TARGET = run.profile.bytes;

  if (run.phase === "sdr") {
    // SD Card Rescue: attempt to restore access to the card first.
    run.percent = Math.min(100, run.percent + (100 * dt) / PHASE_MS.sdr);
    if (run.percent >= 100) {
      run.phase = "quick";
      run.percent = 0;
    }
  } else if (run.phase === "quick") {
    run.percent = Math.min(100, run.percent + (100 * dt) / PHASE_MS.quick);
    // MFT walk: front-loaded discovery curve.
    const t = run.percent / 100;
    run.filesFound = Math.floor(FILES_TARGET * (1 - Math.pow(1 - t, 2.2)));
    run.bytesFound = BYTES_TARGET * (1 - Math.pow(1 - t, 2.0));
    if (run.percent >= 100) {
      run.phase = "quick-complete";
      emitMockEvent("scan-quick-complete", {
        files: FILES_TARGET,
        bytes: BYTES_TARGET,
      });
      // Auto-continue into the advanced (deep) pass after a beat.
      window.setTimeout(() => {
        if (scanRun === run && !run.paused) {
          run.phase = "advanced";
          run.percent = 0;
          run.sector = 0;
          scanEvent();
        }
      }, 1_400);
    }
  } else if (run.phase === "advanced") {
    run.percent = Math.min(100, run.percent + (100 * dt) / PHASE_MS.advanced);
    run.sector = Math.floor((run.percent / 100) * run.profile.sectors);
    // Carved adds: the Reconstructed branch grows through the deep pass.
    const t = run.percent / 100;
    const carved = Math.max(48, Math.floor(FILES_TARGET * 0.004));
    run.filesFound = FILES_TARGET + Math.floor(carved * t);
    run.bytesFound = BYTES_TARGET + (BYTES_TARGET * 0.008) * t;
    const reconPool = run.profile.media ? MEDIA_RECON_FILES : RECON_FILES;
    const reconTarget = Math.floor(reconPool.length * Math.pow(t, 1.6));
    if (reconTarget > run.revealedRecon) {
      emitMockEvent("scan-recon-batch", {
        from: run.revealedRecon,
        to: reconTarget,
        nodes: reconPool.slice(run.revealedRecon, reconTarget).map(publicNode),
      });
      run.revealedRecon = reconTarget;
    }
    if (run.percent >= 100) {
      run.phase = "organizing";
      run.percent = 0;
    }
  } else if (run.phase === "organizing") {
    run.percent = Math.min(100, run.percent + (100 * dt) / PHASE_MS.organizing);
    if (run.percent >= 100) {
      run.phase = "complete";
      run.filesFound = FILES_TARGET + Math.max(48, Math.floor(FILES_TARGET * 0.004));
      run.bytesFound = BYTES_TARGET * 1.008;
      emitMockEvent("scan-complete", {
        filesFound: run.filesFound,
        filesScanned: run.filesFound,
        bytesFound: run.bytesFound,
        usedTimeMs: run.elapsedBefore,
        organized: run.filesFound,
        scanId: run.scanId,
      });
      // The engine halts at completion — no further progress events.
      stopScanTimer();
    }
  }
  scanEvent();
}

function run_phase_paused(run: ScanRun): boolean {
  return run.paused;
}

function startScanTimer(): void {
  if (!scanRun || scanRun.timer) return;
  scanRun.timer = window.setInterval(advanceScan, 500);
}

function stopScanTimer(): void {
  if (scanRun?.timer) {
    window.clearInterval(scanRun.timer);
    scanRun.timer = null;
  }
}

/* ── Serialization (the public node shape) ───────────────────────────── */

function publicNode(n: FileNode): FileNode {
  return { ...n };
}

/* ── Recovery simulation ─────────────────────────────────────────────── */

interface RecoveryJob {
  jobId: string;
  files: FileNode[];
  /** Virtual "Recover All" aggregate when files is empty. */
  virtualTotal: number;
  virtualBytes: number;
  destPath: string;
  done: number;
  failed: number;
  timer: number | null;
}

let recoveryJob: RecoveryJob | null = null;

function advanceRecovery(): void {
  if (!recoveryJob) return;
  const job = recoveryJob;
  const virtual = job.files.length === 0;
  const total = virtual ? job.virtualTotal : job.files.length;
  // Virtual mode: percentage steps (11 ticks); file mode: per-file steps.
  job.done = virtual
    ? Math.min(total, Math.floor(total * Math.min(1, job.done / total + 1 / 11)))
    : job.done + 1;
  if (job.done >= total) {
    job.done = total;
    if (job.timer) window.clearInterval(job.timer);
    job.timer = null;
    const failed = Math.floor(total * 0.004);
    license = {
      ...license,
      trialRecoveredBytes: license.posture === "unlicensed"
        ? license.trialRecoveredBytes + (virtual ? job.virtualBytes : job.files.reduce((s, f) => s + f.sizeBytes, 0))
        : license.trialRecoveredBytes,
    };
    emitMockEvent("recovery-progress", {
      jobId: job.jobId,
      filesDone: job.done,
      filesTotal: total,
      bytesDone: virtual ? job.virtualBytes : job.files.reduce((s, f) => s + f.sizeBytes, 0),
      currentFile: "Complete",
      failed,
      finished: true,
    } satisfies RecoveryProgress);
    return;
  }
  const cur = virtual ? null : job.files[job.done];
  const tickNames = [
    "IMG_20260814_184522.jpg", "Q3 Financial Summary.docx", "backup_2026_08.zip",
    "VID_20260704_211903.mp4", "Lease Agreement.pdf", "Outlook.pst",
  ];
  emitMockEvent("recovery-progress", {
    jobId: job.jobId,
    filesDone: job.done,
    filesTotal: total,
    bytesDone: virtual
      ? Math.floor(job.virtualBytes * (job.done / total))
      : job.files.slice(0, job.done).reduce((s, f) => s + f.sizeBytes, 0),
    currentFile: cur?.name ?? tickNames[job.done % tickNames.length],
    failed: job.failed,
    finished: false,
  } satisfies RecoveryProgress);
}

/* ── The command surface ─────────────────────────────────────────────── */

const COMMANDS: Record<string, (args?: Record<string, unknown>) => Promise<unknown>> = {
  /* App */
  get_app_version: async () => __APP_VERSION__ ?? "0.1.0",
  get_dev_hooks: async () => readDevHooks(),
  check_updates: async (): Promise<UpdateCheck> => {
    await wait(600);
    return { current: "0.1.0", latest: "0.1.0", upToDate: true };
  },

  /* Elevation (the launch UAC contract — mocked as granted) */
  is_elevated: async () => true,
  restart_as_admin: async () => {
    await wait(300);
    // Mock never declines; the failure path is exercised by the agent
    // hook below.
    return true;
  },

  /* BitLocker */
  unlock_bitlocker: async (args) => {
    await wait(600);
    const deviceId = String(args?.deviceId ?? "");
    const mode = String(args?.mode ?? "password");
    const secret = String(args?.secret ?? "");
    const dev = DEVICES.find((d) => d.id === deviceId);
    if (!dev || !dev.locked) throw new Error("BITLOCKER_VOLUME_NOT_LOCKED. This volume is not locked.");
    const ok =
      mode === "password"
        ? secret.length >= 4
        : secret.replace(/\D/g, "").length === 48;
    if (!ok) throw new Error("BITLOCKER_UNLOCK_FAILED. Check your password or recovery key.");
    return { unlocked: true, deviceId: dev.id };
  },

  /* Devices */
  enumerate_devices: async (): Promise<DeviceInfo[]> => {
    await wait(900); // splash "Reading the disk information" beat
    return [...DEVICES, ...QUICK_LOCATIONS];
  },
  get_disk_health: async (args) => {
    const diskId = String(args?.diskId ?? "");
    await wait(220);
    const dev = [...DEVICES, ...QUICK_LOCATIONS].find((d) => d.id === diskId);
    return dev ? healthFor(dev) : null;
  },
  get_health_reports: async (): Promise<Array<DiskHealthReport | null>> =>
    DEVICES.map(healthFor),

  /* Scan lifecycle */
  start_scan: async (args) => {
    const deviceId = String(args?.deviceId ?? "");
    const device = [...DEVICES, ...QUICK_LOCATIONS].find((d) => d.id === deviceId);
    if (!device) throw new Error(`SCAN_TARGET_NOT_FOUND. ${String(deviceId)}`);
    if (scanRun) stopScanTimer();
    const profile =
      DEVICE_PROFILES[device.id] ?? { files: 41_209, bytes: 12 * 1024 ** 3, media: false, sectors: 314_135_598 };
    scanRun = {
      scanId: `scan-${Date.now().toString(36)}`,
      device,
      profile,
      phase: device.kind === "sd" && device.fileSystem === "RAW" ? "sdr" : "quick",
      startedAt: Date.now(),
      elapsedBefore: 0,
      percent: 0,
      filesFound: 0,
      bytesFound: 0,
      sector: 0,
      paused: false,
      timer: null,
      tick: 0,
      revealedRecon: 0,
    };
    scanTick = 0;
    startScanTimer();
    scanEvent();
    return { scanId: scanRun.scanId };
  },
  pause_scan: async () => {
    if (!scanRun) throw new Error("SCAN_NOT_RUNNING.");
    if (scanRun.phase === "complete" || scanRun.phase === "stopped") return { ok: true };
    scanRun.paused = true;
    scanRun.elapsedBefore += Date.now() - scanRun.startedAt;
    stopScanTimer();
    scanEvent();
    return { ok: true };
  },
  resume_scan: async () => {
    if (!scanRun) throw new Error("SCAN_NOT_RUNNING.");
    if (!scanRun.paused) return { ok: true };
    scanRun.paused = false;
    scanRun.startedAt = Date.now();
    startScanTimer();
    scanEvent();
    return { ok: true };
  },
  stop_scan: async () => {
    if (!scanRun) return { ok: true };
    stopScanTimer();
    scanRun.phase = "stopped";
    scanEvent();
    return { ok: true };
  },
  get_scan_progress: async (): Promise<ScanProgress | null> =>
    scanRun
      ? {
          phase: scanRun.phase,
          percent: scanRun.percent,
          filesFound: scanRun.filesFound,
          bytesFound: scanRun.bytesFound,
          sector: scanRun.sector,
          sectorsTotal: scanRun.profile.sectors,
          remainingSec: 60,
          elapsedMs: scanRun.elapsedBefore + (scanRun.paused ? 0 : Date.now() - scanRun.startedAt),
          searching: "Stopped",
        }
      : null,

  /* Results */
  get_tree_roots: async () => {
    const media = scanRun?.profile.media ?? false;
    return (media ? MEDIA_ROOTS : ROOTS).map(publicNode);
  },
  get_tree_reveal: async () => {
    // Nodes revealed so far (browse-while-scanning contract).
    const media = scanRun?.profile.media ?? false;
    const visible = QUICK_PHASE_FILES.filter((n) => n.status !== "reconstructed");
    const reconPool = media ? MEDIA_RECON_FILES : RECON_FILES;
    const reconVisible = scanRun ? reconPool.slice(0, scanRun.revealedRecon) : [];
    const rootIds = media
      ? MEDIA_ROOTS.map((r) => r.id)
      : ROOTS.map((r) => r.id);
    return { roots: rootIds, nodes: [...visible, ...reconVisible].map(publicNode) };
  },
  list_children: async (args) => {
    const parentId = (args?.parentId as string | null) ?? null;
    const media = scanRun?.profile.media ?? false;
    return (media ? mediaChildrenOf(parentId) : childrenOf(parentId)).map(publicNode);
  },
  list_type_files: async (args) => {
    const cat = String(args?.category ?? "");
    const { typeBranches } = await import("./filetree");
    const branch = typeBranches().find((b) => b.category === cat);
    return branch ? branch.sample.map(publicNode) : [];
  },
  get_node: async (args) => {
    const n = nodeById(String(args?.nodeId ?? ""));
    if (!n) throw new Error(`NODE_NOT_FOUND. ${String(args?.nodeId ?? "")}`);
    return publicNode(n);
  },

  /* Preview */
  preview_file: async (args): Promise<FilePreview> => {
    await wait(160);
    const n = nodeById(String(args?.fileId ?? ""));
    if (!n) throw new Error(`NODE_NOT_FOUND. ${String(args?.fileId ?? "")}`);
    if (n.isFolder) {
      return { fileId: n.id, previewable: false, placeholder: "generic", capReason: "format" };
    }
    if (n.sizeBytes > 100 * 1024 ** 2 && license.posture === "unlicensed") {
      return { fileId: n.id, previewable: false, placeholder: "generic", capReason: "size" };
    }
    const placeholder: FilePreview["placeholder"] =
      n.category === "photo" ? "image"
      : n.category === "video" ? "video"
      : n.category === "audio" ? "audio"
      : n.category === "archive" ? "archive"
      : n.category === "document" ? "document"
      : "generic";
    return {
      fileId: n.id,
      previewable: placeholder !== "generic",
      placeholder,
      widthPx: 1280,
      heightPx: 720,
      capReason: n.category === "video" && license.posture === "unlicensed" ? "video-trial" : undefined,
    };
  },

  /* Recovery */
  recover_files: async (args) => {
    const ids = (args?.fileIds as string[]) ?? [];
    const all = ids.length === 0;
    const files = all ? [] : ids.map((id) => nodeById(id)).filter((n): n is FileNode => !!n && !n.isFolder);
    if (!all && files.length === 0) throw new Error("NOTHING_TO_RECOVER. Select files to recover first.");
    // The virtual aggregate: "Recover All" = every file the scan found
    // (scaled by the active scan's device profile).
    const virtualCount = scanRun?.filesFound ?? 41_209;
    const virtualBytes = scanRun?.bytesFound ?? 12 * GB;
    const totalBytes = all ? virtualBytes : files.reduce((s, f) => s + f.sizeBytes, 0);

    // License ladder: the 2 GB trial quota, then the hard gate.
    if (license.posture === "unlicensed" && license.trialRecoveredBytes + totalBytes > TRIAL_QUOTA) {
      const recovered = (license.trialRecoveredBytes / GB).toFixed(2);
      const detail =
        license.trialRecoveredBytes > 0
          ? `trial recovery limit reached — ${recovered} GB of the 2 GB allowance recovered`
          : `this selection is ${formatSize(totalBytes)} — larger than the 2 GB free trial allowance`;
      throw new Error(
        `ACTIVATION_REQUIRED. Free trial: ${detail}. Activate DiskWizard Pro for unlimited recovery, or recover a smaller selection first.`,
      );
    }
    if (license.posture === "degraded") {
      throw new Error("LICENSE_STALE. Reconnect to validate your license.");
    }
    if (recoveryJob?.timer) window.clearInterval(recoveryJob.timer);
    recoveryJob = {
      jobId: `job-${Date.now().toString(36)}`,
      files,
      virtualTotal: all ? virtualCount : 0,
      virtualBytes: all ? virtualBytes : 0,
      destPath: String(args?.destination ?? "D:\\Recovered Files"),
      done: 0,
      failed: 0,
      timer: null,
    };
    recoveryJob.timer = window.setInterval(advanceRecovery, 420);
    advanceRecovery();
    return {
      jobId: recoveryJob.jobId,
      filesTotal: all ? virtualCount : files.length,
      destPath: recoveryJob.destPath,
    };
  },
  cancel_recovery: async () => {
    if (recoveryJob?.timer) window.clearInterval(recoveryJob.timer);
    recoveryJob = null;
    return { ok: true };
  },

  /* Destination browsing */
  select_folder: async () => "D:\\Recovered Files",
  list_destinations: async () =>
    DEVICES.filter((d) => ["internal-partition", "usb", "sd"].includes(d.kind)).map((d) => ({
      id: d.id,
      name: d.name,
      capacityBytes: d.capacityBytes,
      freeBytes: Math.max(0, d.capacityBytes - (d.usedBytes ?? 0)),
      isSource: false,
    })),

  /* Sessions (.rsf parity) */
  list_scan_sessions: async (): Promise<ScanSession[]> => [LAST_SESSION],
  import_scan_session: async (args) => {
    await wait(1200);
    return { imported: true, sessionId: String(args?.sessionId ?? ""), filesFound: LAST_SESSION.filesFound };
  },

  /* License */
  license_state: async () => ({ ...license }),
  activate_license: async (args) => {
    await wait(1400);
    const k = String(args?.key ?? "");
    if (k.includes("BADKEY")) throw new Error(LICENSE_API_ERRORS.invalid);
    if (k.includes("EXPRED")) throw new Error(LICENSE_API_ERRORS.expired);
    if (k.includes("DVCMIS")) throw new Error(LICENSE_API_ERRORS.deviceMismatch);
    license = {
      posture: "pro",
      tier: "lifetime",
      ...SIM_USER,
      activatedAt: Date.now(),
      simulated: license.simulated,
      trialRecoveredBytes: license.trialRecoveredBytes,
    };
    emitMockEvent("license-changed", { ...license });
    return { ...license };
  },
  validate_license: async () => {
    await wait(700);
    return { ...license };
  },
  deactivate_license: async () => {
    license = { posture: "unlicensed", tier: "trial", simulated: license.simulated, trialRecoveredBytes: license.trialRecoveredBytes };
    emitMockEvent("license-changed", { ...license });
    return { ...license };
  },

  /** Agent/CI hook — flips the posture for tour screenshots. NEVER
   * registered in production builds (the Rust side compiles a hard
   * refusal; the mock only exists in DEV). */
  license_sim_set: async (args) => {
    const p = args?.posture === "pro" ? "pro" : "unlicensed";
    license = p === "pro"
      ? { posture: "pro", tier: "lifetime", ...SIM_USER, activatedAt: Date.now(), simulated: true, trialRecoveredBytes: 0 }
      : { posture: "unlicensed", tier: "trial", simulated: license.simulated, trialRecoveredBytes: license.trialRecoveredBytes };
    emitMockEvent("license-changed", { ...license });
    return { ...license };
  },

  /** Simulates the UAC decline path (elevation UX verification). */
  simulate_admin_decline: async () => {
    emitMockEvent("admin-restart-failed", { reason: "User declined the UAC prompt." });
    return { ok: true };
  },
};

function formatSize(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/* ── Installation ────────────────────────────────────────────────────── */

declare const __APP_VERSION__: string;

export function installMock(): void {
  setMockBackend(async (cmd, args) => {
    const handler = COMMANDS[cmd];
    if (!handler) throw new Error(`UNKNOWN_COMMAND. ${cmd}`);
    return handler(args);
  });

  // Agent test-driving hooks (Playwright / agent-browser contract).
  (window as unknown as { __dwMock: unknown }).__dwMock = {
    devices: () => DEVICES,
    setLicense: (posture: "pro" | "unlicensed") => void COMMANDS.license_sim_set({ posture }),
    reset: () => {
      stopScanTimer();
      scanRun = null;
      if (recoveryJob?.timer) window.clearInterval(recoveryJob.timer);
      recoveryJob = null;
      license = { posture: "unlicensed", tier: "trial", simulated: false, trialRecoveredBytes: 0 };
    },
    state: () => ({ scanRun: scanRun?.phase ?? "idle", license }),
  };
}
