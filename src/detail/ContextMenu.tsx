import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Eye, FolderOpen, Sparkles, Undo2, X } from "lucide-react";
import { useEffect } from "react";
import { useRecovery } from "../state/recovery";
import { useResults } from "../state/results";

/**
 * The results context menu (CShowContextMenu parity): Recover / Preview
 * / Open file location / Select unrecovered files / Smart select best
 * files / Clear selection.
 */
export function ContextMenu() {
  const menu = useResults((s) => s.contextMenu);
  const close = () => useResults.getState().closeContextMenu();

  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  const node = menu ? useResults.getState().list.nodes.find((n) => n.id === menu.nodeId) : null;

  return (
    <AnimatePresence>
      {menu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={close} />
          <motion.div
            className="dw-ctxmenu"
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.2, 0.8, 0.3, 1] }}
            style={{
              position: "fixed",
              left: Math.min(menu.x, window.innerWidth - 240),
              top: Math.min(menu.y, window.innerHeight - 300),
              zIndex: 100,
            }}
          >
            <CtxItem icon={<Undo2 size={14} />} label="Recover" onClick={() => {
              const ids = [...useResults.getState().selection];
              if (ids.length === 0 && node && !node.isFolder) ids.push(node.id);
              const bytes = useResults.getState().selectedBytes();
              close();
              void useRecovery.getState().openDialog(ids, ids.length, bytes);
            }} />
            <CtxItem icon={<Eye size={14} />} label="Preview" onClick={() => {
              if (node) useResults.getState().openPreview(node);
              close();
            }} />
            <CtxItem icon={<FolderOpen size={14} />} label="Open file location" onClick={() => {
              close();
              useResults.getState().selectTreeNode(node?.parentId ?? null);
            }} />
            <div className="dw-ctxmenu__sep" />
            <CtxItem icon={<Crosshair size={14} />} label="Select unrecovered files" onClick={() => {
              useResults.getState().selectUnrecovered();
              close();
            }} />
            <CtxItem icon={<Sparkles size={14} />} label="Smart select best files" onClick={() => {
              useResults.getState().smartSelectBest();
              close();
            }} />
            <CtxItem icon={<X size={14} />} label="Clear selection" onClick={() => {
              useResults.getState().clearSelection();
              close();
            }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CtxItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="dw-ctxmenu__item" role="menuitem" onClick={onClick}>
      <span className="dw-ctxmenu__icon">{icon}</span>
      {label}
    </button>
  );
}
