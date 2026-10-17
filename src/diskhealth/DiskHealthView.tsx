import { HeartPulse, HardDrive, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { DeviceInfo, DiskHealthReport } from "../domain";
import { useDevices } from "../state/devices";
import { StepStrip } from "../home/HomeView";

/**
 * Disk Health — the integrated SMART dashboard (always free, like
 * DiskGenie's Monitor mode): disk selector, health verdict ring,
 * temperature/hours facts, the S.M.A.R.T. attribute table, and
 * actionable warnings that pair with recovery decisions.
 */
export function DiskHealthView() {
  const devices = useDevices((s) => s.devices);
  const health = useDevices((s) => s.health);
  const loadAllHealth = useDevices((s) => s.loadAllHealth);
  const refresh = useDevices((s) => s.refresh);

  const [selectedDisk, setSelectedDisk] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    void loadAllHealth();
  }, [refresh, loadAllHealth]);

  const reportable: DeviceInfo[] = devices.filter(
    (d) => ["internal-partition", "internal-disk", "usb", "sd"].includes(d.kind) && !d.locked,
  );

  const activeId = selectedDisk ?? reportable.find((d) => d.health === "caution")?.id ?? reportable[0]?.id ?? null;
  const report: DiskHealthReport | null = activeId ? health[activeId] ?? null : null;
  const state = report?.state ?? "good";

  const stateColor = state === "good" ? "var(--health-good)" : state === "caution" ? "var(--health-caution)" : "var(--health-bad)";
  const healthPct = state === "good" ? 98 : state === "caution" ? 62 : 28;
  const failing = report?.attributes.filter((a) => a.status !== "ok") ?? [];

  return (
    <div className="dw-health dw-settle-in">
      <StepStrip step={1} />
      <div className="dw-health__scroll">
        <div className="dw-health__inner">
          <div className="dw-health__head">
            <div>
              <h2 className="dw-health__title">Disk Health</h2>
              <p className="dw-health__subtitle">
                S.M.A.R.T. monitoring for every disk — identify storage-device risks before they cost you data.
              </p>
            </div>
            <span className="dw-chip dw-chip--good dw-health__free-badge">
              <HeartPulse size={12} />
              Free feature
            </span>
          </div>

          <div className="dw-health__disks">
            {reportable.map((d) => {
              const h = health[d.id];
              const s = h?.state ?? d.health ?? "good";
              const c = s === "good" ? "var(--health-good)" : s === "caution" ? "var(--health-caution)" : "var(--health-bad)";
              return (
                <button
                  key={d.id}
                  className={`dw-diskchip${d.id === activeId ? " is-active" : ""}`}
                  onClick={() => setSelectedDisk(d.id)}
                >
                  <span className="dw-diskchip__state" style={{ background: c }} />
                  <span>
                    <span className="dw-diskchip__name">{d.model ?? d.name}</span>
                    <div className="dw-diskchip__sub">{d.name} · {h ? `${h.temperatureC}°C` : "reading…"}</div>
                  </span>
                </button>
              );
            })}
            {reportable.length === 0 && <div className="dw-chip">Reading disk information…</div>}
          </div>

          {report && (
            <>
              <div className="dw-healthcard">
                <div className="dw-healthcard__state">
                  <div
                    className="dw-healthcard__ring"
                    style={{ ["--pct" as string]: String(healthPct), ["--ring-color" as string]: stateColor }}
                  >
                    <div className="dw-healthcard__ring-inner">
                      <span className="dw-healthcard__ring-value">{healthPct}%</span>
                      <span className="dw-healthcard__ring-label">Health</span>
                    </div>
                  </div>
                  <span
                    className={`dw-chip ${state === "good" ? "dw-chip--good" : state === "caution" ? "dw-chip--caution" : "dw-chip--bad"}`}
                    style={{ height: 26, fontSize: 12.5 }}
                  >
                    <HardDrive size={13} />
                    {state === "good" ? "Good" : state === "caution" ? "Caution!" : "Bad"}
                  </span>
                </div>
                <div>
                  <div className="dw-healthcard__verdict" style={{ color: stateColor, marginBottom: 12 }}>
                    {state === "good"
                      ? `${report.diskName} is healthy`
                      : state === "caution"
                        ? `${report.diskName} may be developing problems`
                        : `${report.diskName} shows signs of failure`}
                  </div>
                  <div className="dw-healthcard__facts">
                    <Fact label="Temperature" value={`${report.temperatureC} °C`} warn={report.temperatureC > 45} />
                    <Fact label="Power On Hours" value={report.powerOnHours.toLocaleString()} />
                    <Fact label="Power Cycles" value={report.powerCycles.toLocaleString()} />
                    <Fact label="Interface" value={report.interface} />
                    <Fact label="Firmware" value={report.firmware} />
                    <Fact label="Serial" value={report.serial} />
                  </div>
                </div>
              </div>

              {failing.length > 0 && (
                <div className="dw-healthnote">
                  <span className="dw-healthnote__icon" style={{ background: "var(--health-caution-soft)", color: "var(--health-caution)" }}>
                    <TriangleAlert size={18} />
                  </span>
                  <div>
                    <div className="dw-healthnote__title">Your disk may have a physical failure</div>
                    <div className="dw-healthnote__body">
                      {failing.length} S.M.A.R.T. attribute{failing.length > 1 ? "s are" : " is"} below the healthy
                      threshold ({failing.map((a) => a.name).join(", ")}). Recover your important data from this disk
                      soon and consider replacing the drive.
                    </div>
                  </div>
                </div>
              )}

              <div className="dw-smart">
                <div className="dw-smart__head">
                  <h3 className="dw-smart__title">S.M.A.R.T. Attributes</h3>
                  <span className="dw-smart__hint">Live values · refreshed with each scan</span>
                </div>
                <div className="dw-smart__scroll">
                  <table className="dw-smart__table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Attribute</th>
                        <th>Current</th>
                        <th>Worst</th>
                        <th>Threshold</th>
                        <th>Raw Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.attributes.map((a) => (
                        <tr key={`${a.id}-${a.name}`}>
                          <td className="mono">{a.id}</td>
                          <td>{a.name}</td>
                          <td>{a.current}</td>
                          <td>{a.worst}</td>
                          <td>{a.threshold}</td>
                          <td className="mono">{a.raw}</td>
                          <td>
                            <span className={`dw-smart__status dw-smart__status--${a.status}`}>
                              {a.status === "ok" ? "OK" : a.status === "caution" ? "Caution" : "Bad"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="dw-fact">
      <div className="dw-fact__label">{label}</div>
      <div className="dw-fact__value" style={warn ? { color: "var(--health-caution)" } : undefined}>{value}</div>
    </div>
  );
}
