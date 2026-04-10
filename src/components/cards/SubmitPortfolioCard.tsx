export function SubmitPortfolioCard() {
  return (
    <article className="flex flex-col gap-3 border-[3px] border-[var(--color-accent)] bg-[var(--color-brand)] p-4">
      <div>
        <h3 className="font-heading text-[28px] leading-[0.95] uppercase text-white">
          Submit your portfolio
        </h3>
        <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/80">
          Join the showcase and get spotted by recruiters.
        </p>
      </div>

      <button
        type="button"
        className="border-[2px] border-white bg-[var(--color-accent)] px-3 py-1.5 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-[var(--color-brand)]"
      >
        Get featured
      </button>
    </article>
  );
}
