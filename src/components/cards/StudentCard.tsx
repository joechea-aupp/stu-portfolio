import Image from "next/image";
import type { Student } from "@/types/student";

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
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

        <p className="mt-3 text-[13px] leading-5 text-[var(--color-text-muted)]">{student.summary}</p>

        <button
          type="button"
          className="mt-6 w-full bg-[var(--color-brand)] px-4 py-3 font-heading text-lg font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-accent)]"
        >
          View portfolio
        </button>
      </div>
    </article>
  );
}
