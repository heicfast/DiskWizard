/**
 * Gauge — the circular scan progress dial (the RadiusProgressBar
 * counterpart): 56px ring with the live percentage and phase label.
 */
export function Gauge({
  percent,
  paused = false,
  done = false,
  size = 56,
}: {
  percent: number;
  paused?: boolean;
  done?: boolean;
  size?: number;
}) {
  const r = (size - 6) / 2 - 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div
      className={`dw-gauge${paused ? " dw-gauge--paused" : ""}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size}>
        <circle className="dw-gauge__track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="dw-gauge__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeDasharray={c}
          strokeDashoffset={off}
          style={done ? { stroke: "var(--success)" } : undefined}
        />
      </svg>
      <span className="dw-gauge__label">
        {done ? "✓" : `${Math.round(percent)}%`}
        {!done && <small>{paused ? "PAUSED" : "SCAN"}</small>}
      </span>
    </div>
  );
}
