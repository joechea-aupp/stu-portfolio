import type { FilterState } from "@/types/student";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { SubmitPortfolioCard } from "@/components/cards/SubmitPortfolioCard";

interface FilterSidebarProps {
  filters: FilterState;
  majorOptions: string[];
  onToggleMajor: (major: string) => void;
  onAvailabilityChange: (availableOnly: boolean) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="hidden w-[290px] border-r border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-7 lg:block">
      <div className="sticky top-4">
        <div className="mb-6">
          <SubmitPortfolioCard />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Filters
        </p>
        <p className="mb-5 text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Refine directory
        </p>
        <FilterPanel {...props} />
      </div>
    </aside>
  );
}
