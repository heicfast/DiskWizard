import { Check, ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useResults, type ResultFilters } from "../state/results";

/**
 * FilterBar — the filter-family dropdowns (File Type / Date Modified /
 * File Size), the smart-results switch (the ~65% de-dup ladder with
 * "switch to complete results at any time"), and Reset Filter.
 */
export function FilterBar() {
  const filters = useResults((s) => s.filters);
  const search = useResults((s) => s.search);

  const typeValue = filters.categories.size < 8;
  const anyFilter =
    typeValue || filters.dateRange !== "any" || filters.sizeRange !== "any" || !filters.smartResults || filters.deletedOnly || search.length > 0;

  return (
    <div className="dw-filterbar">
      <FilterDropdown
        label="File Type"
        icon={<SlidersHorizontal size={13} />}
        hasValue={typeValue}
      >
        {(close) => <TypeMenu close={close} />}
      </FilterDropdown>

      <FilterDropdown label="Date Modified" hasValue={filters.dateRange !== "any"}>
        {(close) => <DateMenu close={close} />}
      </FilterDropdown>

      <FilterDropdown label="File Size" hasValue={filters.sizeRange !== "any"}>
        {(close) => <SizeMenu close={close} />}
      </FilterDropdown>

      <div className="dw-filterbar__spacer" />

      <label className="dw-filterbar__switch" title="Filters duplicate and nonessential results — about 65% fewer files to review in testing.">
        <input
          type="checkbox"
          checked={filters.smartResults}
          onChange={(e) => useResults.getState().setFilter({ smartResults: e.target.checked })}
          style={{ accentColor: "var(--ink)", width: 14, height: 14, cursor: "pointer" }}
        />
        Smart results
      </label>

      {anyFilter && (
        <button
          className="dw-filterbtn dw-filtermenu__reset"
          onClick={() => {
            useResults.getState().setSearch("");
            useResults.getState().setFilter({
              smartResults: true,
              dateRange: "any",
              sizeRange: "any",
              existing: true,
              deletedOnly: false,
            });
            useResults.setState({ filters: { ...useResults.getState().filters, categories: new Set(["photo", "video", "audio", "document", "archive", "email", "bookmark", "other"] as const) } });
          }}
        >
          <RotateCcw size={12} />
          Reset Filter
        </button>
      )}
    </div>
  );
}

/* ── Dropdown shell (geometry-gated open, ESC/mouse-close) ─────────────── */

function FilterDropdown({
  label,
  icon,
  hasValue,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  hasValue: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className={`dw-filterbtn${hasValue ? " has-value" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
        {label}
        <span className={`dw-filterbtn__caret${open ? " is-open" : ""}`}>
          <ChevronDown size={12} />
        </span>
      </button>
      {open && (
        <div className="dw-filtermenu" role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/* ── Menus ─────────────────────────────────────────────────────────────── */

const CATEGORIES: Array<{ cat: ResultFilters["categories"] extends Set<infer T> ? T : never; label: string }> = [
  { cat: "photo", label: "Pictures" },
  { cat: "video", label: "Videos" },
  { cat: "document", label: "Documents" },
  { cat: "archive", label: "Archive" },
  { cat: "audio", label: "Audio" },
  { cat: "email", label: "Emails" },
  { cat: "bookmark", label: "Bookmarks" },
  { cat: "other", label: "Others" },
];

function TypeMenu({ close }: { close: () => void }) {
  const cats = useResults((s) => s.filters.categories);
  return (
    <>
      {CATEGORIES.map((c) => (
        <button
          key={c.cat}
          className={`dw-filtermenu__item${cats.has(c.cat) ? " is-on" : ""}`}
          role="menuitemcheckbox"
          aria-checked={cats.has(c.cat)}
          onClick={() => useResults.getState().toggleCategory(c.cat)}
        >
          <Check size={13} style={{ opacity: cats.has(c.cat) ? 1 : 0.25 }} />
          {c.label}
        </button>
      ))}
      <div className="dw-filtermenu__sep" />
      <button
        className="dw-filtermenu__item"
        onClick={() => {
          for (const c of CATEGORIES) {
            if (!cats.has(c.cat)) useResults.getState().toggleCategory(c.cat);
          }
          close();
        }}
      >
        Select All
      </button>
    </>
  );
}

const DATE_OPTIONS: Array<{ v: ResultFilters["dateRange"]; label: string }> = [
  { v: "any", label: "Any date" },
  { v: "yesterday", label: "Yesterday" },
  { v: "week", label: "Last 7 days" },
  { v: "month", label: "Last 1 month" },
];

function DateMenu({ close }: { close: () => void }) {
  const cur = useResults((s) => s.filters.dateRange);
  return (
    <>
      {DATE_OPTIONS.map((o) => (
        <button
          key={o.v}
          className={`dw-filtermenu__item${cur === o.v ? " is-on" : ""}`}
          role="menuitemradio"
          aria-checked={cur === o.v}
          onClick={() => {
            useResults.getState().setFilter({ dateRange: o.v });
            close();
          }}
        >
          {o.label}
        </button>
      ))}
    </>
  );
}

const SIZE_OPTIONS: Array<{ v: ResultFilters["sizeRange"]; label: string }> = [
  { v: "any", label: "Any size" },
  { v: "lt512k", label: "Under 512 KB" },
  { v: "512k1m", label: "512 KB — 1 MB" },
  { v: "1m512m", label: "1 MB — 512 MB" },
  { v: "512m1g", label: "512 MB — 1 GB" },
];

function SizeMenu({ close }: { close: () => void }) {
  const cur = useResults((s) => s.filters.sizeRange);
  return (
    <>
      {SIZE_OPTIONS.map((o) => (
        <button
          key={o.v}
          className={`dw-filtermenu__item${cur === o.v ? " is-on" : ""}`}
          role="menuitemradio"
          aria-checked={cur === o.v}
          onClick={() => {
            useResults.getState().setFilter({ sizeRange: o.v });
            close();
          }}
        >
          {o.label}
        </button>
      ))}
    </>
  );
}
