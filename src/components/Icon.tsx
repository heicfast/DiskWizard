/**
 * Icon system — lucide-react re-exports plus a few purpose-drawn
 * pictograms (Windows caption glyphs, drive-type marks) so every icon
 * in the app comes from one audited place.
 */
import { type LucideIcon } from "lucide-react";

export type { LucideIcon };

/* Window-caption glyphs (Windows 11 geometry, purpose-drawn). */
export function WinMinGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
    </svg>
  );
}

export function WinMaxGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function WinRestoreGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <rect x="0.5" y="2.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M2.5 2.5 V0.5 H9.5 V7.5 H7.5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function WinCloseGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <path d="M0.5 0.5 L9.5 9.5 M9.5 0.5 L0.5 9.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/**
 * SD card pictogram (lucide lacks an SdCard glyph in the pinned
 * version) — purpose-drawn with the 24-grid lucide geometry.
 */
export function SdCardGlyph({ size = 17, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6l4-4z" />
      <path d="M10 2v4" />
      <path d="M14 2v4" />
    </svg>
  );
}
