import { majorOptions, skillOptions, yearOptions } from "@/data/students";
import type { AcademicYear, FilterState } from "@/types/student";

interface FilterPanelProps {
  filters: FilterState;
  onToggleYear: (year: AcademicYear) => void;
  onToggleMajor: (major: string) => void;
  onToggleSkill: (skill: string) => void;
  onAvailabilityChange: (availableOnly: boolean) => void;
  onGpaChange: (minGpa: number) => void;
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
  onToggleSkill,
  onAvailabilityChange,
  onGpaChange,
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
        <h3 className={sectionLabelClass}>Skills</h3>
        <div className="space-y-2 max-h-44 overflow-auto pr-1">
          {skillOptions.map((skill) => (
            <label key={skill} className={itemLabelClass}>
              <input
                type="checkbox"
                checked={filters.skills.includes(skill)}
                onChange={() => onToggleSkill(skill)}
                className="h-4 w-4 rounded-none border border-[var(--color-border-strong)] accent-[var(--color-accent)]"
              />
              {skill}
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

      <section>
        <h3 className={sectionLabelClass}>GPA Range</h3>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)]">
          Minimum GPA: <span className="text-[var(--color-accent)]">{filters.minGpa.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={2}
          max={4}
          step={0.1}
          value={filters.minGpa}
          onChange={(event) => onGpaChange(Number(event.target.value))}
          className="mt-3 w-full accent-[var(--color-accent)]"
        />
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
