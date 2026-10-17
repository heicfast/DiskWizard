import { CheckCircle2, Pause, Play, Square } from "lucide-react";
import { useMemo } from "react";
import { Gauge } from "../components/Gauge";
import { Btn } from "../components/buttons";
import { formatBytes, formatCount, formatElapsed, formatRemain } from "../lib/format";
import { useRecovery } from "../state/recovery";
import { useResults } from "../state/results";
import { useScan } from "../state/scan";

/**
 * The scan HUD — the live "Searching:" ticker strip plus the bottom
 * control bar (circular gauge, phase status, pause/stop, Recover All
 * CTA). Transitions into the completed status bar (checkmark + stats).
 */
export function ScanHud() {
  const progress = useScan((s) => s.progress);
  const paused = useScan((s) => s.paused);
  const stats = useScan((s) => s.stats);
  const { pause, resume, askStop } = useScan.getState();
  const selectionCount = useResults((s) => s.selection.size);
  const selection = useResults((s) => s.selection);
  const listNodes = useResults((s) => s.list.nodes);
  const openDialog = useRecovery((s) => s.openDialog);

  const phase = progress?.phase ?? "idle";
  const complete = phase === "complete";
  const stopped = phase === "stopped";
  const active = !complete && !stopped && phase !== "idle";

  const selectedBytes = useMemo(
    () => useResults.getState().selectedBytes(),
    [selection, listNodes],
  );
  const recoverableCount = stats?.filesFound ?? progress?.filesFound ?? 0;
  const recoverableBytes = stats?.bytesFound ?? progress?.bytesFound ?? 0;

  function onRecover() {
    const ids = [...useResults.getState().selection];
    const useSelected = ids.length > 0;
    // Empty ids = "Recover All" — the core treats it as the full scan
    // result set (virtual aggregate recovery).
    (window as unknown as { __dwRecoverIds?: string[] }).__dwRecoverIds = useSelected ? ids : [];
    const count = useSelected ? ids.length : recoverableCount;
    const bytes = useSelected ? selectedBytes : recoverableBytes;
    void openDialog(count, bytes);
  }

  return (
    <>
      <SearchingStrip phase={phase} paused={paused} searching={progress?.searching ?? ""} />
      <div className="dw-bottombar">
        <div className="dw-bottombar__gauge">
          <Gauge
            percent={complete ? 100 : (progress?.percent ?? 0)}
            paused={paused}
            done={complete}
          />
        </div>

        <div className="dw-bottombar__status">
          <div className={`dw-bottombar__line1${complete ? " is-complete" : ""}`}>
            {complete ? (
              <>
                <CheckCircle2 size={16} />
                Scan Completed, Files Found: {formatCount(stats?.filesFound ?? 0)} ({formatBytes(stats?.bytesFound ?? 0, 2)})
              </>
            ) : stopped ? (
              "Scan stopped — results kept"
            ) : paused ? (
              "Scan Paused"
            ) : (
              <>
                {phase === "advanced" ? "Advanced Scanning" : phase === "organizing" ? "Organizing found files" : "Quick Scanning"}
                , Files Found: {formatCount(progress?.filesFound ?? 0)} ({formatBytes(progress?.bytesFound ?? 0, 2)})
              </>
            )}
          </div>
          <div className="dw-bottombar__line2">
            {active && (
              <>
                <span className="dw-ctl">
                  <span className="dw-searching__scananim" />
                  Used {formatElapsed(progress?.elapsedMs ?? 0)}
                </span>
                <span className="dw-ctl">Remaining time: {formatRemain(progress?.remainingSec ?? 0)}</span>
                {phase === "advanced" && (
                  <span className="dw-ctl">
                    Reading sector: {formatCount(progress?.sector ?? 0)}/{formatCount(progress?.sectorsTotal ?? 0)}
                  </span>
                )}
              </>
            )}
            {active && (
              <>
                <button onClick={() => void (paused ? resume() : pause())} className={paused ? "is-paused" : ""}>
                  {paused ? <Play size={12} /> : <Pause size={12} />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button onClick={askStop}>
                  <Square size={11} />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        <div className="dw-bottombar__spacer" />

        <div className="dw-bottombar__count">
          {selectionCount > 0 ? (
            <>
              Selected: {formatCount(selectionCount)} files ({formatBytes(selectedBytes, 2)})
            </>
          ) : (
            <>
              {formatCount(recoverableCount)} files ({formatBytes(recoverableBytes, 2)}) found
            </>
          )}
        </div>

        <Btn variant="ink" className="dw-bottombar__recover" onClick={onRecover}>
          {selectionCount > 0 ? `Recover ${formatCount(selectionCount)} ...` : "Recover All ..."}
        </Btn>
      </div>
    </>
  );
}

function SearchingStrip({
  phase,
  paused,
  searching,
}: {
  phase: string;
  paused: boolean;
  searching: string;
}) {
  const complete = phase === "complete";
  const stopped = phase === "stopped";
  const cls = paused
    ? " dw-searching--paused"
    : complete
      ? " dw-searching--complete"
      : "";
  return (
    <div className={`dw-searching${cls}`}>
      <span className="dw-searching__label">
        {complete ? (
          "Scan completed"
        ) : stopped ? (
          "Stopped"
        ) : paused ? (
          "Scanning Paused."
        ) : (
          <>
            <span className="dw-searching__scananim" />
            Searching:
          </>
        )}
      </span>
      {!complete && !stopped && <span className="dw-searching__path">{searching}</span>}
    </div>
  );
}
