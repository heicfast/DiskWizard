import { Clock, FileImage, FileText, FileVideo, Wrench } from "lucide-react";import { StepStrip } from "../home/HomeView";

/**
 * File Repair — the advanced repairing surface (photo / video /
 * document repair). Per the product plan this is the NEXT priority
 * after the core recovery flow is production-ready, so this page
 * presents the incoming capability set with its real feature copy
 * (integrated repair, preview-before-recovery) and a "building next"
 * state.
 */
export function FileRepairView() {
  return (
    <div className="dw-detail dw-settle-in">
      <StepStrip step={1} />
      <div className="dw-health__scroll">
        <div className="dw-health__inner">
          <div className="dw-health__head">
            <div>
              <h2 className="dw-health__title">File Repair</h2>
              <p className="dw-health__subtitle">
                Repair corrupted photos, videos, and documents — an integrated part of DiskWizard recovery.
              </p>
            </div>
            <span className="dw-chip dw-chip--ink" style={{ height: 24 }}>
              <Clock size={12} />
              Next release
            </span>
          </div>

          <div className="dw-coach__tiles" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 8 }}>
            <RepairTile
              icon={<FileImage size={24} />}
              title="Advanced Photo Repair"
              body="Automatically restores corrupted JPEG, JPG, PNG, and GIF files to good condition. Preview the repaired image before final recovery."
            />
            <RepairTile
              icon={<FileVideo size={24} />}
              title="Video Repair"
              body="Fix unplayable MP4, MOV, and camera footage with sample-guided reconstruction — right from your scan results."
            />
            <RepairTile
              icon={<FileText size={24} />}
              title="Document Repair"
              body="Extract and repair every component of corrupted Word, Excel, PowerPoint, and PDF documents."
            />
          </div>

          <div className="dw-healthnote">
            <span className="dw-healthnote__icon" style={{ background: "var(--ink-soft)", color: "var(--ink)" }}>
              <Wrench size={18} />
            </span>
            <div>
              <div className="dw-healthnote__title">Repair ships with the core engine</div>
              <div className="dw-healthnote__body">
                The repair pipeline is deeply integrated with the scan engine — corrupted files found during recovery
                are queued for repair automatically when “Enable file repair” is on. This surface lights up as soon as
                the recovery core is connected.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepairTile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="dw-coach__tile" style={{ padding: "22px 18px" }}>
      <span style={{ color: "var(--ink)" }}>{icon}</span>
      <span className="dw-coach__tile-label" style={{ fontSize: 13.5 }}>{title}</span>
      <span className="dw-coach__tile-sub" style={{ lineHeight: 1.5 }}>{body}</span>
    </div>
  );
}
