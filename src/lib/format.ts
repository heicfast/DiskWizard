/**
 * Byte/file formatting — the display grammar of a recovery product:
 * GB with 2 decimals for device capacities, compact counters with
 * thousands separators, and Windows-style dates ("2/3/2026 8:02 PM").
 */

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / Math.pow(1024, i);
  const d = i <= 1 ? (Number.isInteger(v) ? 0 : 1) : decimals;
  return `${v.toFixed(d)} ${units[i]}`;
}

/** "1,139,261" — counters with separators (the Files Found grammar). */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** "1.1M" / "4.4K" — compact tree badges. */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}K`;
  }
  return String(n);
}

/** "07m43s" — the remaining-time grammar from the scan HUD. */
export function formatRemain(seconds: number): string {
  if (seconds <= 0) return "00m00s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
}

/** "00:02:38" — used-time grammar (h:mm:ss). */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** "2/3/2026 8:02 PM" — Windows-style modified dates. */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${h}:${mm} ${ampm}`;
}

/** Percentage clamp for gauges. */
export function clampPct(p: number): number {
  return Math.max(0, Math.min(100, p));
}
