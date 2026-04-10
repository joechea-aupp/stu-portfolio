import Image from "next/image";
import type { Student } from "@/types/student";

interface StudentCardProps {
  student: Student;
  portfolioViews: number;
  maxPortfolioViews: number;
  kudoCount: number;
  maxKudos: number;
  onViewPortfolio: (studentId: string) => void;
  onGiveKudo: (studentId: string) => void;
}

function getPortfolioTrend(views: number): string {
  if (views >= 15) {
    return "Campus favorite";
  }
  if (views >= 8) {
    return "Trending";
  }
  if (views >= 3) {
    return "Rising";
  }
  return "New";
}

function getPrestigeTier(kudos: number): string {
  if (kudos >= 20) {
    return "Legendary";
  }
  if (kudos >= 12) {
    return "Elite";
  }
  if (kudos >= 6) {
    return "Respected";
  }
  if (kudos >= 2) {
    return "Noticed";
  }
  return "Emerging";
}

export function StudentCard({
  student,
  portfolioViews,
  maxPortfolioViews,
  kudoCount,
  maxKudos,
  onViewPortfolio,
  onGiveKudo,
}: StudentCardProps) {
  const popularity = maxPortfolioViews > 0
    ? Math.max(8, Math.round((portfolioViews / maxPortfolioViews) * 100))
    : 8;
  const prestige = maxKudos > 0
    ? Math.max(10, Math.round((kudoCount / maxKudos) * 100))
    : 10;

  return (
    <article className="flex h-full flex-col border-[3px] border-[var(--color-brand)] bg-[var(--color-surface)]">
      <div className="relative h-56 w-full border-b-[3px] border-[var(--color-brand)]">
        <Image
          src={student.imageUrl}
          alt={student.name}
          fill
          sizes="(min-width: 1280px) 360px, (min-width: 640px) 45vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-[38px] leading-[0.9] uppercase text-[var(--color-brand)]">
            {student.name}
          </h3>
          <span className="mt-1 inline-flex bg-[var(--color-brand)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-white">
            {student.year}
          </span>
        </div>

        <p className="mt-3 text-sm font-bold uppercase tracking-[0.06em] text-[var(--color-accent)]">
          {student.major}
        </p>

        <div className="mt-3 border-2 border-[var(--color-brand)] bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] px-3 py-2 text-white">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em]">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 fill-current"
              >
                <path d="M12 21a1 1 0 0 1-.6-.2 26 26 0 0 1-6.9-6C2.8 12.6 2 10.7 2 9a5.9 5.9 0 0 1 10-4.2A5.9 5.9 0 0 1 22 9c0 1.7-.8 3.6-2.5 5.8a26 26 0 0 1-6.9 6 1 1 0 0 1-.6.2Z" />
              </svg>
              {kudoCount} {kudoCount === 1 ? "kudo" : "kudos"}
            </p>
            <span className="inline-flex border border-white/70 bg-black/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
              {getPrestigeTier(kudoCount)}
            </span>
          </div>
          <div className="mt-2 h-2 w-full border border-white/70 bg-black/20">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${prestige}%` }}
            />
          </div>
        </div>

        <div className="mt-3 border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand)]">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 fill-current"
              >
                <path d="M12 5c-6.8 0-10.8 6-11 6.3a1 1 0 0 0 0 1.4C1.2 13 5.2 19 12 19s10.8-6 11-6.3a1 1 0 0 0 0-1.4C22.8 11 18.8 5 12 5Zm0 12c-4.9 0-8.2-3.9-9-5 0.8-1.1 4.1-5 9-5s8.2 3.9 9 5c-0.8 1.1-4.1 5-9 5Z" />
                <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
              </svg>
              {portfolioViews} {portfolioViews === 1 ? "view" : "views"}
            </p>
            <span className="inline-flex border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.11em] text-[var(--color-accent)]">
              {getPortfolioTrend(portfolioViews)}
            </span>
          </div>

          <div className="mt-2 h-2 w-full border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${popularity}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-5 text-[var(--color-text-muted)]">{student.summary}</p>

        <button
          type="button"
          onClick={() => onGiveKudo(student.id)}
          className="mt-4 w-full border-2 border-[var(--color-brand)] bg-[var(--color-surface)] px-4 py-2 font-heading text-base font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white"
        >
          Give kudo
        </button>

        <button
          type="button"
          onClick={() => onViewPortfolio(student.id)}
          className="mt-3 w-full bg-[var(--color-brand)] px-4 py-3 font-heading text-lg font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-accent)]"
        >
          View portfolio
        </button>
      </div>
    </article>
  );
}
