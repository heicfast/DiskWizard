import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FolderOpen, Loader2 } from "lucide-react";
import { Btn } from "../components/buttons";
import { formatBytes, formatCount } from "../lib/format";
import { toast } from "../state/toast";
import { useRecovery } from "../state/recovery";
import { ModalShell } from "./StopConfirmDialog";

/**
 * Recovery progress + completion — per-file progress with the current
 * file name, the aggregate bar, and the result summary (files / failed
 * + the open-folder handoff).
 */
export function RecoveryProgressDialog() {
  const show = useRecovery((s) => s.showProgress);
  const progress = useRecovery((s) => s.progress);
  const showComplete = useRecovery((s) => s.showComplete);
  const summary = useRecovery((s) => s.destSummary);
  const { dismissComplete, cancel } = useRecovery.getState();

  const total = progress?.filesTotal ?? 1;
  const done = progress?.filesDone ?? 0;
  const pct = Math.round((done / Math.max(1, total)) * 100);

  return (
    <>
      <AnimatePresence>
        {show && progress && !progress.finished && (
          <ModalShell width={480} dismissOnOverlay={false}>
            <motion.div className="dw-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.18 }}>
              <h3 className="dw-modal__title">Recovering your files</h3>
              <div className="dw-recoverbar">
                <div className="dw-recoverbar__fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="dw-recoverbar__meta">
                <span>
                  {formatCount(done)} / {formatCount(total)} files · {formatBytes(progress.bytesDone, 2)}
                </span>
                <span className="dw-recoverbar__pct">{pct}%</span>
              </div>
              <div className="dw-recoverbar__file mono" title={progress.currentFile}>
                <Loader2 size={13} style={{ animation: "dw-spin 0.9s linear infinite" }} />
                {progress.currentFile}
              </div>
              <div className="dw-modal__actions dw-modal__actions--center">
                <Btn variant="ghost" onClick={() => {
                  cancel();
                  toast("info", "Recovery cancelled — your selection is kept.");
                }}>
                  Cancel
                </Btn>
              </div>
            </motion.div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComplete && summary && (
          <ModalShell onClose={dismissComplete} width={480}>
            <motion.div
              className="dw-modal dw-modal--celebrate"
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
            >
              <div className="dw-modal__hero">
                <motion.div
                  className="dw-modal__hero-icon dw-modal__hero-icon--success"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 320, damping: 18 }}
                >
                  <CheckCircle2 size={42} strokeWidth={1.6} />
                </motion.div>
              </div>
              <h3 className="dw-modal__title dw-modal__title--center">Recovery Successful</h3>
              <p className="dw-modal__body dw-modal__body--center">
                {formatCount(summary.files)} files recovered
                {summary.failed > 0 ? ` · ${formatCount(summary.failed)} failed (see the recovery log)` : ""}.
              </p>
              <div className="dw-modal__actions dw-modal__actions--center">
                <Btn variant="ink" leading={<FolderOpen size={15} />} onClick={() => {
                  dismissComplete();
                  toast("success", "Recovered files opened in File Explorer.");
                }}>
                  Open Recovery Folder
                </Btn>
                <Btn variant="ghost" onClick={dismissComplete}>
                  Done
                </Btn>
              </div>
              <p className="dw-modal__footnote dw-modal__footnote--center">
                Saved to {summary.dest}
              </p>
            </motion.div>
          </ModalShell>
        )}
      </AnimatePresence>
    </>
  );
}
