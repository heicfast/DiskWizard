import { Eye, FileArchive, FileAudio, FileText, FileVideo, Image } from "lucide-react";
import type { FileNode, FilePreview } from "../domain";
import { formatBytes, formatDate } from "../lib/format";
import { invoke } from "../lib/ipc";
import { useEffect, useState } from "react";
import { useResults } from "../state/results";

/**
 * The right preview pane — single-click selection details, double-click
 * live preview with the Recovery Chances gauge and file facts (Status:
 * Existing / Deleted / Rebuilt).
 */
export function PreviewPane() {
  const preview = useResults((s) => s.preview);
  const node = preview.node;

  if (!node) {
    return (
      <div className="dw-preview">
        <div className="dw-preview__scroll">
          <div className="dw-list__empty" style={{ paddingTop: 120 }}>
            Select a file to see details.
            <div style={{ fontSize: 12, marginTop: 8 }}>
              Double-click to preview and check recovery chances.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <PreviewBody node={node} loading={preview.loading} />;
}

function PreviewBody({ node, loading }: { node: FileNode; loading: boolean }) {
  const [info, setInfo] = useState<FilePreview | null>(null);

  useEffect(() => {
    let alive = true;
    void invoke<FilePreview>("preview_file", { fileId: node.id })
      .then((p) => {
        if (alive) setInfo(p);
      })
      .catch(() => {
        if (alive) setInfo(null);
      });
    return () => {
      alive = false;
    };
  }, [node.id]);

  return (
    <div className="dw-preview">
      <div className="dw-preview__scroll">
        <div className="dw-preview__title">Preview</div>

        <div className="dw-preview__thumb">
          {info && !loading ? (
            <PreviewThumb category={node.category} />
          ) : (
            <div className="dw-skeleton" style={{ width: "84%", height: "84%" }} />
          )}
          {info?.capReason === "video-trial" && (
            <span className="dw-chip dw-chip--ink" style={{ position: "absolute", bottom: 10 }}>
              15s preview only
            </span>
          )}
          {info?.capReason === "size" && (
            <span className="dw-chip dw-chip--caution" style={{ position: "absolute", bottom: 10 }}>
              Files larger than 100 MB are not previewable
            </span>
          )}
        </div>

        <div className="dw-preview__name">{node.name}</div>

        <button
          className="dw-btn dw-btn--ink dw-preview__previewbtn"
          onClick={() => {
            /* The standalone Preview dialog ships with the viewer subsystem. */
          }}
        >
          <Eye size={14} />
          Preview
        </button>

        <div className="dw-preview__meta">
          <MetaRow label="Size" value={formatBytes(node.sizeBytes, 2)} />
          <MetaRow label="Date Modified" value={formatDate(node.modifiedMs)} />
          <MetaRow label="Path" value={node.path || "File Path Lost"} />
          <MetaRow
            label="Status"
            value={node.status === "existing" ? "Existing" : node.status === "deleted" ? "Deleted" : "Reconstructed"}
          />
        </div>

        <div className="dw-preview__chances">
          <span className="dw-preview__chances-label">Recovery Chances</span>
          <span className={`dw-chip dw-preview__chances-pill ${gradeClass(node.grade)}`}>
            {node.grade === "high" ? "High" : node.grade === "medium" ? "Medium" : node.grade === "low" ? "Low" : "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}

function gradeClass(grade: string): string {
  switch (grade) {
    case "high":
      return "dw-chip--good";
    case "medium":
      return "dw-chip--caution";
    case "low":
      return "dw-chip--bad";
    default:
      return "";
  }
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="dw-preview__meta-row">
      <span className="dw-preview__meta-label">{label}</span>
      <span className="dw-preview__meta-value">{value}</span>
    </div>
  );
}

function PreviewThumb({ category }: { category: string }) {
  switch (category) {
    case "photo":
      return <Image />;
    case "video":
      return <FileVideo />;
    case "audio":
      return <FileAudio />;
    case "archive":
      return <FileArchive />;
    default:
      return <FileText />;
  }
}
