/**
 * Simulated media previews — deterministic, generated "photo" art per
 * file (the UI/UX simulation layer's stand-in for real thumbnails).
 *
 * The visual system: each file id seeds a mulberry32 PRNG that picks a
 * palette family + composition (soft radial washes, horizon bands,
 * bokeh dots) — so every file consistently renders its OWN artwork
 * across the list, preview pane, and lightbox. Camera files read as
 * photos; documents render a page mock; videos a film strip. When the
 * real core lands, the core's thumbnails replace this layer 1:1.
 */
import { mulberry32 } from "../lib/rng";
import type { FileCategory } from "../domain";

const PALETTES: string[][] = [
  ["#f7c5cc", "#ec6d84", "#9c3548"], // blossom dusk
  ["#c9e4de", "#87b7a6", "#3f6e5e"], // forest morning
  ["#ffe3b3", "#f5a623", "#a86414"], // golden hour
  ["#d6e0f7", "#7c96d8", "#38498f"], // coastal fog
  ["#e8d5f0", "#b489d8", "#6a3f9c"], // violet hour
  ["#fde2e4", "#f28482", "#b23a48"], // sunset coral
  ["#dbe7f0", "#a1c2e1", "#5a83a8"], // overcast bay
  ["#f5e3d0", "#d8a48f", "#8f5c4a"], // desert clay
];

export function SimulatedArt({
  fileId,
  category,
  className,
  style,
}: {
  fileId: string;
  category: FileCategory;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (category === "photo") return <PhotoArt fileId={fileId} className={className} style={style} />;
  if (category === "video") return <VideoArt fileId={fileId} className={className} style={style} />;
  if (category === "audio") return <AudioArt fileId={fileId} className={className} style={style} />;
  if (category === "document") return <DocArt className={className} style={style} />;
  if (category === "archive") return <ArchiveArt className={className} style={style} />;
  return <GenericArt className={className} style={style} />;
}

function seedOf(fileId: string): number {
  let h = 2166136261;
  for (let i = 0; i < fileId.length; i++) {
    h ^= fileId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function PhotoArt({ fileId, className, style }: { fileId: string; className?: string; style?: React.CSSProperties }) {
  const rng = mulberry32(seedOf(fileId));
  const pal = PALETTES[Math.floor(rng() * PALETTES.length)];
  const sunX = 18 + rng() * 64;
  const sunY = 16 + rng() * 22;
  const bands = 3 + Math.floor(rng() * 2);
  const bokeh = Array.from({ length: 7 + Math.floor(rng() * 6) }, () => ({
    cx: rng() * 100,
    cy: 55 + rng() * 40,
    r: 2 + rng() * 6,
    o: 0.12 + rng() * 0.22,
  }));
  return (
    <svg className={className} style={style} viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${fileId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal[0]} />
          <stop offset="100%" stopColor={pal[1]} />
        </linearGradient>
        <radialGradient id={`sun-${fileId}`} cx={`${sunX}%`} cy={`${sunY}%`} r="34%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="62" fill={`url(#sky-${fileId})`} />
      <rect width="100" height="62" fill={`url(#sun-${fileId})`} />
      {Array.from({ length: bands }, (_, i) => (
        <rect
          key={i}
          x="0"
          y={34 + i * (26 / bands)}
          width="100"
          height={26 / bands + 1}
          fill={pal[2]}
          opacity={0.25 + i * 0.16}
        />
      ))}
      {bokeh.map((b, i) => (
        <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="#ffffff" opacity={b.o} />
      ))}
    </svg>
  );
}

function VideoArt({ fileId, className, style }: { fileId: string; className?: string; style?: React.CSSProperties }) {
  const rng = mulberry32(seedOf(fileId));
  const pal = PALETTES[Math.floor(rng() * PALETTES.length)];
  return (
    <svg className={className} style={style} viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="62" fill="#1c1b22" />
      <rect x="0" y="0" width="100" height="54" fill={pal[1]} opacity="0.24" />
      <rect x="0" y="54" width="100" height="8" fill="#0f0e13" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={6 + i * 11.6} y="56.5" width="8" height="3" rx="1" fill="#ffffff" opacity="0.28" />
      ))}
      <rect x="38" y="21" width="24" height="18" rx="3" fill="#ffffff" opacity="0.16" />
      <path d="M45 25 L51 30 L45 35 Z" fill="#ffffff" opacity="0.85" />
      <text x="50" y="14" textAnchor="middle" fontSize="6" fill="#ffffff" opacity="0.5" fontFamily="monospace">
        {String(Math.floor(rng() * 59) + 10).padStart(2, "0")}:{String(Math.floor(rng() * 59)).padStart(2, "0")}
      </text>
    </svg>
  );
}

function AudioArt({ fileId, className, style }: { fileId: string; className?: string; style?: React.CSSProperties }) {
  const rng = mulberry32(seedOf(fileId));
  const bars = Array.from({ length: 26 }, () => 8 + rng() * 34);
  return (
    <svg className={className} style={style} viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="62" fill="#241f2a" />
      {bars.map((h, i) => (
        <rect key={i} x={4 + i * 3.6} y={31 - h / 2} width="2.4" height={h} rx="1.2" fill="var(--ink)" opacity={0.35 + (i % 5) * 0.13} />
      ))}
    </svg>
  );
}

function DocArt({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="62" fill="#eef0f4" />
      <rect x="22" y="8" width="56" height="46" rx="2" fill="#ffffff" stroke="#d5d9e2" />
      <rect x="27" y="14" width="30" height="3" rx="1.5" fill="#9aa3b5" />
      <rect x="27" y="21" width="44" height="2" rx="1" fill="#c3cad8" />
      <rect x="27" y="26" width="44" height="2" rx="1" fill="#c3cad8" />
      <rect x="27" y="31" width="38" height="2" rx="1" fill="#c3cad8" />
      <rect x="27" y="36" width="44" height="2" rx="1" fill="#c3cad8" />
      <rect x="27" y="41" width="26" height="2" rx="1" fill="#c3cad8" />
      <rect x="27" y="46" width="20" height="3.4" rx="1.7" fill="var(--ink)" opacity="0.5" />
    </svg>
  );
}

function ArchiveArt({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="62" fill="#f2ecdf" />
      <rect x="30" y="12" width="40" height="38" rx="3" fill="#d9c9a3" stroke="#b89e6d" />
      <rect x="42" y="6" width="16" height="10" rx="2" fill="#c4b088" stroke="#b89e6d" />
      <rect x="44" y="26" width="12" height="8" rx="1.5" fill="#8a7343" />
      <rect x="38" y="40" width="24" height="2" rx="1" fill="#a18a58" />
    </svg>
  );
}

function GenericArt({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="62" fill="#eceef1" />
      <rect x="34" y="16" width="32" height="30" rx="3" fill="#dde1e8" stroke="#c6ccd6" />
      <path d="M41 33 L47 27 L51 31 L57 24" stroke="#aeb6c4" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="45" cy="22" r="2.4" fill="#aeb6c4" />
    </svg>
  );
}
