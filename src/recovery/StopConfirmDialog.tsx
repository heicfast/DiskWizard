import { AnimatePresence, motion } from "framer-motion";
import { Btn } from "../components/buttons";
import { formatCount, formatElapsed } from "../lib/format";
import { useScan } from "../state/scan";
import { useEffect, useRef } from "react";

/**
 * Stop confirm (CScanCommonPopDlg parity): "Stop Searching for Lost
 * Data?" with the files-found + used-time stats and the risk framing.
 */
export function StopConfirmDialog() {
  const show = useScan((s) => s.showStopConfirm);
  const progress = useScan((s) => s.progress);
  const { confirmStop, cancelStop } = useScan.getState();

  return (
    <AnimatePresence>
      {show && (
        <ModalShell onClose={cancelStop} width={460} label="Stop searching for lost data">
          <motion.div className="dw-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.18 }}>
            <h3 className="dw-modal__title">Stop Searching for Lost Data?</h3>
            <div className="dw-modal__stats">
              <Stat label="Files Found" value={formatCount(progress?.filesFound ?? 0)} />
              <Stat label="Used Time" value={formatElapsed(progress?.elapsedMs ?? 0)} />
            </div>
            <p className="dw-modal__body">
              Remaining data can be rescanned and recovered anytime later, but continuing now saves
              you time. Stopped scans keep every file found so far.
            </p>
            <div className="dw-modal__actions">
              <Btn variant="danger-ink" onClick={() => void confirmStop()}>
                Stop
              </Btn>
              <Btn variant="ink" onClick={cancelStop}>
                Continue
              </Btn>
            </div>
          </motion.div>
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="dw-modal__stat">
      <span className="dw-modal__stat-value">{value}</span>
      <span className="dw-modal__stat-label">{label}</span>
    </div>
  );
}

/**
 * Shared modal shell — dim + center + the full dialog contract:
 * ESC-to-close, role="dialog"/aria-modal, focus trap, focus
 * restoration. One implementation behind every overlay.
 */
export function ModalShell({
  children,
  onClose,
  width = 480,
  dismissOnOverlay = true,
  label,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  width?: number;
  dismissOnOverlay?: boolean;
  /** The dialog's accessible name. */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // ESC to close + focus trap + focus restore.
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    const node = ref.current;
    // Move focus into the dialog.
    const focusables = node?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (focusables?.[0] ?? node)?.focus();

    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape" && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && node) {
        const items = [
          ...node.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ].filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      restoreRef.current?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      className="dw-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={dismissOnOverlay ? onClose : undefined}
      style={{ zIndex: 120 }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={{ maxWidth: width, width: "92%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </motion.div>
  );
}
