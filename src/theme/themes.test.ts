import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  THEME_IDS,
  THEMES,
  THEME_LIST,
  familyOf,
  nativeThemeFor,
  validateThemeId,
} from "./themes";

describe("theme registry", () => {
  it("exposes exactly the five DiskGenie-parity themes", () => {
    expect(THEME_IDS).toEqual(["blossom", "light", "dark", "ember", "tide"]);
  });

  it("blossom is the default (the shipped DiskWizard look)", () => {
    expect(validateThemeId(null)).toBe("blossom");
    expect(validateThemeId("garbage")).toBe("blossom");
    expect(validateThemeId("dark")).toBe("dark");
  });

  it("families: blossom+light are light; dark/ember/tide are dark", () => {
    expect(familyOf("blossom")).toBe("light");
    expect(familyOf("light")).toBe("light");
    expect(familyOf("dark")).toBe("dark");
    expect(familyOf("ember")).toBe("dark");
    expect(familyOf("tide")).toBe("dark");
  });

  it("native theme mapping follows the family", () => {
    for (const id of THEME_IDS) {
      expect(nativeThemeFor(id)).toBe(THEMES[id].family);
    }
  });

  it("THEME_LIST covers every id exactly once", () => {
    expect(THEME_LIST.map((t) => t.id)).toEqual([...THEME_IDS]);
  });

  it("index.html pre-mount script stays in sync with the registry", () => {
    const html = readFileSync(`${import.meta.dirname}/../../index.html`, "utf8");
    const ids = html.match(/\["blossom",\s*"light",\s*"dark",\s*"ember",\s*"tide"\]/);
    expect(ids).not.toBeNull();
    // The default fallback must be blossom.
    expect(html).toContain(': "blossom"');
    // The html background paints blossom pre-CSS (the default).
    expect(html).toMatch(/html\s*\{[^}]*background:\s*#fbf1ee/s);
  });

  it("tokens.css defines a palette block per theme + the dark-family layer", () => {
    const css = readFileSync(`${import.meta.dirname}/tokens.css`, "utf8");
    for (const id of THEME_IDS) {
      expect(css).toContain(`[data-theme="${id}"]`);
    }
    expect(css).toContain('[data-scheme="dark"]');
    // The blossom ink gradient (the cherry-blossom accent).
    expect(css).toContain("--ink: #d8506b");
  });
});
