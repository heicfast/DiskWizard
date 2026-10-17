import { AnimatePresence, motion } from "framer-motion";
import { Btn } from "../components/buttons";
import { formatCount, formatElapsed } from "../lib/format";
import { useScan } from "../state/scan";

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
        <ModalShell onClose={cancelStop} width={460}>
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

/** Shared modal shell (dim + center + ESC/X handling contract). */
export function ModalShell({
  children,
  onClose,
  width = 480,
  dismissOnOverlay = true,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  width?: number;
  dismissOnOverlay?: boolean;
}) {
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
      <div style={{ maxWidth: width, width: "92%" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </motion.div>
  );
}
