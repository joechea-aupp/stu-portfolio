import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { students } from "@/data/students";

export function generateStaticParams() {
  return students.map((student) => ({ id: student.id }));
}

export default async function StudentPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = students.find((candidate) => candidate.id === id);

  if (!student) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/"
          className="inline-block border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white"
        >
          Back to directory
        </Link>

        <section className="mt-5 overflow-hidden border-[3px] border-[var(--color-brand)] bg-[var(--color-surface)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
            <div className="relative min-h-[280px] border-b border-[var(--color-border)] lg:min-h-[540px] lg:border-r lg:border-b-0">
              <Image
                src={student.imageUrl}
                alt={student.name}
                fill
                priority
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="p-5 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Student Portfolio
              </p>
              <h1 className="mt-2 font-heading text-[40px] uppercase leading-[0.9] text-[var(--color-brand)] sm:text-[52px]">
                {student.name}
              </h1>

              <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand)]">
                <div className="border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2">
                  <p className="text-[10px] text-[var(--color-text-muted)]">Year</p>
                  <p className="mt-1">{student.year}</p>
                </div>
                <div className="border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2">
                  <p className="text-[10px] text-[var(--color-text-muted)]">Availability</p>
                  <p className="mt-1">{student.available ? "Open" : "Closed"}</p>
                </div>
              </div>

              <div className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Major</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-accent)]">
                  {student.major}
                </p>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--color-text)]">{student.summary}</p>

              <div className="mt-4 space-y-4">
                <section className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Project timeline</p>
                  <ul className="mt-3 space-y-3">
                    {student.projects.map((project) => (
                      <li key={`${project.period}-${project.title}`} className="grid grid-cols-[86px_1fr] gap-3">
                        <p className="pt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                          {project.period}
                        </p>
                        <div className="relative border-l-2 border-[var(--color-border-strong)] pl-4">
                          <span className="absolute top-1.5 -left-[6px] h-2.5 w-2.5 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
                          <p className="text-sm font-semibold text-[var(--color-text)]">{project.title}</p>
                          {project.details ? (
                            <p className="mt-1 text-xs leading-6 text-[var(--color-text-muted)]">{project.details}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="overflow-hidden border-2 border-[#EFBF04]">
                  <div className="bg-gradient-to-r from-[#b8860b] via-[#EFBF04] to-[#ffe87c] px-4 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[oklch(98.5%_0_0)] drop-shadow-sm">Achievement timeline</p>
                  </div>
                  <ul className="space-y-3 bg-[var(--color-bg)] px-4 py-4">
                    {student.achievements.map((achievement) => (
                      <li key={`${achievement.period}-${achievement.title}`} className="grid grid-cols-[86px_1fr] gap-3">
                        <p className="pt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#EFBF04]">
                          {achievement.period}
                        </p>
                        <div className="relative border-l-2 border-[#EFBF04] pl-4">
                          <span className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rotate-45 bg-[#EFBF04]" aria-hidden="true" />
                          <p className="text-sm font-semibold text-[var(--color-text)]">{achievement.title}</p>
                          {achievement.details ? (
                            <p className="mt-1 text-xs leading-6 text-[var(--color-text-muted)]">{achievement.details}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Core skills</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {student.skills.map((skill) => (
                    <li
                      key={skill}
                      className="border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
