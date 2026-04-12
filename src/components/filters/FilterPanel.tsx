import { useMemo, useState } from "react";
import type { FilterState } from "@/types/student";

interface FilterPanelProps {
  filters: FilterState;
  majorOptions: string[];
  onToggleMajor: (major: string) => void;
  onAvailabilityChange: (availableOnly: boolean) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const sectionLabelClass =
  "mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]";
const itemLabelClass =
  "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)]";

export function FilterPanel({
  filters,
  majorOptions,
  onToggleMajor,
  onAvailabilityChange,
  onReset,
  isLoading = false,
}: FilterPanelProps) {
  const [majorQuery, setMajorQuery] = useState("");
  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);

  const filteredMajorOptions = useMemo(() => {
    const query = majorQuery.trim().toLowerCase();
    if (!query) {
      return majorOptions;
    }

    return majorOptions.filter((major) => major.toLowerCase().includes(query));
  }, [majorOptions, majorQuery]);

  const selectedMajorCount = filters.majors.length;

  return (
    <div className="space-y-6">
      <section>
        <h3 className={sectionLabelClass}>Major</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsMajorDropdownOpen((current) => !current)}
            className="flex w-full items-center justify-between border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)]"
            aria-expanded={isMajorDropdownOpen}
            aria-controls="major-filter-dropdown"
          >
            <span>
              {selectedMajorCount === 0
                ? "Select majors"
                : `${selectedMajorCount} major${selectedMajorCount === 1 ? "" : "s"} selected`}
            </span>
            <span aria-hidden="true">{isMajorDropdownOpen ? "-" : "+"}</span>
          </button>

          {isMajorDropdownOpen ? (
            <div
              id="major-filter-dropdown"
              className="space-y-2 border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <input
                type="text"
                value={majorQuery}
                onChange={(event) => setMajorQuery(event.target.value)}
                placeholder="Search majors..."
                className="w-full border border-[var(--color-border-strong)] bg-white px-2 py-2 text-xs font-medium text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
              />

              <div className="max-h-44 space-y-2 overflow-auto pr-1">
                {isLoading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-pulse rounded-sm bg-[var(--color-border)]" />
                        <div
                          className="h-3 animate-pulse rounded bg-[var(--color-border)]"
                          style={{ width: `${60 + (i % 3) * 15}%` }}
                        />
                      </div>
                    ))
                  : filteredMajorOptions.length > 0
                    ? filteredMajorOptions.map((major) => (
                        <label key={major} className={itemLabelClass}>
                          <input
                            type="checkbox"
                            checked={filters.majors.includes(major)}
                            onChange={() => onToggleMajor(major)}
                            className="h-4 w-4 rounded-none border border-[var(--color-border-strong)] accent-[var(--color-accent)]"
                          />
                          {major}
                        </label>
                      ))
                    : (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                        No majors found
                      </p>
                    )}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className={sectionLabelClass}>Availability</h3>
        <label className={itemLabelClass}>
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(event) => onAvailabilityChange(event.target.checked)}
            className="h-4 w-4 rounded-none border border-[var(--color-border-strong)] accent-[var(--color-accent)]"
          />
          Available for projects
        </label>
      </section>

      <button
        type="button"
        onClick={onReset}
        className="w-full border border-[var(--color-border-strong)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white"
      >
        Reset filters
      </button>
    </div>
  );
}
