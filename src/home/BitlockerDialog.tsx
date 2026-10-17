import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Lock, LockOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Btn } from "../components/buttons";
import { ModalShell } from "../recovery/StopConfirmDialog";
import { invoke } from "../lib/ipc";
import { useScan } from "../state/scan";
import { useView } from "../state/view";
import type { DeviceInfo } from "../domain";
import { toast } from "../state/toast";

/**
 * BitlockerUnlockDialog — the locked-volume entry: password or the
 * 48-digit recovery key, "Unlock and Recover" CTA (which doubles as
 * the funnel hand-off), unlock progress, then the scan starts on the
 * decrypted stream.
 */
export function BitlockerDialog({ device, onClose }: { device: DeviceInfo | null; onClose: () => void }) {
  const [mode, setMode] = useState<"password" | "key">("password");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (device) {
      setSecret("");
      setMode("password");
      setBusy(false);
    }
  }, [device]);

  const ready = mode === "password" ? secret.length >= 4 : secret.replace(/\D/g, "").length >= 48;

  async function unlock() {
    if (!device || !ready) return;
    setBusy(true);
    try {
      await invoke("unlock_bitlocker", { deviceId: device.id, mode, secret });
      await new Promise((r) => setTimeout(r, 1400)); // decrypt hand-off beat
      toast("success", `${device.name} unlocked — starting recovery scan.`);
      const start = useScan.getState().start;
      await start({ ...device, locked: false, fileSystem: "NTFS" });
      useView.getState().setStep(2);
      useView.getState().go("detail");
      onClose();
    } catch {
      toast("error", "Unlock failed — check your password or recovery key.");
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {device && (
        <ModalShell onClose={busy ? undefined : onClose} width={440}>
          <motion.div
            className="dw-modal dw-license"
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.3, 1] }}
          >
            <div className="dw-license__pro-head" style={{ marginBottom: 12 }}>
              <span className="dw-bitlocker__icon">
                {busy ? <LockOpen size={19} /> : <Lock size={19} />}
              </span>
              <div>
                <h3 className="dw-modal__title" style={{ marginBottom: 0 }}>Unlock BitLocker Drive</h3>
                <p className="dw-hint" style={{ marginTop: 2 }}>{device.name} · {device.model}</p>
              </div>
            </div>

            {busy ? (
              <div className="dw-modal__entry" style={{ textAlign: "center", padding: "14px 0 6px" }}>
                <div className="dw-bitlocker__spin" />
                <p className="dw-modal__body dw-modal__body--center" style={{ marginTop: 10 }}>
                  Decrypting the volume stream — reading FVE keys and preparing the scan...
                </p>
              </div>
            ) : (
              <>
                <p className="dw-modal__body">
                  Enter the BitLocker password or the 48-digit recovery key for this volume.
                  DiskWizard never stores your credentials.
                </p>

                <div className="dw-desttabs" role="tablist">
                  <button
                    className={`dw-desttab${mode === "password" ? " is-active" : ""}`}
                    role="tab"
                    aria-selected={mode === "password"}
                    onClick={() => setMode("password")}
                  >
                    Password
                  </button>
                  <button
                    className={`dw-desttab${mode === "key" ? " is-active" : ""}`}
                    role="tab"
                    aria-selected={mode === "key"}
                    onClick={() => setMode("key")}
                  >
                    Recovery Key
                  </button>
                </div>

                <input
                  className="dw-license__key"
                  placeholder={mode === "password" ? "BitLocker password" : "48-digit recovery key"}
                  type={mode === "password" ? "password" : "text"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && ready) void unlock();
                  }}
                  style={{ width: "100%", marginBottom: 4 }}
                  aria-label={mode === "password" ? "BitLocker password" : "Recovery key"}
                  autoFocus
                />
                {mode === "key" && (
                  <p className="dw-modal__footnote">
                    {secret.replace(/\D/g, "").length}/48 digits · the key from your Microsoft
                    account or the printout you saved when BitLocker was set up.
                  </p>
                )}

                <div className="dw-modal__actions">
                  <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
                  <Btn
                    variant="ink"
                    disabled={!ready}
                    onClick={() => void unlock()}
                    leading={<KeyRound size={14} />}
                  >
                    Unlock and Recover
                  </Btn>
                </div>
              </>
            )}
          </motion.div>
        </ModalShell>
      )}
    </AnimatePresence>
  );
}
