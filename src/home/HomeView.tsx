import {
  Camera,
  Check,
  FileImage,
  Film,
  FolderOpen,
  HelpCircle,
  HardDrive,
  Lock,
  Monitor,
  RefreshCw,
  RotateCcw,
  Trash,
  Usb,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { SdCardGlyph } from "../components/Icon";
import type { DeviceInfo } from "../domain";
import { Btn } from "../components/buttons";
import { formatBytes } from "../lib/format";
import { LAST_SESSION } from "../mock/inventory";
import { useDevices } from "../state/devices";
import { useScan } from "../state/scan";
import { useView } from "../state/view";
import { toast } from "../state/toast";
import { BitlockerDialog } from "./BitlockerDialog";

/**
 * The landing page — Step 1: "Select a Location to Start".
 *
 * Device groups (Internal drives / External & removable / Lost
 * partitions / Specify a location), per-tile capacity + TRIM chips +
 * health badges, the session-resume banner, and the Scan CTA that
 * carries into the DetailPage.
 */
export function HomeView() {
  const sidebar = useView((s) => s.sidebar);
  if (sidebar === "sd-card") return <SdCardCoach />;
  return <LandingGrid />;
}

/* ── The main landing grid ─────────────────────────────────────────────── */

function LandingGrid() {
  const { devices, selectedId, select, scanning, refresh } = useDevices();
  const health = useDevices((s) => s.health);
  const startScan = useScan((s) => s.start);
  const setStep = useView((s) => s.setStep);
  const go = useView((s) => s.go);

  const [busyRefresh, setBusyRefresh] = useState(false);
  const [bitlockerDevice, setBitlockerDevice] = useState<DeviceInfo | null>(null);

  const groups = useMemo(() => {
    const g: Record<string, DeviceInfo[]> = {
      internal: [],
      external: [],
      lost: [],
      locked: [],
    };
    for (const d of devices) {
      if (d.kind === "internal-partition" || d.kind === "internal-disk") g.internal.push(d);
      else if (d.kind === "usb" || d.kind === "sd") g.external.push(d);
      else if (d.kind === "lost-partition") g.lost.push(d);
      else if (d.kind === "bitlocker-locked") g.locked.push(d);
    }
    return g;
  }, [devices]);

  const selected = devices.find((d) => d.id === selectedId) ?? null;

  async function onRefresh() {
    setBusyRefresh(true);
    await refresh();
    setBusyRefresh(false);
  }

  async function onScan() {
    if (!selected) return;
    if (selected.locked) {
      // BitLocker entry: password / recovery key → unlock → scan.
      setBitlockerDevice(selected);
      return;
    }
    await startScan(selected);
    setStep(2);
    go("detail");
  }

  return (
    <div className="dw-home">
      <StepStrip step={1} />
      <div className="dw-home__scroll">
        <div className="dw-home__inner">
          <div className="dw-home__head">
            <h2 className="dw-home__title">Select a location to start recovering</h2>
            <button className={`dw-home__refresh${busyRefresh ? " is-busy" : ""}`} onClick={() => void onRefresh()}>
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <SessionBanner />

          <DeviceGroup
            title="Internal drives"
            devices={groups.internal}
            selectedId={selectedId}
            onSelect={select}
            health={health}
          />
          <DeviceGroup
            title="External &amp; removable drives"
            devices={[...groups.external, ...groups.locked]}
            selectedId={selectedId}
            onSelect={select}
            health={health}
          />
          <LostGroup devices={groups.lost} selectedId={selectedId} onSelect={select} />

          <QuickLocations selectedId={selectedId} onSelect={select} />

          <div className="dw-home__help">
            <HelpCircle size={14} />
            Unable to find your hard drive? <a onClick={() => toast("info", "Refresh drives, reconnect the device, or check Disk Health for SMART warnings.")}>Refresh drives</a>
          </div>
        </div>
      </div>

      <div className="dw-home__cta">
        <span className="dw-home__cta-hint">
          {selected
            ? selected.locked
              ? `${selected.name} is BitLocker protected — unlock to recover`
              : `Ready to scan ${selected.name}`
            : "Select a location to enable scanning"}
        </span>
        <Btn
          variant="ink"
          className="dw-home__scan"
          disabled={!selected || scanning}
          onClick={() => void onScan()}
          leading={selected?.locked ? <Lock size={16} /> : <RotateCcw size={16} />}
        >
          {selected?.locked ? "Unlock and Recover" : "Search for Lost Data"}
        </Btn>
      </div>

      <BitlockerDialog device={bitlockerDevice} onClose={() => setBitlockerDevice(null)} />
    </div>
  );
}

/* ── Step strip ────────────────────────────────────────────────────────── */

export function StepStrip({ step }: { step: 1 | 2 | 3 }) {
  const steps: Array<{ n: 1 | 2 | 3; label: string }> = [
    { n: 1, label: "Select a Location" },
    { n: 2, label: "Scan" },
    { n: 3, label: "Preview & Recover" },
  ];
  return (
    <div className="dw-steps" aria-label="Recovery progress">
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", height: "100%" }}>
          {i > 0 && <span className="dw-step__arrow">›</span>}
          <div className={`dw-step${step === s.n ? " is-active" : step > s.n ? " is-done" : ""}`}>
            <span className="dw-step__num">{step > s.n ? <Check size={12} strokeWidth={3} /> : s.n}</span>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Session resume banner ─────────────────────────────────────────────── */

function SessionBanner() {
  const go = useView((s) => s.go);
  const setStep = useView((s) => s.setStep);
  return (
    <div className="dw-session">
      <span className="dw-session__icon">
        <RotateCcw size={18} />
      </span>
      <div>
        <div className="dw-session__label">Continue last scanning</div>
        <div className="dw-session__meta">
          Windows (C:) · Scan time 14m 42s · Scan files 481,204 · Scan disk Samsung SSD 970 EVO
        </div>
      </div>
      <Btn
        className="dw-session__load"
        compact
        variant="outline"
        onClick={() => {
          toast("success", `Scan session loaded — ${LAST_SESSION.filesFound.toLocaleString()} files found.`);
          setStep(3);
          go("detail");
        }}
      >
        Load
      </Btn>
    </div>
  );
}

/* ── Device groups + tiles ─────────────────────────────────────────────── */

function DeviceGroup({
  title,
  devices,
  selectedId,
  onSelect,
  health,
}: {
  title: string;
  devices: DeviceInfo[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  health: Record<string, import("../domain").DiskHealthReport | null>;
}) {
  if (devices.length === 0) return null;
  return (
    <section>
      <div className="dw-group__head">
        <h3 className="dw-group__title" dangerouslySetInnerHTML={{ __html: title }} />
        <span className="dw-group__count">({devices.length})</span>
      </div>
      <div className="dw-tiles">
        {devices.map((d) => (
          <DeviceTile key={d.id} device={d} selected={d.id === selectedId} onSelect={() => onSelect(d.id)} health={health[d.id] ?? null} />
        ))}
      </div>
    </section>
  );
}

function LostGroup({
  devices,
  selectedId,
  onSelect,
}: {
  devices: DeviceInfo[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (devices.length === 0) return null;
  return (
    <section>
      <div className="dw-group__head">
        <h3 className="dw-group__title">Lost partitions</h3>
        <span className="dw-group__count">({devices.length})</span>
        <span className="dw-group__hint">Found on disk — recoverable with a deep scan</span>
      </div>
      <div className="dw-tiles">
        {devices.map((d) => (
          <DeviceTile key={d.id} device={d} selected={d.id === selectedId} onSelect={() => onSelect(d.id)} health={null} />
        ))}
      </div>
    </section>
  );
}

export function DeviceTile({
  device,
  selected,
  onSelect,
  health,
}: {
  device: DeviceInfo;
  selected: boolean;
  onSelect: () => void;
  health: import("../domain").DiskHealthReport | null;
}) {
  const usedPct = device.capacityBytes > 0 && device.usedBytes != null
    ? Math.min(100, (device.usedBytes / device.capacityBytes) * 100)
    : 0;
  const nearlyFull = usedPct > 90;
  const icon = tileIcon(device);
  const state = device.health ?? health?.state;

  return (
    <motion.button
      layout
      type="button"
      className={`dw-tile${selected ? " is-selected" : ""}${device.kind === "internal-disk" || device.kind === "bitlocker-locked" ? " dw-tile--wide" : ""}`}
      onClick={onSelect}
      whileTap={{ scale: 0.99 }}
      aria-pressed={selected}
    >
      <span className={`dw-tile__icon${device.locked ? " dw-tile__icon--locked" : device.kind === "lost-partition" ? " dw-tile__icon--lost" : ""}`}>
        {icon}
        {device.locked && <Lock size={11} style={{ position: "absolute", bottom: 4, right: 4 }} />}
      </span>
      <span className="dw-tile__body">
        <span className="dw-tile__name">
          {device.name}
          {state && state !== "good" && (
            <span className={`dw-chip${state === "caution" ? " dw-chip--caution" : " dw-chip--bad"}`}>
              {state === "caution" ? "Caution" : "At risk"}
            </span>
          )}
        </span>
        {device.model && <span className="dw-tile__model">{device.model}</span>}
        {device.capacityBytes > 0 && (
          <>
            <span className="dw-tile__bar">
              <span
                className={`dw-tile__bar-fill${nearlyFull ? " dw-tile__bar-fill--warn" : ""}`}
                style={{ width: `${usedPct.toFixed(1)}%` }}
              />
            </span>
            <span className="dw-tile__stats">
              <span className="dw-tile__fs">{device.fileSystem}</span>
              <span>·</span>
              <span>
                {device.usedBytes != null ? formatBytes(device.usedBytes, 2) : "—"} / {formatBytes(device.capacityBytes, 2)}
              </span>
              {device.trim && (
                <span className={`dw-tile__trim${device.trim === "on" ? " dw-tile__trim--on" : " dw-tile__trim--off"}`}>
                  TRIM {device.trim.toUpperCase()}
                </span>
              )}
            </span>
          </>
        )}
      </span>
      <span className="dw-tile__select">
        <Check size={13} strokeWidth={3} />
      </span>
    </motion.button>
  );
}

function tileIcon(d: DeviceInfo) {
  switch (d.kind) {
    case "usb":
      return <Usb />;
    case "sd":
      return <SdCardGlyph size={26} />;
    case "bitlocker-locked":
      return <Lock />;
    case "lost-partition":
      return <HardDrive />;
    case "internal-disk":
      return <HardDrive />;
    case "internal-partition":
      return d.isSystem ? <Monitor /> : <HardDrive />;
    default:
      return <HardDrive />;
  }
}

/* ── Quick locations ───────────────────────────────────────────────────── */

function QuickLocations({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <section>
      <div className="dw-group__head">
        <h3 className="dw-group__title">Specify a location</h3>
      </div>
      <div className="dw-quick">
        <QuickItem
          icon={<Trash size={19} />}
          label="Recycle Bin"
          sub="Deleted files, 0.42 GB recoverable"
          active={selectedId === "recycle-bin"}
          onClick={() => onSelect("recycle-bin")}
        />
        <QuickItem
          icon={<Monitor size={19} />}
          label="Desktop"
          sub="Files & folders on your Desktop"
          active={selectedId === "desktop"}
          onClick={() => onSelect("desktop")}
        />
        <QuickItem
          icon={<FolderOpen size={19} />}
          label="Select Folder"
          sub="Browse for a specific folder"
          active={false}
          onClick={() => toast("info", "Folder picker opens in the desktop build.")}
        />
      </div>
    </section>
  );
}

function QuickItem({
  icon,
  label,
  sub,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`dw-quick__item${active ? " is-selected" : ""}`} onClick={onClick}>
      <span className="dw-quick__icon">{icon}</span>
      <span>
        <span className="dw-quick__label">{label}</span>
        <div className="dw-quick__sub">{sub}</div>
      </span>
    </button>
  );
}

/* ── SD Card Rescue coaching page ──────────────────────────────────────── */

function SdCardCoach() {
  const { devices, select } = useDevices();
  const go = useView((s) => s.go);
  const startScan = useScan((s) => s.start);
  const setStep = useView((s) => s.setStep);
  const sdDevices = devices.filter((d) => d.kind === "sd");
  const damaged = sdDevices.find((d) => d.fileSystem === "RAW");

  return (
    <div className="dw-home">
      <StepStrip step={1} />
      <div className="dw-home__scroll">
        <div className="dw-coach">
          <div className="dw-coach__icon">
            <SdCardGlyph size={40} strokeWidth={1.6} />
          </div>
          <h2 className="dw-coach__title">Connect Your Memory Card to Recover Lost Photos &amp; Videos</h2>
          <p className="dw-coach__body">
            Insert your SD, microSD, or CF card. If the card is inaccessible, not recognized, or asks
            to be formatted, DiskWizard&apos;s SD Card Rescue will first try to restore access to the
            card — then continue with file recovery.
          </p>
          {damaged && (
            <div className="dw-chip dw-chip--caution" style={{ height: 30, fontSize: 13 }}>
              <Wrench size={14} /> SD Card Rescue needed for {damaged.name}
            </div>
          )}
          <div className="dw-coach__tiles">
            <CoachTile icon={<Wrench size={22} />} label="Fix SD card access" sub="Repair the volume so files become reachable" />
            <CoachTile icon={<FileImage size={22} />} label="Photos that open" sub="Recover JPEG, PNG, and RAW camera formats" />
            <CoachTile icon={<Film size={22} />} label="Videos that play" sub="Recover MP4, MOV, and camera footage" />
          </div>
          {sdDevices.length > 0 ? (
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {sdDevices.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`dw-tile${false ? " is-selected" : ""}`}
                  style={{ flex: 1, padding: "12px 14px" }}
                  onClick={() => {
                    select(d.id);
                    void (async () => {
                      await startScan(d);
                      setStep(2);
                      go("detail");
                    })();
                  }}
                >
                  <span className="dw-tile__icon"><SdCardGlyph size={26} /></span>
                  <span className="dw-tile__body">
                    <span className="dw-tile__name">{d.name}</span>
                    <span className="dw-tile__stats">
                      {d.fileSystem} · {formatBytes(d.capacityBytes, 1)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="dw-chip">No memory card detected — insert a card and refresh</div>
          )}
          <Btn
            variant="ghost"
            leading={<Camera size={15} />}
            onClick={() => toast("info", "Camera import scans photos directly from connected cameras.")}
          >
            Show all external devices
          </Btn>
        </div>
      </div>
    </div>
  );
}

function CoachTile({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="dw-coach__tile">
      {icon}
      <span className="dw-coach__tile-label">{label}</span>
      <span className="dw-coach__tile-sub">{sub}</span>
    </div>
  );
}
