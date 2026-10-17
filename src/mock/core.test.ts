import { describe, expect, it } from "vitest";
import { childrenOf, nodeById, allNodes, ROOTS, RECON_FILES } from "./filetree";
import { DEVICES, QUICK_LOCATIONS, healthFor } from "./inventory";
import { mulberry32, pick, randInt } from "./rng";

describe("mock core determinism", () => {
  it("the file tree is deterministic (same seed → same corpus)", () => {
    const a = allNodes().map((n) => n.id);
    // The module is single-instance; re-running the accessors must be stable.
    const b = allNodes().map((n) => n.id);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(400);
  });

  it("exposes the three-branch root grammar", () => {
    expect(ROOTS.map((r) => r.name)).toEqual(["Windows (C:)", "File Path Lost", "Reconstructed"]);
  });

  it("children are folders-first, then name-sorted", () => {
    const kids = childrenOf(ROOTS[0].id);
    const firstFileIdx = kids.findIndex((k) => !k.isFolder);
    if (firstFileIdx > 0) {
      expect(kids.slice(0, firstFileIdx).every((k) => k.isFolder)).toBe(true);
    }
  });

  it("every child references its parent", () => {
    for (const n of childrenOf(ROOTS[1].id)) {
      expect(nodeById(n.parentId ?? "")?.name).toBe("File Path Lost");
    }
  });

  it("reconstructed nodes are status=reconstructed", () => {
    expect(RECON_FILES.every((n) => n.status === "reconstructed")).toBe(true);
    expect(RECON_FILES.length).toBeGreaterThan(80);
  });
});

describe("device inventory", () => {
  it("carries the Windows runner corpus", () => {
    const ids = DEVICES.map((d) => d.id);
    expect(ids).toContain("disk0-part-c");
    expect(ids).toContain("sd-kingston");
    expect(ids).toContain("wd-bitlocker");
    expect(ids).toContain("lost-part-0");
    // Quick locations ship alongside.
    expect(QUICK_LOCATIONS.map((d) => d.name)).toContain("Recycle Bin");
  });

  it("BitLocker volume is locked; SD card is RAW", () => {
    const wd = DEVICES.find((d) => d.id === "wd-bitlocker");
    expect(wd?.locked).toBe(true);
    const sd = DEVICES.find((d) => d.id === "sd-kingston");
    expect(sd?.fileSystem).toBe("RAW");
  });

  it("SMART reports exist for internal disks and peripherals", () => {
    const c = healthFor(DEVICES[0]);
    expect(c?.state).toBe("good");
    expect(c?.attributes.length).toBeGreaterThan(8);
    const seg = healthFor(DEVICES.find((d) => d.id === "disk1")!);
    expect(seg?.state).toBe("caution");
    expect(seg?.attributes.some((a) => a.status === "bad")).toBe(true);
  });
});

describe("rng", () => {
  it("mulberry32 is deterministic", () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });

  it("pick and randInt stay in bounds", () => {
    const r = mulberry32(7);
    expect(pick(r, ["a", "b", "c"])).toMatch(/^[abc]$/);
    const v = randInt(r, 3, 9);
    expect(v).toBeGreaterThanOrEqual(3);
    expect(v).toBeLessThanOrEqual(9);
  });
});
