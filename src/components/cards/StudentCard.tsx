import Image from "next/image";
import Link from "next/link";
import type { Student } from "@/types/student";

interface StudentCardProps {
  student: Student;
  portfolioViews: number;
  kudoCount: number;
  onViewPortfolio: (studentId: string) => void;
  onGiveKudo: (studentId: string) => void;
}

export function StudentCard({
  student,
  portfolioViews,
  kudoCount,
  onViewPortfolio,
  onGiveKudo,
}: StudentCardProps) {
  const verifiedAchievements = student.achievements.filter((item) => item.verifiedBy).length;
  const featuredCardClass =
    verifiedAchievements > 5
      ? "student-card student-card--achievement-gold"
      : verifiedAchievements === 5
        ? "student-card student-card--achievement-silver"
        : verifiedAchievements === 2
          ? "student-card student-card--achievement-bronze"
        : "student-card";
  const achievementBadgeClass =
    verifiedAchievements > 5
      ? "achievement-badge--gold"
      : verifiedAchievements === 5
        ? "achievement-badge--silver"
        : verifiedAchievements === 2
          ? "achievement-badge--bronze"
        : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-brand)]";
  const achievementStarClass = verifiedAchievements > 5 ? "achievement-star-blink" : "";

  return (
    <article className={`${featuredCardClass} group flex h-full flex-col overflow-hidden border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] transition-transform duration-200 hover:-translate-y-1`}>
      <div className="relative h-52 w-full">
        <Image
          src={student.imageUrl}
          alt={student.name}
          fill
          sizes="(min-width: 1280px) 360px, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-[30px] leading-[0.95] uppercase text-[var(--color-brand)] sm:text-[34px]">
            {student.name}
          </h3>
          <span className="mt-1 shrink-0 border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand)]">
            {student.year}
          </span>
        </div>

        <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-accent)]">
          {student.major}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--color-brand)]">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1">
            <span aria-hidden="true">♥</span>
            {kudoCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
              <path d="M12 5C5.2 5 1.2 11 1 11.3a1 1 0 0 0 0 1.4C1.2 13 5.2 19 12 19s10.8-6 11-6.3a1 1 0 0 0 0-1.4C22.8 11 18.8 5 12 5Zm0 12c-4.9 0-8.2-3.9-9-5 .8-1.1 4.1-5 9-5s8.2 3.9 9 5c-.8 1.1-4.1 5-9 5Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {portfolioViews}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${achievementBadgeClass}`}>
            <span aria-hidden="true" className={achievementStarClass}>★</span>
            {verifiedAchievements}
          </span>
        </div>

        <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-text-muted)]">{student.summary}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onGiveKudo(student.id)}
            className="w-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)] transition hover:bg-[var(--color-bg)]"
          >
            + Kudo
          </button>

          <Link
            href={`/students/${student.id}`}
            onClick={() => onViewPortfolio(student.id)}
            className="w-full bg-[var(--color-brand)] px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--color-accent)]"
          >
            View Student Portfolio
          </Link>
        </div>
      </div>
    </article>
  );
}
