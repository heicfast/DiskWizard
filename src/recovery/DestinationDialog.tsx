import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Folder, FolderOpen, HardDrive, TriangleAlert } from "lucide-react";
import { Btn } from "../components/buttons";
import { formatBytes, formatCount } from "../lib/format";
import { toast } from "../state/toast";
import { useLicense } from "../state/license";
import { useRecovery } from "../state/recovery";
import { ModalShell } from "./StopConfirmDialog";

/**
 * ChooseDestinationPathDialog parity — Local/Cloud tabs, drive rows
 * with free-space stats + same-volume warnings, "Choose folder...",
 * the Enable-file-repair toggle, and the Save gate.
 */
export function DestinationDialog() {
  const open = useRecovery((s) => s.dialogOpen);
  const fileCount = useRecovery((s) => s.fileCount);
  const bytesTotal = useRecovery((s) => s.bytesTotal);
  const targets = useRecovery((s) => s.targets);
  const selectedTargetId = useRecovery((s) => s.selectedTargetId);
  const customFolder = useRecovery((s) => s.customFolder);
  const enableFileRepair = useRecovery((s) => s.enableFileRepair);
  const [tab, setTab] = useState<"local" | "cloud">("local");
  const license = useLicense((s) => s.state);

  const { closeDialog, selectTarget, chooseFolder, setFileRepair, confirm } = useRecovery.getState();
  const saveEnabled = selectedTargetId != null || customFolder != null;

  if (!open) return null;

  const selected = targets.find((t) => t.id === selectedTargetId);
  const insufficient = selected != null && selected.freeBytes < bytesTotal;

  return (
    <AnimatePresence>
      <ModalShell onClose={closeDialog} width={560}>
        <motion.div className="dw-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.18 }}>
          <h3 className="dw-modal__title">Choose a destination path to save the file:</h3>
          <p className="dw-modal__body">
            You have <strong>{formatCount(fileCount)} file(s)</strong> ({formatBytes(bytesTotal, 2)}) to recover.
          </p>

          <div className="dw-desttabs" role="tablist">
            <button className={`dw-desttab${tab === "local" ? " is-active" : ""}`} role="tab" aria-selected={tab === "local"} onClick={() => setTab("local")}>
              Local
            </button>
            <button className={`dw-desttab${tab === "cloud" ? " is-active" : ""}`} role="tab" aria-selected={tab === "cloud"} onClick={() => setTab("cloud")}>
              Cloud
            </button>
          </div>

          {tab === "local" ? (
            <div className="dw-destlist">
              {targets.map((t) => {
                const isSel = t.id === selectedTargetId;
                const low = t.freeBytes < bytesTotal;
                return (
                  <button key={t.id} className={`dw-destrow${isSel ? " is-selected" : ""}`} onClick={() => selectTarget(t.id)} role="radio" aria-checked={isSel}>
                    <span className={`dw-destrow__radio${isSel ? " is-on" : ""}`} />
                    <span className="dw-destrow__icon">
                      <HardDrive size={18} />
                    </span>
                    <span className="dw-destrow__body">
                      <span className="dw-destrow__name">{t.name}</span>
                      <span className="dw-destrow__stats">
                        <strong style={{ color: low ? "var(--used)" : "var(--text-secondary)" }}>
                          {formatBytes(t.freeBytes, 2)}
                        </strong>{" "}
                        free of {formatBytes(t.capacityBytes, 2)}
                      </span>
                    </span>
                    {low && (
                      <span className="dw-destrow__warn" title="Not enough free space for this recovery">
                        <TriangleAlert size={15} />
                      </span>
                    )}
                  </button>
                );
              })}
              <button className={`dw-destrow${customFolder != null ? " is-selected" : ""}`} onClick={() => void chooseFolder()} role="radio" aria-checked={customFolder != null}>
                <span className={`dw-destrow__radio${customFolder != null ? " is-on" : ""}`} />
                <span className="dw-destrow__icon">
                  {customFolder ? <FolderOpen size={18} /> : <Folder size={18} />}
                </span>
                <span className="dw-destrow__body">
                  <span className="dw-destrow__name">Choose folder...</span>
                  <span className="dw-destrow__stats">{customFolder ?? "Browse for a destination folder"}</span>
                </span>
              </button>
            </div>
          ) : (
            <div className="dw-destlist">
              <div className="dw-destcloud">
                <div className="dw-destcloud__icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M17.5 19a4.5 4.5 0 1 0-.44-8.98 6 6 0 1 0-11.06 3.1A3.5 3.5 0 0 0 7 19h10.5z" />
                  </svg>
                </div>
                <div>
                  <div className="dw-destrow__name">Cloud drives</div>
                  <div className="dw-destrow__stats">Sign in to save the found data to your cloud drive.</div>
                </div>
                <Btn compact variant="outline" style={{ marginLeft: "auto" }} onClick={() => toast("info", "Cloud sign-in connects OneDrive, Google Drive, and Dropbox.")}>
                  Sign in
                </Btn>
              </div>
            </div>
          )}

          {insufficient && (
            <div className="dw-modal__banner dw-modal__banner--warn">
              <TriangleAlert size={15} />
              Need an additional {formatBytes(bytesTotal - (selected?.freeBytes ?? 0), 2)} of space. Please free up space or select another drive.
            </div>
          )}

          {selected?.isSource && (
            <div className="dw-modal__banner dw-modal__banner--warn">
              <TriangleAlert size={15} />
              Do not save data to this drive — it is where your data was lost. Saving here can overwrite the files you are recovering.
            </div>
          )}

          <div className="dw-modal__banner">
            Saving to a different drive than the one you lost data from is strongly recommended.
          </div>

          <div className="dw-destfoot">
            <label className="dw-destswitch">
              <input
                type="checkbox"
                checked={enableFileRepair}
                onChange={(e) => setFileRepair(e.target.checked)}
              />
              Enable file repair
              <span className="dw-destswitch__hint">Repairs corrupted files automatically · comes with the repair engine</span>
            </label>
            <Btn variant="ink" disabled={!saveEnabled || !!selected?.isSource} onClick={() => void confirm()}>
              Save
            </Btn>
          </div>

          {license?.posture === "unlicensed" && (
            <p className="dw-modal__footnote">
              Free trial recovers up to 2 GB. Activate DiskWizard Pro for unlimited recovery.
            </p>
          )}
        </motion.div>
      </ModalShell>
    </AnimatePresence>
  );
}
