import { describe, expect, it } from "vitest";
import { formatKey, isComplete, normalizeKey, usesValidAlphabet } from "./licenseKey";

describe("licenseKey", () => {
  it("normalizes case + separators", () => {
    expect(normalizeKey("dw-8g7h6-k5m4n-3p2q1-r0s9t")).toBe("DW8G7H6K5M4N3P2Q1R0S9T");
    expect(normalizeKey("  dw8g7h 6k5m4n 3p2q1 r0s9t ")).toBe("DW8G7H6K5M4N3P2Q1R0S9T");
    expect(normalizeKey("")).toBe("");
  });

  it("formats as the user types (DW- + groups of 5)", () => {
    expect(formatKey("dw")).toBe("DW-");
    expect(formatKey("dw8g7h6")).toBe("DW-8G7H6");
    expect(formatKey("DW-8G7H6-K5M4N-3P2Q1-R0S9T")).toBe("DW-8G7H6-K5M4N-3P2Q1-R0S9T");
    expect(formatKey("dw8g7h6k5m4n3p2q1r0s9t")).toBe("DW-8G7H6-K5M4N-3P2Q1-R0S9T");
  });

  it("isComplete only at exactly 22 normalized chars with the DW prefix", () => {
    expect(isComplete("DW-8G7H6-K5M4N-3P2Q1-R0S9")).toBe(false);
    expect(isComplete("DW-8G7H6-K5M4N-3P2Q1-R0S9T")).toBe(true);
    expect(isComplete("XX-8G7H6-K5M4N-3P2Q1-R0S9T")).toBe(false);
    expect(isComplete("")).toBe(false);
  });

  it("rejects non-Crockford alphabet (I, L, O, U)", () => {
    expect(usesValidAlphabet("DW-ILILO-OOOOO-UUUUU-AAAAA")).toBe(false);
    expect(usesValidAlphabet("DW-8G7H6-K5M4N-3P2Q1-R0S9T")).toBe(true);
  });
});
