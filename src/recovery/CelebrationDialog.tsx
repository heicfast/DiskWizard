import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, ShieldCheck } from "lucide-react";
import { Btn } from "../components/buttons";
import { formatBytes, formatCount, formatElapsed } from "../lib/format";
import { useRecovery } from "../state/recovery";
import { useResults } from "../state/results";
import { useScan } from "../state/scan";
import { useView } from "../state/view";
import { ModalShell, Stat } from "./StopConfirmDialog";

/**
 * The scan-complete celebration (the 540×380 modal parity): confetti
 * hero, "Congratulations! Scan Completed!", the stats grid, the
 * highly-recoverable banner, and the Go to Recover CTA.
 */
export function CelebrationDialog() {
  const show = useScan((s) => s.showCelebration);
  const stats = useScan((s) => s.stats);
  const dismiss = useScan((s) => s.dismissCelebration);
  const go = useView((s) => s.go);
  const setStep = useView((s) => s.setStep);

  function onGoRecover() {
    dismiss();
    setStep(3);
    go("detail");
    // Surface the results funnel: preselect nothing, Recover All path.
    useResults.getState().clearSelection();
  }

  return (
    <AnimatePresence>
      {show && (
        <ModalShell onClose={dismiss} width={560} dismissOnOverlay={false}>
          <motion.div
            className="dw-modal dw-modal--celebrate"
            initial={{ scale: 0.92, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <div className="dw-modal__hero">
              <motion.div
                initial={{ rotate: -14, scale: 0.7, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 300, damping: 16 }}
                className="dw-modal__hero-icon"
              >
                <ShieldCheck size={44} strokeWidth={1.6} />
              </motion.div>
              <motion.div
                className="dw-modal__confetti"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <PartyPopper size={20} />
              </motion.div>
            </div>

            <h3 className="dw-modal__title dw-modal__title--center">Congratulations! Scan Completed!</h3>

            <div className="dw-modal__stats dw-modal__stats--grid4">
              <Stat label="Files found" value={formatCount(stats?.filesFound ?? 0)} />
              <Stat label="Size" value={formatBytes(stats?.bytesFound ?? 0, 2)} />
              <Stat label="Used Time" value={formatElapsed(stats?.usedTimeMs ?? 0)} />
              <Stat label="Organized" value={formatCount(stats?.filesFound ?? 0)} />
            </div>

            <div className="dw-modal__banner">
              <ShieldCheck size={15} />
              Great news: Your files are highly recoverable
            </div>

            <div className="dw-modal__actions dw-modal__actions--center">
              <Btn variant="ink" className="dw-modal__cta" onClick={onGoRecover}>
                Go to Recover
              </Btn>
              <Btn variant="ghost" onClick={dismiss}>
                Browse files first
              </Btn>
            </div>
          </motion.div>
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

export { useRecovery };
