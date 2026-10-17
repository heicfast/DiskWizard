import { describe, expect, it } from "vitest";
import { formatBytes, formatCompact, formatCount, formatDate, formatElapsed, formatRemain } from "./format";

describe("format helpers", () => {
  it("formatBytes uses the DRW display grammar", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1_139_261 * 140_000)).toMatch(/GB/);
    expect(formatBytes(149.45 * 1024 ** 3, 2)).toBe("149.45 GB");
  });

  it("formatCount groups thousands", () => {
    expect(formatCount(1139261)).toBe("1,139,261");
    expect(formatCount(0)).toBe("0");
  });

  it("formatCompact renders tree badges", () => {
    expect(formatCompact(1_139_261)).toBe("1.1M");
    expect(formatCompact(4_443)).toBe("4.4K");
    expect(formatCompact(87)).toBe("87");
  });

  it("formatRemain renders the scan HUD grammar", () => {
    expect(formatRemain(463)).toBe("07m43s");
    expect(formatRemain(0)).toBe("00m00s");
  });

  it("formatElapsed renders h:mm:ss", () => {
    expect(formatElapsed(883_000)).toBe("00:14:43");
  });

  it("formatDate renders Windows-style dates", () => {
    const d = new Date(2026, 1, 3, 20, 2);
    expect(formatDate(d.getTime())).toMatch(/2\/3\/2026 8:02 PM/);
  });
});
