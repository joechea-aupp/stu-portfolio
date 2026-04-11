import { PageLayout } from "@/components/layout/PageLayout";

export default function StudentPortfolioLoading() {
  return (
    <PageLayout width="lg">
      {/* Back button */}
      <div className="h-8 w-36 animate-pulse bg-[var(--color-border)]" />

      <section className="mt-5 overflow-hidden border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
          {/* Image pane */}
          <div className="min-h-[280px] animate-pulse bg-[var(--color-border)] lg:min-h-[540px]" />

          {/* Content pane */}
          <div className="animate-pulse p-5 sm:p-7">
            {/* "Student Portfolio" label */}
            <div className="h-3 w-28 rounded bg-[var(--color-border)]" />

            {/* Name */}
            <div className="mt-3 h-12 w-4/5 rounded bg-[var(--color-border)]" />

            {/* Stats row */}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-6 w-20 rounded-full bg-[var(--color-border)]" />
              <div className="h-6 w-20 rounded-full bg-[var(--color-border)]" />
              <div className="h-6 w-16 rounded-full bg-[var(--color-border)]" />
            </div>

            {/* Year / Availability grid */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="h-12 rounded bg-[var(--color-border)]" />
              <div className="h-12 rounded bg-[var(--color-border)]" />
            </div>

            {/* Major */}
            <div className="mt-4 h-12 rounded bg-[var(--color-border)]" />

            {/* Summary */}
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-[var(--color-border)]" />
              <div className="h-3 w-11/12 rounded bg-[var(--color-border)]" />
              <div className="h-3 w-4/5 rounded bg-[var(--color-border)]" />
              <div className="h-3 w-3/5 rounded bg-[var(--color-border)]" />
            </div>

            {/* Project timeline */}
            <div className="mt-4 space-y-4">
              <div className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4">
                <div className="h-3 w-28 rounded bg-[var(--color-border)]" />
                <ul className="mt-3 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                    <li key={i} className="grid grid-cols-[86px_1fr] gap-3">
                      <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-3/4 rounded bg-[var(--color-border)]" />
                        <div className="h-3 w-full rounded bg-[var(--color-border)]" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Core skills */}
            <div className="mt-5">
              <div className="h-3 w-20 rounded bg-[var(--color-border)]" />
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                  <div key={i} className="h-6 w-16 rounded bg-[var(--color-border)]" />
                ))}
              </div>
            </div>

            {/* Connect */}
            <div className="mt-5">
              <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                  <div key={i} className="h-8 w-24 rounded bg-[var(--color-border)]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
