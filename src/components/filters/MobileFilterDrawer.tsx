import type { FilterState } from "@/types/student";
import { FilterPanel } from "@/components/filters/FilterPanel";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onToggleMajor: (major: string) => void;
  onAvailabilityChange: (availableOnly: boolean) => void;
  onReset: () => void;
}

export function MobileFilterDrawer({ isOpen, onClose, ...panelProps }: MobileFilterDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-[min(92vw,370px)] overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-3xl uppercase tracking-[0.06em] text-[var(--color-brand)]">
            Filters
          </h2>
          <button
            type="button"
            className="border border-[var(--color-border-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <FilterPanel {...panelProps} />
      </div>
    </div>
  );
}
