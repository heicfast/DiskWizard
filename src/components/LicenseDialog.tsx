import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Check, ClipboardPaste, KeyRound, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { formatKey, isComplete } from "../lib/licenseKey";
import { Btn } from "./buttons";
import { toast } from "../state/toast";
import { useLicense } from "../state/license";
import { ModalShell } from "../recovery/StopConfirmDialog";
import { ThemePickerInline } from "./ThemePicker";

/**
 * The LicenseDialog (DiskGenie licensing UI, DiskWizard branding):
 * entry state (key input + Paste + Activate + Buy) and the Pro status
 * card (tier, holder, expiry, Validate now). The theme picker lives
 * inside BOTH states — theming is never license-gated.
 */
export function LicenseDialog() {
  const open = useLicense((s) => s.dialogOpen);
  const busy = useLicense((s) => s.busy);
  const gateError = useLicense((s) => s.gateError);
  const state = useLicense((s) => s.state);
  const { closeDialog, activate, validateNow } = useLicense.getState();

  const [key, setKey] = useState("");
  const complete = isComplete(key);

  useEffect(() => {
    if (open) setKey("");
  }, [open]);

  const pro = state?.posture === "pro" || state?.posture === "grace";

  return (
    <AnimatePresence>
      {open && (
        <ModalShell onClose={closeDialog} width={440}>
          <motion.div
            className="dw-modal dw-license"
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.3, 1] }}
          >
            <div className="dw-license__pro-head" style={{ marginBottom: 12 }}>
              <BrandMark size={34} />
              <div>
                <h3 className="dw-modal__title" style={{ marginBottom: 0 }}>
                  {pro ? "DiskWizard Pro" : "Activate DiskWizard"}
                </h3>
                <p className="dw-hint" style={{ marginTop: 2 }}>
                  {pro ? "License active" : "Enter your license code to enjoy full features and unlimited recovery."}
                </p>
              </div>
            </div>

            {pro ? (
              <div className="dw-license__pro-card">
                <div className="dw-license__benefits">
                  <Benefit label={`${state?.tier === "lifetime" ? "Lifetime" : "Yearly"} license — ${state?.name ?? "Pro user"}`} />
                  <Benefit label={`Active until ${state?.tier === "lifetime" ? "forever" : new Date(state?.expiresAt ?? Date.now()).toLocaleDateString()}`} />
                  <Benefit label={`Registered to ${state?.email ?? "—"}`} />
                </div>
                <div className="dw-modal__actions">
                  <Btn
                    variant="outline"
                    onClick={() => void validateNow().then(() => toast("success", "License validated — all features active."))}
                    leading={<BadgeCheck size={14} />}
                  >
                    Validate now
                  </Btn>
                  <Btn variant="ink" onClick={closeDialog}>
                    Done
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="dw-license__entry">
                <div className="dw-license__keyrow">
                  <input
                    className="dw-license__key"
                    placeholder="DW-XXXXX-XXXXX-XXXXX-XXXXX"
                    value={key}
                    onChange={(e) => setKey(formatKey(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && complete && !busy) void activate(key);
                    }}
                    aria-label="License code"
                    autoFocus
                  />
                  <Btn
                    className="dw-license__paste"
                    variant="outline"
                    leading={<ClipboardPaste size={14} />}
                    onClick={() => {
                      void navigator.clipboard?.readText().then((t) => setKey(formatKey(t))).catch(() => toast("info", "Clipboard unavailable in this context."));
                    }}
                  >
                    Paste
                  </Btn>
                </div>

                {gateError && <div className="dw-modal__banner dw-modal__banner--warn">{gateError}</div>}

                <div className="dw-modal__actions" style={{ marginTop: 2 }}>
                  <Btn variant="ghost" onClick={closeDialog}>
                    Later
                  </Btn>
                  <Btn
                    variant="ink"
                    disabled={!complete || busy}
                    onClick={() => void activate(key).then((r) => {
                      if (r.ok) toast("success", "Activation successful — enjoy unlimited recovery.");
                    })}
                    leading={busy ? undefined : <KeyRound size={14} />}
                  >
                    {busy ? "Activating…" : "Activate"}
                  </Btn>
                </div>

                <div className="dw-license__benefits">
                  <Benefit label="Unlimited recovery — no 2 GB trial cap" />
                  <Benefit label="Recover from BitLocker-locked drives" />
                  <Benefit label="Lost-partition rescue &amp; deep scan" />
                  <Benefit label="Priority technical support" />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Btn
                    variant="outline"
                    leading={<Sparkles size={14} />}
                    onClick={() => toast("info", "The secure store opens in your browser to complete purchase.")}
                  >
                    Buy a License Now
                  </Btn>
                  <span className="dw-hint">No reinstallation or rescan required after activation.</span>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <ThemePickerInline />
            </div>
          </motion.div>
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

function Benefit({ label }: { label: string }) {
  return (
    <span className="dw-license__benefit">
      <Check size={13} strokeWidth={3} />
      <span dangerouslySetInnerHTML={{ __html: label }} />
    </span>
  );
}
