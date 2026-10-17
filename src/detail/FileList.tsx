import { useVirtualizer } from "@tanstack/react-virtual";
import { FileText, Folder } from "lucide-react";
import { useMemo, useRef } from "react";
import type { FileNode } from "../domain";
import { formatBytes, formatCount, formatDate } from "../lib/format";
import { useResults } from "../state/results";
import { useScan } from "../state/scan";

const CATEGORY_LABELS: Record<string, string> = {
  photo: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document",
  archive: "Archive",
  email: "Email",
  bookmark: "Bookmark",
  other: "File",
  folder: "File folder",
};

/**
 * The results list — virtualized rows with the select-all checkbox,
 * sortable columns (Name / Size / Type / Date Modified / Status), and
 * the recoverability grade chip per file. Right-click opens the
 * context menu; double-click opens the live preview.
 */
export function FileList() {
  const parentRef = useRef<HTMLDivElement>(null);
  const list = useResults((s) => s.list);
  const selection = useResults((s) => s.selection);
  const sort = useResults((s) => s.sort);
  const progress = useScan((s) => s.progress);
  const scanning = progress != null && progress.phase !== "complete" && progress.phase !== "stopped";

  const filters = useResults((s) => s.filters);
  const search = useResults((s) => s.search);
  const nodes = useMemo(
    () => useResults.getState().visibleList(),
    [list.nodes, list.folderId, selection, sort, filters, search, progress?.phase],
  );

  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 18,
  });

  const allSelected = nodes.length > 0 && nodes.every((n) => selection.has(n.id));

  return (
    <div className="dw-list">
      <div className="dw-list__header" role="row">
        <span className="dw-list__col" style={{ justifyContent: "center" }}>
          <input
            type="checkbox"
            aria-label="Select all"
            checked={allSelected}
            onChange={() => useResults.getState().selectAll(nodes.filter((n) => !n.isFolder).map((n) => n.id))}
            style={{ accentColor: "var(--ink)", width: 15, height: 15, cursor: "pointer" }}
          />
        </span>
        <HeaderCol label="Name" sortKey="name" sort={sort} />
        <HeaderCol label="Size" sortKey="size" sort={sort} />
        <HeaderCol label="Type" sortKey="type" sort={sort} />
        <HeaderCol label="Date Modified" sortKey="modified" sort={sort} />
        <HeaderCol label="Status" sortKey="name" sort={sort} hideCaret />
      </div>

      <div className="dw-list__scroll" ref={parentRef}>
        {list.loading && nodes.length === 0 ? (
          <div className="dw-list__empty">Loading…</div>
        ) : nodes.length === 0 ? (
          <div className="dw-list__empty">
            {useResults.getState().search
              ? "No files match your search. Try a different term or clear the filters."
              : "This folder is empty."}
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const n = nodes[vi.index];
              return (
                <Row
                  key={n.id}
                  node={n}
                  top={vi.start}
                  selected={selection.has(n.id)}
                  scanning={scanning}
                  onContext={(x, y) => useResults.getState().openContextMenu(x, y, n.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderCol({
  label,
  sortKey,
  sort,
  hideCaret = false,
}: {
  label: string;
  sortKey: "name" | "size" | "type" | "modified";
  sort: { key: string; dir: "asc" | "desc" };
  hideCaret?: boolean;
}) {
  const isSorted = sort.key === sortKey;
  return (
    <span
      className={`dw-list__col${isSorted ? " is-sorted" : ""}`}
      role="columnheader"
      onClick={() => useResults.getState().setSort(sortKey)}
    >
      {label}
      {!hideCaret && (
        <span style={{ fontSize: 8, opacity: isSorted ? 1 : 0.35 }}>
          {isSorted && sort.dir === "desc" ? "▼" : "▲"}
        </span>
      )}
    </span>
  );
}

function Row({
  node,
  top,
  selected,
  scanning,
  onContext,
}: {
  node: FileNode;
  top: number;
  selected: boolean;
  scanning: boolean;
  onContext: (x: number, y: number) => void;
}) {
  const previewSel = useResults((s) => s.preview.node?.id === node.id);
  return (
    <div
      className={`dw-row${selected || previewSel ? " is-selected-row" : ""}`}
      style={{ position: "absolute", top, left: 0, right: 0, height: 34 }}
      role="row"
      onContextMenu={(e) => {
        e.preventDefault();
        onContext(e.clientX, e.clientY);
      }}
      onDoubleClick={() => {
        if (node.isFolder) {
          void useResults.getState().openFolder(node.id);
        } else {
          useResults.getState().openPreview(node);
        }
      }}
      onClick={() => {
        if (!node.isFolder) useResults.getState().openPreview(node);
      }}
    >
      <span className="dw-row__check">
        {node.isFolder ? null : (
          <input
            type="checkbox"
            aria-label={`Select ${node.name}`}
            checked={selected}
            onChange={() => useResults.getState().toggleFile(node.id)}
            onClick={(e) => e.stopPropagation()}
            style={{ accentColor: "var(--ink)", width: 15, height: 15, cursor: "pointer" }}
          />
        )}
      </span>
      <span className="dw-row__name">
        {node.isFolder ? (
          <Folder size={15} />
        ) : (
          <FileText size={15} style={{ color: `var(--cat-${node.category})`, filter: "saturate(1.1)" }} />
        )}
        <span className="dw-row__name-text">{node.name}</span>
      </span>
      <span className="dw-row__num">
        {node.isFolder ? `${formatCount(node.fileCount ?? 0)} items` : formatBytes(node.sizeBytes, 1)}
      </span>
      <span className="dw-row__type">
        <span className="dw-row__type-dot" style={{ background: `var(--cat-${node.category})` }} />
        {CATEGORY_LABELS[node.category] ?? "File"}
      </span>
      <span className="dw-row__num">{formatDate(node.modifiedMs)}</span>
      <span>
        {node.isFolder ? (
          <span className="dw-row__status">—</span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`dw-row__status dw-row__status--${node.status}`}>
              {node.status === "existing" ? "Existing" : node.status === "deleted" ? "Deleted" : "Rebuilt"}
            </span>
            <span className={`dw-row__grade dw-row__grade--${node.grade}`}>
              {scanning ? "…" : node.grade === "high" ? "Good" : node.grade === "medium" ? "Fair" : node.grade === "low" ? "Poor" : "—"}
            </span>
          </span>
        )}
      </span>
    </div>
  );
}

/** The type-view list (Type tab active — flat category samples). */
export function TypeList({ category }: { category: string }) {
  const nodes = useMemo(() => {
    const all = useResults.getState().list.nodes;
    return all.filter((n) => !n.isFolder && n.category === category).slice(0, 200);
  }, [category]);
  void nodes;
  return null; // The type view routes through FileList via branch select.
}
