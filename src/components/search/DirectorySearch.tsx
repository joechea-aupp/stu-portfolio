interface DirectorySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function DirectorySearch({ value, onChange }: DirectorySearchProps) {
  return (
    <section className="pt-6">
      <div className="flex w-full border-[3px] border-[var(--color-brand)] bg-[var(--color-surface)]">
        <label htmlFor="student-search" className="sr-only">
          Search students
        </label>
        <div className="flex flex-1 items-center gap-2 px-3 sm:px-4">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-[var(--color-brand)]"
          >
            <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5L17.5 17.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <input
            id="student-search"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search by name, major, or skill..."
            className="h-14 w-full bg-transparent text-sm uppercase tracking-[0.08em] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
          />
        </div>
        <button
          type="button"
          className="h-14 min-w-28 border-l-[3px] border-[var(--color-brand)] bg-[var(--color-accent)] px-6 font-heading text-xl font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)]"
        >
          Find
        </button>
      </div>
    </section>
  );
}
