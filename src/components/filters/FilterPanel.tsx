import { majorOptions, yearOptions } from "@/data/students";
import type { AcademicYear, FilterState } from "@/types/student";

interface FilterPanelProps {
  filters: FilterState;
  onToggleYear: (year: AcademicYear) => void;
  onToggleMajor: (major: string) => void;
  onAvailabilityChange: (availableOnly: boolean) => void;
  onReset: () => void;
}

const sectionLabelClass =
  "mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]";
const itemLabelClass =
  "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)]";

export function FilterPanel({
  filters,
  onToggleYear,
  onToggleMajor,
  onAvailabilityChange,
  onReset,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className={sectionLabelClass}>Academic Year</h3>
        <div className="space-y-2">
          {yearOptions.map((option) => (
            <label key={option.value} className={itemLabelClass}>
              <input
                type="checkbox"
                checked={filters.years.includes(option.value)}
                onChange={() => onToggleYear(option.value)}
                className="h-4 w-4 rounded-none border border-[var(--color-border-strong)] accent-[var(--color-accent)]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionLabelClass}>Major</h3>
        <div className="space-y-2 max-h-44 overflow-auto pr-1">
          {majorOptions.map((major) => (
            <label key={major} className={itemLabelClass}>
              <input
                type="checkbox"
                checked={filters.majors.includes(major)}
                onChange={() => onToggleMajor(major)}
                className="h-4 w-4 rounded-none border border-[var(--color-border-strong)] accent-[var(--color-accent)]"
              />
              {major}
            </label>
          ))}
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
