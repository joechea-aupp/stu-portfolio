export function SubmitPortfolioCard() {
  return (
    <article className="flex h-full flex-col justify-between border-[3px] border-[var(--color-accent)] bg-[var(--color-brand)] p-6">
      <div>
        <h3 className="font-heading text-[56px] leading-[0.9] uppercase text-white">
          Submit your portfolio
        </h3>
        <p className="mt-6 max-w-[220px] text-[11px] uppercase tracking-[0.16em] text-white/80">
          Join the showcase and get spotted by recruiters.
        </p>
      </div>

      <button
        type="button"
        className="mt-6 border-[3px] border-white bg-[var(--color-accent)] px-5 py-3 font-heading text-2xl uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-[var(--color-brand)]"
      >
        Get featured
      </button>
    </article>
  );
}
