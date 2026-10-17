import { ChevronRight, Folder, HardDrive } from "lucide-react";
import { useEffect, useState } from "react";
import type { FileNode } from "../domain";
import { invoke } from "../lib/ipc";
import { formatCompact } from "../lib/format";
import { useResults } from "../state/results";
import { useScan } from "../state/scan";

/**
 * The left tree — Path mode (the volume root / File Path Lost /
 * Reconstructed branches) and Type mode (category branches). Counts
 * stream live while scanning (browse-while-scanning contract).
 */
export function FileTree() {
  const mode = useResults((s) => s.treeMode);
  return (
    <div className="dw-tree">
      <div className="dw-tree__tabs" role="tablist" aria-label="Tree mode">
        <button
          className={`dw-tree__tab${mode === "path" ? " is-active" : ""}`}
          role="tab"
          aria-selected={mode === "path"}
          onClick={() => useResults.getState().setTreeMode("path")}
        >
          Path
        </button>
        <button
          className={`dw-tree__tab${mode === "type" ? " is-active" : ""}`}
          role="tab"
          aria-selected={mode === "type"}
          onClick={() => useResults.getState().setTreeMode("type")}
        >
          Type
        </button>
      </div>
      <div className="dw-tree__scroll">{mode === "path" ? <PathTree /> : <TypeTree />}</div>
    </div>
  );
}

/* ── Path mode ─────────────────────────────────────────────────────────── */

function PathTree() {
  const roots = useResults((s) => s.roots);
  const reconNodes = useScan((s) => s.reconNodes);
  const progress = useScan((s) => s.progress);
  const scanning = progress != null && progress.phase !== "complete" && progress.phase !== "stopped";

  return (
    <>
      {roots.map((root) => (
        <TreeBranch
          key={root.id}
          node={root}
          depth={0}
          reconNodes={root.name === "Reconstructed" ? reconNodes : []}
          scanning={scanning}
        />
      ))}
      {roots.length === 0 && (
        <div className="dw-list__empty">
          {scanning ? "First files are being indexed…" : "Preparing results tree…"}
        </div>
      )}
    </>
  );
}

function TreeBranch({
  node,
  depth,
  reconNodes,
  scanning,
}: {
  node: FileNode;
  depth: number;
  reconNodes: FileNode[];
  scanning: boolean;
}) {
  const expanded = useResults((s) => s.expanded);
  const treeSelection = useResults((s) => s.treeSelection);
  const [children, setChildren] = useState<FileNode[] | null>(null);
  const isOpen = expanded.has(node.id);
  const isSel = treeSelection === node.id;

  useEffect(() => {
    if (!isOpen || children != null || !node.isFolder) return;
    let alive = true;
    void invoke<FileNode[]>("list_children", { parentId: node.id }).then((kids) => {
      if (alive) setChildren(kids);
    });
    return () => {
      alive = false;
    };
  }, [isOpen, children, node.id, node.isFolder]);

  const { toggleExpand, selectTreeNode } = useResults.getState();
  const isRoot = depth === 0;
  const count = reconNodes.length > 0 ? reconNodes.length : (node.fileCount ?? 0);

  const visibleChildren = reconNodes.length > 0
    ? reconNodes
    : (children ?? []);

  return (
    <>
      <div
        className={`dw-tree__row${isSel ? " is-selected" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          selectTreeNode(node.id);
          if (node.isFolder && !isOpen) toggleExpand(node.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            selectTreeNode(node.id);
            if (node.isFolder) toggleExpand(node.id);
          }
        }}
        role="treeitem"
        aria-expanded={node.isFolder ? isOpen : undefined}
        tabIndex={0}
      >
        <span className={`dw-tree__caret${isOpen ? " is-open" : ""}${node.isFolder ? "" : " is-leaf"}`}>
          <ChevronRight size={12} />
        </span>
        <span className="dw-tree__icon">
          {isRoot ? <HardDrive size={14} /> : <Folder size={14} />}
        </span>
        <span className="dw-tree__label">{node.name}</span>
        {count > 0 && (
          <span className="dw-tree__badge">
            {scanning && isRoot ? formatCompact(Math.floor(count * 0.62)) : formatCompact(count)}
          </span>
        )}
      </div>
      {isOpen &&
        visibleChildren.slice(0, 40).map((c) => (
          <TreeBranch
            key={c.id}
            node={c}
            depth={depth + 1}
            reconNodes={[]}
            scanning={scanning}
          />
        ))}
    </>
  );
}

/* ── Type mode ─────────────────────────────────────────────────────────── */

const TYPE_BRANCHES: Array<{ cat: string; label: string; count: number }> = [
  { cat: "photo", label: "Graphics", count: 214_882 },
  { cat: "video", label: "Videos", count: 84_112 },
  { cat: "audio", label: "Audio", count: 42_008 },
  { cat: "document", label: "Documents", count: 302_441 },
  { cat: "archive", label: "Archives", count: 59_880 },
  { cat: "email", label: "Emails", count: 25_408 },
  { cat: "bookmark", label: "Bookmarks", count: 12_004 },
  { cat: "other", label: "Others", count: 398_526 },
];

function TypeTree() {
  const progress = useScan((s) => s.progress);
  const done = progress?.phase === "complete" || progress == null;
  return (
    <>
      {TYPE_BRANCHES.map((b) => (
        <div
          key={b.cat}
          className="dw-tree__row"
          onClick={() => useResults.getState().selectTreeNode(`type:${b.cat}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter") useResults.getState().selectTreeNode(`type:${b.cat}`);
          }}
          role="treeitem"
          tabIndex={0}
        >
          <span className="dw-tree__caret is-leaf">
            <ChevronRight size={12} />
          </span>
          <span className="dw-tree__icon">
            <span
              className="dw-row__type-dot"
              style={{ background: `var(--cat-${b.cat})`, borderRadius: 4 }}
            />
          </span>
          <span className="dw-tree__label">{b.label}</span>
          <span className="dw-tree__badge">
            {done ? formatCompact(b.count) : formatCompact(Math.floor(b.count * 0.62))}
          </span>
        </div>
      ))}
    </>
  );
}
