export function StudentCardSkeleton() {
  return (
    <article className="student-card flex h-full animate-pulse flex-col overflow-hidden border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)]">
      {/* Image area */}
      <div className="h-52 w-full bg-[var(--color-border)]" />

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Name + year badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="h-8 w-3/5 rounded bg-[var(--color-border)]" />
          <div className="mt-1 h-5 w-12 rounded bg-[var(--color-border)]" />
        </div>

        {/* Major */}
        <div className="mt-2 h-3 w-2/5 rounded bg-[var(--color-border)]" />

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-5 w-14 rounded-full bg-[var(--color-border)]" />
          <div className="h-5 w-14 rounded-full bg-[var(--color-border)]" />
          <div className="h-5 w-14 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Summary lines */}
        <div className="mt-3 flex-1 space-y-2">
          <div className="h-3 w-full rounded bg-[var(--color-border)]" />
          <div className="h-3 w-4/5 rounded bg-[var(--color-border)]" />
          <div className="h-3 w-3/5 rounded bg-[var(--color-border)]" />
        </div>

        {/* Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-9 rounded bg-[var(--color-border)]" />
          <div className="h-9 rounded bg-[var(--color-border)]" />
        </div>
      </div>
    </article>
  );
}
