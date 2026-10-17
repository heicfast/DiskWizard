import { FileCog, HeartPulse, HardDrive, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { SdCardGlyph } from "../components/Icon";
import { useLicense } from "../state/license";
import { useDevices } from "../state/devices";
import { useView, type SidebarSection } from "../state/view";

/**
 * The app sidebar — Data Recovery (Hardware Disk / SD Card / Lost
 * Partition Rescue) and Tools (Disk Health / File Repair) with the
 * elevation status footer. Highlight follows the active page.
 */
export function Sidebar() {
  const sidebar = useView((s) => s.sidebar);
  const go = useView((s) => s.go);
  const devices = useDevices((s) => s.devices);
  const elevated = useDevices((s) => s.elevated);
  const license = useLicense((s) => s.state);
  const pro = license?.posture === "pro" || license?.posture === "grace";

  // Only disks the Disk Health surface actually reports (internal,
  // external, SD) count toward the risk notice.
  const riskyCount = devices.filter(
    (d) => d.health && d.health !== "good" && ["internal-partition", "internal-disk", "usb", "sd"].includes(d.kind),
  ).length;

  const groups: Array<{
    label: string;
    items: Array<{ id: SidebarSection; icon: React.ReactNode; label: string; badge?: React.ReactNode; page: Parameters<typeof go>[0] }>;
  }> = [
    {
      label: "Data Recovery",
      items: [
        { id: "hardware", icon: <HardDrive size={17} />, label: "Hardware Disk", page: "home" },
        { id: "sd-card", icon: <SdCardGlyph size={17} />, label: "SD Card", page: "sd-card" },
      ],
    },
    {
      label: "Tools",
      items: [
        {
          id: "disk-health",
          icon: <HeartPulse size={17} />,
          label: "Disk Health",
          badge: <span className="dw-chip dw-chip--good" style={{ height: 16, fontSize: 9, padding: "0 6px", marginLeft: "auto" }}>FREE</span>,
          page: "disk-health",
        },
        {
          id: "file-repair",
          icon: <FileCog size={17} />,
          label: "File Repair",
          badge: <span className="dw-chip" style={{ height: 16, fontSize: 9, padding: "0 6px", marginLeft: "auto" }}>NEXT</span>,
          page: "file-repair",
        },
      ],
    },
  ];

  return (
    <nav className="dw-sidebar" aria-label="Main navigation">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="dw-sidebar__group">
            <span className="dw-label">{g.label}</span>
          </div>
          {g.items.map((item) => (
            <button
              key={item.id}
              className={`dw-sidebar__item${sidebar === item.id ? " is-active" : ""}`}
              onClick={() => go(item.page, item.id)}
              aria-current={sidebar === item.id ? "page" : undefined}
            >
              <span className="dw-sidebar__icon">{item.icon}</span>
              {item.label}
              {item.badge}
            </button>
          ))}
        </div>
      ))}

      {riskyCount > 0 && (
        <button className="dw-sidebar__item" onClick={() => go("disk-health", "disk-health")} style={{ marginTop: 6 }}>
          <span className="dw-sidebar__icon" style={{ color: "var(--health-caution)" }}>
            <TriangleAlert size={17} />
          </span>
          {riskyCount} disk{riskyCount > 1 ? "s" : ""} at risk
        </button>
      )}

      <div className="dw-sidebar__footer">
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-tertiary)" }}>
          <ShieldCheck size={13} style={{ color: elevated ? "var(--success)" : "var(--warn)" }} />
          {elevated ? "Administrator access" : "Standard access"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-tertiary)" }}>
          <RotateCcw size={13} style={{ color: pro ? "var(--free)" : "var(--text-tertiary)" }} />
          {pro ? "Pro — unlimited recovery" : "Free trial — 2 GB recovery"}
        </div>
      </div>
    </nav>
  );
}
