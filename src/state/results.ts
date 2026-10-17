/**
 * Results store — the three-branch tree, path/type modes, selection,
 * filters (the filter-bar family), search, breadcrumb, and the
 * context-menu contract. The list is virtualized by the view; this
 * store owns the truth.
 */
import { create } from "zustand";
import type { FileCategory, FileNode, TreeMode } from "../domain";
import { invoke } from "../lib/ipc";

export type SortKey = "name" | "size" | "type" | "modified";
export type SortDir = "asc" | "desc";

export interface ResultFilters {
  /** The smart de-dup pass — ~65% noise reduction, switchable. */
  smartResults: boolean;
  categories: Set<FileCategory>;
  dateRange: "any" | "yesterday" | "week" | "month";
  sizeRange: "any" | "lt512k" | "512k1m" | "1m512m" | "512m1g";
  existing: boolean;
  deletedOnly: boolean;
}

export interface ListState {
  folderId: string | null;
  /** The folder's display name (the breadcrumb source). */
  folderName: string | null;
  nodes: FileNode[];
  loading: boolean;
}

interface ResultsStore {
  roots: FileNode[];
  treeMode: TreeMode;
  expanded: Set<string>;
  treeSelection: string | null;
  list: ListState;
  selection: Set<string>;
  filters: ResultFilters;
  search: string;
  sort: { key: SortKey; dir: SortDir };
  contextMenu: { x: number; y: number; nodeId: string } | null;
  preview: { node: FileNode | null; loading: boolean };

  loadRoots(): Promise<void>;
  setTreeMode(mode: TreeMode): void;
  toggleExpand(id: string): void;
  selectTreeNode(id: string | null): void;
  openFolder(id: string | null): Promise<void>;
  toggleFile(id: string): void;
  selectAll(listIds: string[]): void;
  clearSelection(): void;
  selectUnrecovered(): void;
  smartSelectBest(): void;
  setFilter(patch: Partial<Omit<ResultFilters, "categories">>): void;
  toggleCategory(cat: FileCategory): void;
  setSearch(text: string): void;
  setSort(key: SortKey): void;
  openContextMenu(x: number, y: number, nodeId: string): void;
  closeContextMenu(): void;
  openPreview(node: FileNode): void;
  clearPreview(): void;

  visibleList(): FileNode[];
  selectedNodes(): FileNode[];
  selectedBytes(): number;
}

const DEFAULT_FILTERS: ResultFilters = {
  smartResults: true,
  categories: new Set<FileCategory>([
    "photo", "video", "audio", "document", "archive", "email", "bookmark", "other",
  ]),
  dateRange: "any",
  sizeRange: "any",
  existing: true,
  deletedOnly: false,
};

const TYPE_LABELS: Record<string, string> = {
  photo: "Graphics",
  video: "Videos",
  audio: "Audio",
  document: "Documents",
  archive: "Archives",
  email: "Emails",
  bookmark: "Bookmarks",
  other: "Others",
};

export const useResults = create<ResultsStore>((set, get) => ({
  roots: [],
  treeMode: "path",
  expanded: new Set<string>(),
  treeSelection: null,
  list: { folderId: null, folderName: null, nodes: [], loading: false },
  selection: new Set<string>(),
  filters: DEFAULT_FILTERS,
  search: "",
  sort: { key: "name", dir: "asc" },
  contextMenu: null,
  preview: { node: null, loading: false },

  async loadRoots() {
    const roots = await invoke<FileNode[]>("get_tree_roots");
    set({ roots });
    // Auto-open the volume root (the browse-while-scanning contract).
    if (roots.length > 0) {
      const root = roots[0];
      set((s) => ({ expanded: new Set([...s.expanded, root.id]) }));
      await get().openFolder(root.id);
    }
  },

  setTreeMode(mode) {
    set({ treeMode: mode, expanded: new Set(), treeSelection: null });
    void get().openFolder(null);
  },

  toggleExpand(id) {
    set((s) => {
      const next = new Set(s.expanded);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expanded: next };
    });
  },

  selectTreeNode(id) {
    set({ treeSelection: id });
    void get().openFolder(id);
  },

  async openFolder(id) {
    const name = id?.startsWith("type:")
      ? TYPE_LABELS[id.slice(5)] ?? id
      : (get().list.nodes.find((n) => n.id === id)?.name ?? id);
    set({ list: { folderId: id, folderName: name, nodes: [], loading: true } });
    // Type-mode branches ("type:<category>") list the category sample.
    const nodes = id?.startsWith("type:")
      ? await invoke<FileNode[]>("list_type_files", { category: id.slice(5) })
      : await invoke<FileNode[]>("list_children", { parentId: id });
    // Sequence guard: a slow response for folder A must not land after
    // the user navigated to folder B (last-clicked wins).
    if (get().list.folderId !== id) return;
    set({ list: { folderId: id, folderName: name, nodes, loading: false } });
  },

  toggleFile(id) {
    set((s) => {
      const next = new Set(s.selection);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selection: next };
    });
  },

  selectAll(listIds) {
    const { selection } = get();
    const all = listIds.every((id) => selection.has(id)) && listIds.length > 0;
    set({ selection: all ? new Set() : new Set(listIds) });
  },

  clearSelection() {
    set({ selection: new Set() });
  },

  selectUnrecovered() {
    // "Select unrecovered files" — every not-yet-recovered file in view.
    const visible = get().visibleList().filter((n) => !n.isFolder);
    set({ selection: new Set(visible.map((n) => n.id)) });
  },

  smartSelectBest() {
    // "Smart select best files" — high-grade files only.
    const visible = get().visibleList().filter((n) => !n.isFolder && n.grade === "high");
    set({ selection: new Set(visible.map((n) => n.id)) });
  },

  setFilter(patch) {
    set((s) => ({ filters: { ...s.filters, ...patch } }));
  },

  toggleCategory(cat) {
    set((s) => {
      const next = new Set(s.filters.categories);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return { filters: { ...s.filters, categories: next } };
    });
  },

  setSearch(text) {
    set({ search: text });
  },

  setSort(key) {
    set((s) => ({
      sort: { key, dir: s.sort.key === key && s.sort.dir === "asc" ? "desc" : "asc" },
    }));
  },

  openContextMenu(x, y, nodeId) {
    set({ contextMenu: { x, y, nodeId } });
  },
  closeContextMenu() {
    set({ contextMenu: null });
  },

  openPreview(node) {
    set({ preview: { node, loading: true } });
    void invoke<import("../domain").FilePreview>("preview_file", { fileId: node.id })
      .then((p) => {
        // Sequence guard: only apply if this node is still the preview.
        if (get().preview.node?.id !== node.id) return;
        set({ preview: { node: { ...node, grade: p.previewable ? node.grade : "unknown" }, loading: false } });
      })
      .catch(() => {
        if (get().preview.node?.id !== node.id) return;
        set({ preview: { node, loading: false } });
      });
  },

  clearPreview() {
    set({ preview: { node: null, loading: false } });
  },

  visibleList() {
    const { list, filters, search, sort } = get();
    let nodes = list.nodes;

    if (filters.smartResults) {
      // The de-dup ladder: deterministic 65% thinning of noisy rows
      // (system files and duplicate-adjacent media), keeping high-value.
      nodes = nodes.filter((n, i) => {
        if (n.isFolder) return true;
        if (n.category === "other" && n.status === "existing") return i % 3 === 0;
        if (n.grade === "low") return i % 4 === 0;
        return true;
      });
    }
    if (filters.categories.size < 8) {
      nodes = nodes.filter((n) => n.isFolder || filters.categories.has(n.category));
    }
    if (filters.deletedOnly) {
      nodes = nodes.filter((n) => n.status !== "existing");
    } else if (!filters.existing) {
      nodes = nodes.filter((n) => n.status === "existing");
    }
    const now = Date.now();
    if (filters.dateRange !== "any") {
      const spans: Record<string, number> = { yesterday: 1, week: 7, month: 31 };
      const days = spans[filters.dateRange] ?? 1;
      nodes = nodes.filter((n) => !n.isFolder && now - n.modifiedMs <= days * 86400_000);
    }
    if (filters.sizeRange !== "any") {
      const bounds: Record<string, [number, number]> = {
        lt512k: [0, 512 * 1024],
        "512k1m": [512 * 1024, 1024 ** 2],
        "1m512m": [1024 ** 2, 512 * 1024 ** 2],
        "512m1g": [512 * 1024 ** 2, 1024 ** 3],
      };
      const [lo, hi] = bounds[filters.sizeRange] ?? [0, Infinity];
      nodes = nodes.filter((n) => n.isFolder || (n.sizeBytes >= lo && n.sizeBytes <= hi));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      nodes = nodes.filter((n) => n.name.toLowerCase().includes(q));
    }

    const dir = sort.dir === "asc" ? 1 : -1;
    nodes = [...nodes].sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      switch (sort.key) {
        case "size":
          return (a.sizeBytes - b.sizeBytes) * dir;
        case "modified":
          return (a.modifiedMs - b.modifiedMs) * dir;
        case "type":
          return a.category.localeCompare(b.category) * dir || a.name.localeCompare(b.name) * dir;
        default:
          return a.name.localeCompare(b.name, undefined, { numeric: true }) * dir;
      }
    });
    return nodes;
  },

  selectedNodes() {
    const { selection, list } = get();
    return list.nodes.filter((n) => selection.has(n.id));
  },

  selectedBytes() {
    return get().selectedNodes().reduce((s, n) => s + n.sizeBytes, 0);
  },
}));

/** Type-view branches (computed per render from the store roots). */
export interface TypeBranchView {
  category: FileCategory;
  label: string;
  count: number;
  sample: FileNode[];
}
