/**
 * The simulated scan corpus — a deterministic, Windows-shaped file tree
 * modeled on the research ground truth (the runner machine's C: with
 * 1.1M found files, File-Path-Lost carved media, and the Reconstructed
 * branch that grows during the advanced carving pass).
 *
 * The generator produces a VISIBLE working set (~2.4k nodes) whose
 * folder aggregates carry the realistic million-scale counters — the
 * UI never needs the full 1.1M rows, exactly like the production
 * engine's virtualized result pipeline.
 */
import type { FileCategory, FileNode, FileStatus, RecoveryGrade } from "../domain";
import { mulberry32, pick, randInt } from "./rng";

const RNG_SEED = 20261017;
const rng = mulberry32(RNG_SEED);

/** Windows-timestamped dates (ms). */
function ts(year: number, month: number, day: number, h = 12, m = 0): number {
  return new Date(Date.UTC(year, month - 1, day, h, m)).getTime();
}

let seq = 0;
function nid(prefix: string): string {
  return `${prefix}-${(seq++).toString(36)}`;
}

const CATEGORIES: FileCategory[] = ["photo", "video", "audio", "document", "archive", "email", "bookmark", "other"];

const GRADES: RecoveryGrade[] = ["high", "high", "high", "medium", "low"];

function gradeFor(rng: () => number, status: FileStatus): RecoveryGrade {
  if (status === "existing") return "high";
  if (status === "reconstructed") return pick(rng, ["medium", "low", "medium"] as const);
  return pick(rng, GRADES);
}

/* ── Realistic name pools ─────────────────────────────────────────────── */

const SYSTEM_DLLS = [
  "ntdll.dll", "kernel32.dll", "kernelbase.dll", "advapi32.dll", "shell32.dll",
  "user32.dll", "gdi32.dll", "comdlg32.dll", "ole32.dll", "oleaut32.dll",
  "ws2_32.dll", "vcruntime140.dll", "msvcp140.dll", "ucrtbase.dll",
  "crypt32.dll", "wintrust.dll", "dwmapi.dll", "uxtheme.dll", "setupapi.dll",
  "Microsoft.Extensions.Configuration.UserSecrets.dll", "System.Text.Json.dll",
  "Newtonsoft.Json.dll", "sqlite3.dll", "libcrypto-1_1.dll", "zlib1.dll",
] as const;

const SYSTEM_FILES = [
  "diagtrack.log", "WindowsUpdate.log", " CBS.log", "dpapi.log", "setupact.log",
  "MFTMirr", "$Bitmap", "$LogFile", "UsnJrnl:J", "PLACEHOLDER.DAT",
  "desktop.ini", "hosts", "services.cfg", "win.ini", "bootstat.dat",
] as const;

const CONFIG_FILES = [
  "settings.json", "config.yaml", "app.cfg", "preferences.toml", ".env",
  "package.json", "tsconfig.json", "vite.config.ts", "Cargo.toml",
  "registry.pol", "default.msi", "install.log", "data.nsf",
] as const;

const DOC_NAMES = [
  "Q3 Financial Summary.docx", "Lease Agreement.pdf", "invoice_2026_03.pdf",
  "invoice_2026_04.pdf", "meeting_notes_20260912.docx", "resume_final_v3.pdf",
  "Project Charter.docx", "Budget 2026.xlsx", "payroll_september.xlsx",
  "tax_return_2025.pdf", "insurance_policy.pdf", "medical_records.pdf",
  "thesis_draft_7.docx", "chapter_3_references.docx", "case_study_v2.docx",
  "product_spec.pdf", "warranty_card.jpg.pdf", "receipts_march.xlsx",
  "Floorplan.pdf", "menu_autumn.docx", "ad_creative_brief.pdf",
  "Passport_Scan.pdf", "mortgage_statement.pdf", "utility_bill_oct.pdf",
] as const;

const PHOTO_NAMES = [
  "IMG_20260814_184522.jpg", "DSC_0812.NEF", "DSC_0813.NEF", "beach_sunset.png",
  "IMG_4401.cr2", "IMG_4402.cr2", "family_photo_2019.jpg", "screenshot_2026-09-01.png",
  "P1080471.psd", "graduation_2024.jpg", "team_offsite.jpg", "logo_variants.svg",
  "avatar_crop.png", "party_photos_004.jpg", "wedding_photo_112.jpg",
  "IMG_0031.heic", "IMG_0032.heic", "panorama_stitch.tif", "poster_draft.png",
  "birthday_cake.jpg", "cat_video_thumbnail.jpg", "moonshot_2026Aug.png",
] as const;

const VIDEO_NAMES = [
  "VID_20260704_211903.mp4", "birthday_2026.mov", "drone_flight_04.mp4",
  "screen_record_2026-08-30.mp4", "GoPro_GX010042.MP4", "interview_segment2.mkv",
  "timelapse_sunset.mp4", "wedding_highlights.mp4", "game_clip_1440p.mp4",
  "IMG_0551.mov", "vacation_rafting.mp4", "lecture_week3_recording.mp4",
] as const;

const AUDIO_NAMES = [
  "voice_memo_2026-08-01.m4a", "podcast_ep_42.mp3", "Voice 003.wav",
  "guitar_idea_12.flac", "demo_vocal_take2.wav", "meditation_guide.mp3",
  "phone_call_recording.amr", "ringtone_remix.m4a", "field_5_ambient.flac",
] as const;

const ARCHIVE_NAMES = [
  "backup_2026_08.zip", "old_projects.7z", "photos_backup.rar", "site_archive.tar.gz",
  "email_export.zip", "source_code_snapshot.zip", "disk_image_mount.vhd",
  "fonts_collection.zip", "emulation_pack.7z", "tax_documents.zip",
] as const;

const EMAIL_NAMES = ["Outlook.pst", "Archive_2025.pst", "gmail_takeout.mbox", "thunderbird_inbox.mbox", "newsletter_saves.eml"] as const;



const PROGRAM_FILES = [
  "Common Files", "dotnet", "Internet Explorer", "Windows Apps",
  "Windows Defender", "Windows NT", "WindowsUpdate", "Microsoft Office",
  "Adobe", "Google", "Mozilla Firefox", "7-Zip", "VideoLAN", "Git",
] as const;

const PROGRAM_FILES_X86 = [
  "Common Files", "Microsoft", "Windows Kits", "Internet Explorer",
  "Windows Media Player", "Windows Defender", "WinRAR", "iTunes",
] as const;

const RUNNER_DIRS = [
  "actionarchivecache", "actions-runner", "azureCli", "cobertura-2.1.1",
  "ghcup", "hostedtoolcache", "image", "inetpub", "Julia", "mingw32",
  "node_modules", "PerfLogs", "Python312", "Ruby31", "selenium", "vcpkg",
] as const;

const TOOLCHAIN_FILES = [
  "ghc-9.6.2.exe", "julia-1.10.4.tar.gz", "mingw-get-setup.exe",
  "python3.12.0t.exe", "rubyinstaller-3.1.4.exe", "setup.ps1",
  "install_toolchain.cmd", "selenium-server-standalone.jar",
] as const;

/** Searching-ticker path fragments (advanced-scan realism). */
export const SEARCH_PATHS = [
  "C:\\Program Files\\dotnet\\shared\\Microsoft.NETCore.App\\6.0.9\\System.Text.Json.dll",
  "C:\\Users\\dev\\AppData\\Local\\Temp\\7zS1A24\\msiexec.tmp",
  "C:\\Windows\\assembly\\NativeImages_v4.0.30319_64\\mscorlib\\a56b6f9b1e6b0c8e.dll",
  "C:\\hostedtoolcache\\windows\\Python\\3.12.0\\x64\\Lib\\site-packages\\pip\\_vendor\\cachecontrol\\controller.py",
  "C:\\actionarchivecache\\com.docker\\dockerDesktopInstaller.exe",
  "C:\\ProgramData\\Package Cache\\{a1b2c3d4-e5f6-7890-abcd-ef1234567890}\\vc_redist.x64.exe",
  "C:\\Users\\dev\\Downloads\\setup_driver_2.8.14.exe",
  "C:\\Windows\\WinSxS\\amd64_microsoft-windows-servicingcore_31bf3856ad364e35\\servicingstack.dll",
  "C:\\vcpkg\\buildtrees\\openssl\\x64-windows-rel\\libssl.dll",
  "C:\\Users\\dev\\Documents\\Freelance\\diskgenie\\contracts\\MSA_signed.pdf",
  "C:\\inetpub\\wwwroot\\default\\web.config",
  "C:\\Users\\dev\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\x9.default\\places.sqlite",
] as const;

/* ── Tree construction ────────────────────────────────────────────────── */

const nodes = new Map<string, FileNode>();

function addNode(n: FileNode): FileNode {
  nodes.set(n.id, n);
  return n;
}

function folder(
  parentId: string | null,
  name: string,
  path: string,
  fileCount: number,
  status: FileStatus = "existing",
  category: FileCategory = "folder",
): FileNode {
  const sizeBytes = fileCount * randInt(rng, 9_000, 220_000);
  return addNode({
    id: nid("f"),
    parentId,
    name,
    path,
    isFolder: true,
    sizeBytes,
    modifiedMs: ts(2026, 9, randInt(rng, 1, 28), randInt(rng, 8, 22), randInt(rng, 0, 59)),
    category,
    status,
    grade: status === "existing" ? "high" : gradeFor(rng, status),
    fileCount,
  });
}

function file(
  parentId: string | null,
  name: string,
  path: string,
  category: FileCategory,
  status: FileStatus = "existing",
  sizeHint?: number,
): FileNode {
  // The display path always ends with this node's own name (name/path
  // coherence contract — the preview pane shows both).
  const base =
    sizeHint ??
    (category === "video"
      ? randInt(rng, 24_000_000, 2_100_000_000)
      : category === "photo"
        ? randInt(rng, 800_000, 42_000_000)
        : category === "audio"
          ? randInt(rng, 400_000, 92_000_000)
          : category === "archive"
            ? randInt(rng, 2_000_000, 480_000_000)
            : randInt(rng, 12_000, 8_400_000));
  const grade = status === "reconstructed" ? gradeFor(rng, status) : gradeFor(rng, status);
  return addNode({
    id: nid("n"),
    parentId,
    name,
    path,
    isFolder: false,
    sizeBytes: base,
    modifiedMs: ts(
      randInt(rng, 2015, 2026),
      randInt(rng, 1, 12),
      randInt(rng, 1, 28),
      randInt(rng, 0, 23),
      randInt(rng, 0, 59),
    ),
    category,
    status,
    grade,
  });
}

function seedFilesFor(parent: FileNode, count: number, pool: readonly string[], category: FileCategory, status: FileStatus = "existing"): void {
  for (let i = 0; i < count; i++) {
    const name = pick(rng, pool);
    file(parent.id, name, `${parent.path}\\${name}`, category, status);
  }
}

/* Root 1 — Windows (C:) with the realistic 1.1M aggregate. */
const ROOT_C = folder(null, "Windows (C:)", "C:\\", 1_139_261);

// System32 family
const sys32 = folder(ROOT_C.id, "System32", "C:\\Windows\\System32", 18_411);
seedFilesFor(sys32, 14, SYSTEM_DLLS, "other");
seedFilesFor(sys32, 6, SYSTEM_FILES, "other");
const drivers = folder(sys32.id, "drivers", "C:\\Windows\\System32\\drivers", 612);
seedFilesFor(drivers, 8, SYSTEM_DLLS, "other");
const driverStore = folder(drivers.id, "DriverStore", "C:\\Windows\\System32\\drivers\\DriverStore", 1_284);
seedFilesFor(driverStore, 4, CONFIG_FILES, "other");

// Windows top-level
const windowsDir = folder(ROOT_C.id, "Windows", "C:\\Windows", 96_204);
folder(windowsDir.id, "Fonts", "C:\\Windows\\Fonts", 412);
const winTemp = folder(windowsDir.id, "Temp", "C:\\Windows\\Temp", 388);
seedFilesFor(winTemp, 6, SYSTEM_FILES, "other");

// Program Files trees
const pf = folder(ROOT_C.id, "Program Files", "C:\\Program Files", 41_882);
for (const dir of PROGRAM_FILES) {
  const d = folder(pf.id, dir, `C:\\Program Files\\${dir}`, randInt(rng, 80, 3_400));
  if (dir === "dotnet" || dir === "Git" || dir === "7-Zip") {
    seedFilesFor(d, 6, SYSTEM_DLLS, "other");
  }
}
const pfx86 = folder(ROOT_C.id, "Program Files (x86)", "C:\\Program Files (x86)", 22_104);
for (const dir of PROGRAM_FILES_X86) {
  folder(pfx86.id, dir, `C:\\Program Files (x86)\\${dir}`, randInt(rng, 40, 1_800));
}
const programData = folder(ROOT_C.id, "ProgramData", "C:\\ProgramData", 88_431);
for (const dir of ["Microsoft", "Package Cache", "chocolatey", "USOShared"]) {
  folder(programData.id, dir, `C:\\ProgramData\\${dir}`, randInt(rng, 120, 4_200));
}

// Users tree — the personal data (highest recoverability interest)
const users = folder(ROOT_C.id, "Users", "C:\\Users", 412_008);
const dev = folder(users.id, "dev", "C:\\Users\\dev", 408_921);
const publicUser = folder(users.id, "Public", "C:\\Users\\Public", 2_411);
const docs = folder(dev.id, "Documents", "C:\\Users\\dev\\Documents", 41_224);
seedFilesFor(docs, 16, DOC_NAMES, "document");
const freelance = folder(docs.id, "Freelance", "C:\\Users\\dev\\Documents\\Freelance", 1_942);
seedFilesFor(freelance, 10, DOC_NAMES, "document");
const downloads = folder(dev.id, "Downloads", "C:\\Users\\dev\\Downloads", 18_441);
seedFilesFor(downloads, 8, ARCHIVE_NAMES, "archive");
seedFilesFor(downloads, 6, TOOLCHAIN_FILES, "other");
const pictures = folder(dev.id, "Pictures", "C:\\Users\\dev\\Pictures", 33_881);
seedFilesFor(pictures, 14, PHOTO_NAMES, "photo");
const cameraImports = folder(pictures.id, "Camera Imports", "C:\\Users\\dev\\Pictures\\Camera Imports", 8_412);
seedFilesFor(cameraImports, 12, PHOTO_NAMES, "photo");
const videosDir = folder(dev.id, "Videos", "C:\\Users\\dev\\Videos", 21_004);
seedFilesFor(videosDir, 10, VIDEO_NAMES, "video");
const music = folder(dev.id, "Music", "C:\\Users\\dev\\Music", 4_812);
seedFilesFor(music, 8, AUDIO_NAMES, "audio");
const desktopDir = folder(dev.id, "Desktop", "C:\\Users\\dev\\Desktop", 388);
seedFilesFor(desktopDir, 6, DOC_NAMES, "document");
const appData = folder(dev.id, "AppData", "C:\\Users\\dev\\AppData", 188_422);
for (const sub of ["Local", "LocalLow", "Roaming"]) {
  const s = folder(appData.id, sub, `C:\\Users\\dev\\AppData\\${sub}`, randInt(rng, 20_000, 88_000));
  for (const vendor of ["Google", "Microsoft", "Mozilla", "npm-cache", "pip", "Docker", "Programs"]) {
    const v = folder(s.id, vendor, `C:\\Users\\dev\\AppData\\${sub}\\${vendor}`, randInt(rng, 200, 6_400));
    if (vendor === "Mozilla" || vendor === "Google") {
      seedFilesFor(v, 4, CONFIG_FILES, "other");
    }
  }
}
seedFilesFor(publicUser, 4, DOC_NAMES, "document");

// Runner/toolchain dirs (ground-truth fidelity)
for (const dir of RUNNER_DIRS) {
  const d = folder(ROOT_C.id, dir, `C:\\${dir}`, randInt(rng, 40, 4_800));
  if (["actionarchivecache", "hostedtoolcache"].includes(dir)) {
    seedFilesFor(d, 6, TOOLCHAIN_FILES, "other");
    seedFilesFor(d, 4, SYSTEM_DLLS, "other");
  }
}

// Recycle Bin branch under C: root (deleted files)
const recycleUnderC = folder(ROOT_C.id, "$RECYCLE.BIN", "C:\\$RECYCLE.BIN", 3_882, "deleted");
seedFilesFor(recycleUnderC, 10, DOC_NAMES, "document", "deleted");
seedFilesFor(recycleUnderC, 8, PHOTO_NAMES, "photo", "deleted");

/* Root 2 — File Path Lost (carved, 4.4K). */
const ROOT_LOST = folder(null, "File Path Lost", "Lost\\", 4_443, "deleted", "folder");
const lostPhotos = folder(ROOT_LOST.id, "JPEG Photos", "Lost\\JPEG Photos", 2_101, "deleted", "photo");
seedFilesFor(lostPhotos, 12, PHOTO_NAMES, "photo", "deleted");
const lostRaws = folder(ROOT_LOST.id, "RAW Camera", "Lost\\RAW Camera", 884, "deleted", "photo");
seedFilesFor(lostRaws, 8, ["DSC_0812.NEF", "IMG_4401.cr2", "_MG_9142.CR2", "P1020488.RW2", "A0001.ARW"] as const, "photo", "deleted");
const lostVideos = folder(ROOT_LOST.id, "Videos", "Lost\\Videos", 621, "deleted", "video");
seedFilesFor(lostVideos, 6, VIDEO_NAMES, "video", "deleted");
const lostArchives = folder(ROOT_LOST.id, "Archives", "Lost\\Archives", 418, "deleted", "archive");
seedFilesFor(lostArchives, 5, ARCHIVE_NAMES, "archive", "deleted");
const lostDocs = folder(ROOT_LOST.id, "Documents", "Lost\\Documents", 419, "deleted", "document");
seedFilesFor(lostDocs, 7, DOC_NAMES, "document", "deleted");

/* Root 3 — Reconstructed (grows during advanced scan). */
const ROOT_RECON = folder(null, "Reconstructed", "Reconstructed\\", 0, "reconstructed", "folder");
const reconDocs = folder(ROOT_RECON.id, "Office Documents", "Reconstructed\\Office Documents", 0, "reconstructed", "document");
const reconMedia = folder(ROOT_RECON.id, "Media", "Reconstructed\\Media", 0, "reconstructed", "video");

/* Reconstructed content — revealed progressively by the scan engine. */
export const RECON_FILES: FileNode[] = [];
{
  const reconPool: Array<[readonly string[], FileCategory]> = [
    [DOC_NAMES, "document"],
    [PHOTO_NAMES, "photo"],
    [VIDEO_NAMES, "video"],
    [ARCHIVE_NAMES, "archive"],
    [EMAIL_NAMES, "email"],
  ];
  const parents = [reconDocs, reconMedia, ROOT_RECON];
  for (let i = 0; i < 96; i++) {
    const [pool, cat] = reconPool[i % reconPool.length];
    const parent = parents[i % parents.length];
    const name = pick(rng, pool);
    RECON_FILES.push(
      file(parent.id, name, `${parent.path}\\${name}`, cat, "reconstructed"),
    );
  }
}

/* ── Exports ──────────────────────────────────────────────────────────── */

export const ROOT_IDS = [ROOT_C.id, ROOT_LOST.id, ROOT_RECON.id];

export const ROOTS: FileNode[] = [ROOT_C, ROOT_LOST, ROOT_RECON];

export const RECON_PARENTS = [reconDocs.id, reconMedia.id, ROOT_RECON.id];

export function allNodes(): FileNode[] {
  return [...nodes.values()];
}

export function nodeById(id: string): FileNode | undefined {
  return nodes.get(id);
}

export function mediaChildrenOf(parentId: string | null): FileNode[] {
  // The full node map backs both corpora (ids are unique across them);
  // folder ids from the media tree resolve their seeded files here.
  const out: FileNode[] = [];
  for (const n of nodes.values()) {
    if (n.parentId === parentId) out.push(n);
  }
  out.sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
  return out;
}

export function childrenOf(parentId: string | null): FileNode[] {
  const out: FileNode[] = [];
  for (const n of nodes.values()) {
    if (n.parentId === parentId) out.push(n);
  }
  out.sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
  return out;
}

/** Type-tree view: category roots with counts + sample children. */
export interface TypeBranch {
  category: FileCategory;
  label: string;
  count: number;
  sample: FileNode[];
}

const TYPE_LABELS: Record<FileCategory, string> = {
  photo: "Graphics",
  video: "Videos",
  audio: "Audio",
  document: "Documents",
  archive: "Archives",
  email: "Emails",
  bookmark: "Bookmarks",
  other: "Others",
  folder: "Folders",
};

export function typeBranches(): TypeBranch[] {
  const out: TypeBranch[] = [];
  for (const cat of CATEGORIES) {
    const sample = allNodes().filter((n) => !n.isFolder && n.category === cat).slice(0, 40);
    const scale: Partial<Record<FileCategory, number>> = {
      photo: 214_882,
      video: 84_112,
      audio: 42_008,
      document: 302_441,
      archive: 59_880,
      email: 25_408,
      bookmark: 12_004,
      other: 398_526,
    };
    out.push({ category: cat, label: TYPE_LABELS[cat], count: scale[cat] ?? sample.length, sample });
  }
  return out;
}

/** A deterministic set of "quick-phase" files — the MFT pass output. */
export const QUICK_PHASE_FILES = allNodes().filter(
  (n) => !n.isFolder && n.status !== "reconstructed",
);

/* ═══ Media-device corpus ═══════════════════════════════════════════
 * SD / USB scans surface a camera-shaped tree (DCIM / PRIVATE / video
 * folders) instead of the Windows corpus — the per-device realism
 * contract.
 */
const MEDIA_ROOT = folder(null, "Card Storage", "\\", 9_412, "deleted", "folder");
const dcim = folder(MEDIA_ROOT.id, "DCIM", "\\DCIM", 6_881, "deleted", "photo");
const canon100 = folder(dcim.id, "100CANON", "\\DCIM\\100CANON", 3_204, "deleted", "photo");
seedFilesFor(canon100, 34, ["IMG_4401.cr2", "IMG_4402.cr2", "IMG_0021.heic", "IMG_20260814_184522.jpg", "beach_sunset.png"], "photo", "deleted");
const sony100 = folder(dcim.id, "100MSDCF", "\\DCIM\\100MSDCF", 1_988, "deleted", "photo");
seedFilesFor(sony100, 22, ["DSC_0812.NEF", "DSC_0813.NEF", "P1080471.psd", "family_photo_2019.jpg"], "photo", "deleted");
const privateAvchd = folder(dcim.id, "PRIVATE", "\\DCIM\\PRIVATE", 1_689, "deleted", "video");
seedFilesFor(privateAvchd, 10, ["00001.MTS", "00002.MTS", "VID_20260704_211903.mp4"], "video", "deleted");
const videoDir = folder(MEDIA_ROOT.id, "VIDEO", "\\VIDEO", 1_402, "deleted", "video");
seedFilesFor(videoDir, 12, ["VID_20260704_211903.mp4", "birthday_2026.mov", "GoPro_GX010042.MP4", "drone_flight_04.mp4"], "video", "deleted");
const misc = folder(MEDIA_ROOT.id, "MISC", "\\MISC", 1_129, "deleted", "other");
seedFilesFor(misc, 8, ["gopro_readme.txt", "GPS_log.gpx", "thumbcache.db"], "other", "deleted");

const MEDIA_LOST = folder(null, "File Path Lost", "Lost\\", 1_204, "deleted", "folder");
const mediaLostPhotos = folder(MEDIA_LOST.id, "Recovered JPEG", "Lost\\Recovered JPEG", 1_091, "deleted", "photo");
seedFilesFor(mediaLostPhotos, 26, ["IMG_0031.heic", "IMG_0032.heic", "party_photos_004.jpg", "wedding_photo_112.jpg", "cat_video_thumbnail.jpg"], "photo", "deleted");
const mediaLostRaw = folder(MEDIA_LOST.id, "RAW Fragments", "Lost\\RAW Fragments", 113, "deleted", "photo");
seedFilesFor(mediaLostRaw, 8, ["_MG_9142.CR2", "P1020488.RW2", "A0001.ARW"], "photo", "deleted");

const MEDIA_RECON = folder(null, "Reconstructed", "Reconstructed\\", 0, "reconstructed", "folder");

export const MEDIA_ROOTS: FileNode[] = [MEDIA_ROOT, MEDIA_LOST, MEDIA_RECON];
export const MEDIA_ROOT_IDS = [MEDIA_ROOT.id, MEDIA_LOST.id, MEDIA_RECON.id];

export const MEDIA_RECON_FILES: FileNode[] = [];
{
  const mediaPool: Array<[readonly string[], FileCategory]> = [
    [PHOTO_NAMES, "photo"],
    [VIDEO_NAMES, "video"],
  ];
  for (let i = 0; i < 48; i++) {
    const [pool, cat] = mediaPool[i % mediaPool.length];
    const name = pick(rng, pool);
    MEDIA_RECON_FILES.push(
      file(MEDIA_RECON.id, name, `Reconstructed\\${name}`, cat, "reconstructed"),
    );
  }
}

/** Per-device scan profile — the realism ladder. */
export const DEVICE_PROFILES: Record<string, { files: number; bytes: number; media: boolean; sectors: number }> = {
  "disk0-part-c": { files: 1_139_261, bytes: 147.04 * 1024 ** 3, media: false, sectors: 314_135_598 },
  "disk0-part-d": { files: 486_221, bytes: 61.2 * 1024 ** 3, media: false, sectors: 314_135_598 },
  disk1: { files: 1_412_884, bytes: 210.4 * 1024 ** 3, media: false, sectors: 3_907_029_184 },
  "usb-sandisk": { files: 96_412, bytes: 22.8 * 1024 ** 3, media: true, sectors: 233_385_984 },
  "sd-kingston": { files: 9_412, bytes: 22.3 * 1024 ** 3, media: true, sectors: 116_282_368 },
  "wd-bitlocker": { files: 210_411, bytes: 88.2 * 1024 ** 3, media: false, sectors: 7_814_875_136 },
  "lost-part-0": { files: 41_209, bytes: 47.8 * 1024 ** 3, media: false, sectors: 264_111_552 },
  "recycle-bin": { files: 3_882, bytes: 0.42 * 1024 ** 3, media: false, sectors: 314_135_598 },
  desktop: { files: 388, bytes: 0.11 * 1024 ** 3, media: false, sectors: 314_135_598 },
};

/** Final aggregate stats for the completion modal (ground-truth values). */
export const FINAL_STATS = {
  filesFound: 1_139_261,
  filesScanned: 1_139_261,
  bytesFound: 147.04 * 1024 ** 3,
  usedTimeMs: 14 * 60 * 1000 + 43 * 1000,
  organized: 1_139_261,
};
