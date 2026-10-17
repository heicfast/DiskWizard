import { ChevronRight, FileText, Folder, HardDrive, Home, List, Search, TriangleAlert } from "lucide-react";
import { useResults } from "../state/results";
import { useScan } from "../state/scan";
import { useView } from "../state/view";
import { IconBtn } from "../components/buttons";

/**
 * Detail toolbar — the navigate-bar family: home/back/up cluster,
 * breadcrumb, list⇄icon toggle, filter funnel, and the search field.
 */
export function Toolbar() {
  const search = useResults((s) => s.search);
  const setSearch = useResults((s) => s.setSearch);
  const folderName = useResults((s) => s.list.folderName);
  const progress = useScan((s) => s.progress);
  const goHome = useHomeNav();

  const target = useScan((s) => s.target);
  const crumb = folderName ?? target?.name ?? "Scanning...";

  return (
    <div className="dw-toolbar">
      <div className="dw-toolbar__nav">
        <IconBtn title="Home" onClick={goHome}>
          <Home size={15} />
        </IconBtn>
        <IconBtn title="Back" onClick={goHome}>
          <ChevronRight size={15} style={{ transform: "scaleX(-1)" }} />
        </IconBtn>
        <IconBtn title="Up" disabled>
          <ChevronRight size={15} style={{ transform: "rotate(-90deg)" }} />
        </IconBtn>
      </div>
      <div className="dw-toolbar__crumb">
        <HardDrive size={13} />
        {crumb}
        {progress && progress.phase !== "complete" && (
          <span className="dw-chip dw-chip--ink" style={{ height: 17, fontSize: 9.5 }}>
            {phaseLabel(progress.phase)}
          </span>
        )}
      </div>
      <div className="dw-toolbar__spacer" />
      <IconBtn title="List view" active>
        <List size={15} />
      </IconBtn>
      <div className="dw-toolbar__search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search files or folders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search files or folders"
        />
      </div>
    </div>
  );
}

function phaseLabel(p: string): string {
  switch (p) {
    case "sdr":
      return "SD RESCUE";
    case "quick":
      return "QUICK SCAN";
    case "quick-complete":
      return "QUICK DONE";
    case "advanced":
      return "ADVANCED SCAN";
    case "organizing":
      return "ORGANIZING";
    case "paused":
      return "PAUSED";
    default:
      return "SCAN";
  }
}

function useHomeNav(): () => void {
  const go = useView((s) => s.go);
  const setStep = useView((s) => s.setStep);
  return () => {
    setStep(1);
    go("home");
  };
}

/* Icons used by the tree/list (category semantics). */
export function CategoryIcon({ category, isFolder }: { category: string; isFolder: boolean }) {
  if (isFolder) return <Folder size={15} />;
  switch (category) {
    case "photo":
    case "video":
    case "audio":
    case "document":
    case "archive":
    case "email":
    case "bookmark":
      return <FileText size={15} />;
    default:
      return <FileText size={15} />;
  }
}

export function SpecialBranchIcon(_: { kind: "lost" | "recon" }) {
  return (
    <span className="dw-tree__special">
      <TriangleAlert size={14} />
    </span>
  );
}
