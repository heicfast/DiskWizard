import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { formatBytes, formatCount } from "../lib/format";
import { ContextMenu } from "./ContextMenu";
import { FileList } from "./FileList";
import { FileTree } from "./FileTree";
import { FilterBar } from "./FilterBar";
import { PreviewPane } from "./PreviewPane";
import { ScanHud } from "./ScanHud";
import { Toolbar } from "./Toolbar";
import { useResults } from "../state/results";
import { useScan } from "../state/scan";
import { useView } from "../state/view";
import { StepStrip } from "../home/HomeView";
import { DestinationDialog } from "../recovery/DestinationDialog";
import { RecoveryProgressDialog } from "../recovery/RecoveryProgressDialog";
import { StopConfirmDialog } from "../recovery/StopConfirmDialog";
import { CelebrationDialog } from "../recovery/CelebrationDialog";

/**
 * The DetailPage — scan and results share ONE page (the product's core
 * UX contract): the tree fills progressively while scanning, the HUD
 * reports phase/progress, and the completed state flips the bottom bar
 * into the results summary with Recover All.
 */
export function DetailPage() {
  const page = useView((s) => s.page);
  const progress = useScan((s) => s.progress);
  const quickStats = useScan((s) => s.quickStats);
  const showQuickComplete = useScan((s) => s.showQuickComplete);
  const loadRoots = useResults((s) => s.loadRoots);
  const roots = useResults((s) => s.roots);

  // Roots load once when entering the detail page.
  useEffect(() => {
    if (page === "detail" && roots.length === 0) {
      void loadRoots();
    }
  }, [page, roots.length, loadRoots]);

  const step = progress?.phase === "complete" ? 3 : 2;

  return (
    <div className="dw-detail dw-settle-in">
      <StepStrip step={step as 2 | 3} />
      <Toolbar />
      <FilterBar />
      <div className="dw-detail__panes">
        <FileTree />
        <FileList />
        <PreviewPane />
      </div>
      <ScanHud />

      {/* Overlays */}
      <AnimatePresence>
        {showQuickComplete && quickStats && (
          <motion.div
            key="quickdone"
            className="dw-quickdone"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.3, 1] }}
          >
            <span className="dw-quickdone__icon">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <div className="dw-quickdone__title">Quick Scan Completed</div>
              <div className="dw-quickdone__body">
                You may now recover {formatCount(quickStats.files)} found files ({formatBytes(quickStats.bytes, 2)}).
                Advanced Scan is searching for more lost files in the background — you can keep browsing.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ContextMenu />
      <StopConfirmDialog />
      <CelebrationDialog />
      <DestinationDialog />
      <RecoveryProgressDialog />
    </div>
  );
}
