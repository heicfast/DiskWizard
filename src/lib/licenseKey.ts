/**
 * License key formatting/parsing (pure, no I/O) — DiskGenie's key
 * contract adapted to the DiskWizard prefix:
 *
 *   DW-XXXXX-XXXXX-XXXXX-XXXXX     (Crockford base32, 20 random chars
 *                                   = 100 bits of entropy)
 *
 * normalize(): uppercase + strip every non-alphanumeric.
 * formatKey(): groups of 5 with DW- prefix as the user types.
 * isComplete(): exactly 22 chars (DW + 20) — the Activate button's
 * enable condition.
 */

export const KEY_PREFIX = "DW";
export const KEY_BODY_CHARS = 20;
export const KEY_TOTAL_CHARS = KEY_PREFIX.length + KEY_BODY_CHARS;

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function normalizeKey(raw: string): string {
  return (raw || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function formatKey(raw: string): string {
  const n = normalizeKey(raw);
  if (!n) return "";
  const body = n.startsWith(KEY_PREFIX) ? n.slice(KEY_PREFIX.length) : n;
  const groups: string[] = [];
  for (let i = 0; i < body.length && groups.length < 4; i += 5) {
    groups.push(body.slice(i, i + 5));
  }
  return `${KEY_PREFIX}-${groups.join("-")}`;
}

export function isComplete(raw: string): boolean {
  const n = normalizeKey(raw);
  if (!n.startsWith(KEY_PREFIX)) return false;
  return n.length === KEY_TOTAL_CHARS;
}

/** True when every char is in the Crockford alphabet (excludes I, L,
 * O, U) — feeds the "invalid characters" hint. */
export function usesValidAlphabet(raw: string): boolean {
  const n = normalizeKey(raw);
  return n.split("").every((c) => CROCKFORD.includes(c));
}
