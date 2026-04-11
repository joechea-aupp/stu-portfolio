import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortfolioStats } from "@/components/cards/PortfolioStats";
import { PageLayout } from "@/components/layout/PageLayout";
import { getPrismaClient } from "@/lib/prisma";
import type { AcademicYear, SocialLinks, Student, TimelineItem } from "@/types/student";

const SOCIAL_META: {
  key: keyof SocialLinks;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg role="img" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    key: "github",
    label: "GitHub",
    icon: (
      <svg role="img" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <svg role="img" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: (
      <svg role="img" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

const ACHIEVEMENTS_PER_PAGE = 5;
const PROJECTS_PER_PAGE = 5;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function asTimelineItems(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: TimelineItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const period = typeof candidate.period === "string" ? candidate.period : "";
    const title = typeof candidate.title === "string" ? candidate.title : "";

    if (!period || !title) {
      continue;
    }

    const timelineItem: TimelineItem = { period, title };
    if (typeof candidate.details === "string") {
      timelineItem.details = candidate.details;
    }

    const verifiedByValue = candidate.verifiedBy;
    if (verifiedByValue && typeof verifiedByValue === "object") {
      const name =
        typeof (verifiedByValue as Record<string, unknown>).name === "string"
          ? ((verifiedByValue as Record<string, unknown>).name as string)
          : "";
      const role =
        typeof (verifiedByValue as Record<string, unknown>).role === "string"
          ? ((verifiedByValue as Record<string, unknown>).role as string)
          : "";

      if (name && role) {
        timelineItem.verifiedBy = { name, role };
      }
    }

    items.push(timelineItem);
  }

  return items;
}

function toAcademicYear(value: string): AcademicYear {
  return value.toLowerCase() as AcademicYear;
}

async function getDatabaseStudentById(id: string): Promise<Student | null> {
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId)) {
    return null;
  }

  try {
    const prisma = getPrismaClient();
    const dbStudent = await prisma.student.findUnique({
      where: { id: numericId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!dbStudent) {
      return null;
    }

    return {
      id: String(dbStudent.id),
      name: dbStudent.user.name,
      year: toAcademicYear(dbStudent.classification),
      major: dbStudent.major,
      skills: asStringArray(dbStudent.skills),
      available: dbStudent.available_for_project,
      gpa: 0,
      projects: asTimelineItems(dbStudent.projects),
      achievements: asTimelineItems(dbStudent.achievements),
      summary: dbStudent.summary ?? "",
      imageUrl:
        dbStudent.image_url && dbStudent.image_url.trim().length > 0
          ? dbStudent.image_url
          : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=640&q=80",
      socialLinks: {},
    };
  } catch {
    return null;
  }
}

export default async function StudentPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const student = await getDatabaseStudentById(id);

  if (!student) {
    notFound();
  }

  const verifiedAchievements = student.achievements.filter((item) => item.verifiedBy).length;
  const achievementTierClass =
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

  const projectPageParam = resolvedSearchParams.projectPage;
  const requestedProjectPage = Array.isArray(projectPageParam)
    ? projectPageParam[0]
    : projectPageParam;
  const parsedProjectPage = Number.parseInt(requestedProjectPage ?? "1", 10);
  const totalProjectPages = Math.max(1, Math.ceil(student.projects.length / PROJECTS_PER_PAGE));
  const currentProjectPage = Number.isFinite(parsedProjectPage)
    ? Math.min(Math.max(parsedProjectPage, 1), totalProjectPages)
    : 1;
  const startProjectIndex = (currentProjectPage - 1) * PROJECTS_PER_PAGE;
  const visibleProjects = student.projects.slice(
    startProjectIndex,
    startProjectIndex + PROJECTS_PER_PAGE,
  );

  const achievementPageParam = resolvedSearchParams.achievementPage;
  const requestedAchievementPage = Array.isArray(achievementPageParam)
    ? achievementPageParam[0]
    : achievementPageParam;
  const parsedPage = Number.parseInt(requestedAchievementPage ?? "1", 10);
  const totalAchievementPages = Math.max(
    1,
    Math.ceil(student.achievements.length / ACHIEVEMENTS_PER_PAGE),
  );
  const currentAchievementPage = Number.isFinite(parsedPage)
    ? Math.min(Math.max(parsedPage, 1), totalAchievementPages)
    : 1;
  const startAchievementIndex =
    (currentAchievementPage - 1) * ACHIEVEMENTS_PER_PAGE;
  const visibleAchievements = student.achievements.slice(
    startAchievementIndex,
    startAchievementIndex + ACHIEVEMENTS_PER_PAGE,
  );

  const buildProjectPageHref = (targetPage: number) => {
    const params = new URLSearchParams();

    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (key === "projectPage" || value === undefined) return;

      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, item));
        return;
      }

      params.set(key, value);
    });

    if (targetPage > 1) {
      params.set("projectPage", String(targetPage));
    }

    const query = params.toString();
    return query ? `/students/${student.id}?${query}` : `/students/${student.id}`;
  };

  const buildAchievementPageHref = (targetPage: number) => {
    const params = new URLSearchParams();

    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (key === "achievementPage" || value === undefined) return;

      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, item));
        return;
      }

      params.set(key, value);
    });

    if (targetPage > 1) {
      params.set("achievementPage", String(targetPage));
    }

    const query = params.toString();
    return query ? `/students/${student.id}?${query}` : `/students/${student.id}`;
  };

  return (
    <PageLayout width="lg">
        <Link
          href="/"
          className="inline-block border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white"
        >
          Back to directory
        </Link>

        <section
          className={`${achievementTierClass} mt-5 overflow-hidden border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)]`}
        >
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

              <PortfolioStats
                studentId={student.id}
                extraBadge={(
                  <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${achievementBadgeClass}`}>
                    <span aria-hidden="true" className={achievementStarClass}>★</span>
                    {verifiedAchievements}
                  </span>
                )}
              />

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
                {student.projects.length > 0 && (
                  <section className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Project timeline</p>
                    <ul className="mt-3 space-y-3">
                      {visibleProjects.map((project) => (
                        <li key={`${project.period}-${project.title}`} className="grid grid-cols-[86px_1fr] gap-3">
                          <p className="pt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                            {project.period}
                          </p>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text)]">{project.title}</p>
                            {project.details ? (
                              <p className="mt-1 text-xs leading-6 text-[var(--color-text-muted)]">{project.details}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {totalProjectPages > 1 && (
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand)]">
                        <Link
                          href={buildProjectPageHref(currentProjectPage - 1)}
                          aria-disabled={currentProjectPage === 1}
                          className={`border px-3 py-1 transition ${
                            currentProjectPage === 1
                              ? "pointer-events-none border-[var(--color-border)] text-[var(--color-text-muted)]"
                              : "border-[var(--color-border-strong)] hover:bg-[var(--color-brand)] hover:text-white"
                          }`}
                        >
                          Prev
                        </Link>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalProjectPages }, (_, index) => {
                            const page = index + 1;
                            const isActive = page === currentProjectPage;
                            return (
                              <Link
                                key={page}
                                href={buildProjectPageHref(page)}
                                aria-current={isActive ? "page" : undefined}
                                className={`border px-2 py-1 transition ${
                                  isActive
                                    ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                                    : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                                }`}
                              >
                                {page}
                              </Link>
                            );
                          })}
                        </div>

                        <Link
                          href={buildProjectPageHref(currentProjectPage + 1)}
                          aria-disabled={currentProjectPage === totalProjectPages}
                          className={`border px-3 py-1 transition ${
                            currentProjectPage === totalProjectPages
                              ? "pointer-events-none border-[var(--color-border)] text-[var(--color-text-muted)]"
                              : "border-[var(--color-border-strong)] hover:bg-[var(--color-brand)] hover:text-white"
                          }`}
                        >
                          Next
                        </Link>
                      </div>
                    )}
                  </section>
                )}

                {student.achievements.length > 0 && (
                  <section className="overflow-hidden border-2 border-[#EFBF04]">
                    <div className="bg-gradient-to-r from-[#b8860b] via-[#EFBF04] to-[#ffe87c] px-4 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[oklch(98.5%_0_0)] drop-shadow-sm">Achievement timeline</p>
                    </div>
                    <ul className="space-y-3 bg-[var(--color-bg)] px-4 py-4">
                      {visibleAchievements.map((achievement) => (
                        <li key={`${achievement.period}-${achievement.title}`} className="grid grid-cols-[86px_1fr] gap-3">
                          <p className="pt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#EFBF04]">
                            {achievement.period}
                          </p>
                          <div>
                            <div className="flex items-start gap-2">
                              <p className="text-sm font-semibold text-[var(--color-text)]">{achievement.title}</p>
                              {achievement.verifiedBy && (
                                <span
                                  title={`Verified by ${achievement.verifiedBy.name}`}
                                  className="mt-0.5 shrink-0 rounded-full bg-[#EFBF04] p-0.5 text-[oklch(20%_0_0)]"
                                  aria-label="Verified"
                                >
                                  <svg viewBox="0 0 12 12" fill="none" className="size-3" aria-hidden="true">
                                    <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            {achievement.details ? (
                              <p className="mt-1 text-xs leading-6 text-[var(--color-text-muted)]">{achievement.details}</p>
                            ) : null}
                            {achievement.verifiedBy && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#EFBF04]">
                                <svg viewBox="0 0 24 24" fill="none" className="size-3 shrink-0" aria-hidden="true">
                                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                                  <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                {achievement.verifiedBy.name}
                                <span className="text-[var(--color-text-muted)] normal-case tracking-normal font-normal">·</span>
                                <span className="text-[var(--color-text-muted)] normal-case tracking-normal font-normal">{achievement.verifiedBy.role}</span>
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {totalAchievementPages > 1 && (
                      <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand)]">
                        <Link
                          href={buildAchievementPageHref(currentAchievementPage - 1)}
                          aria-disabled={currentAchievementPage === 1}
                          className={`border px-3 py-1 transition ${
                            currentAchievementPage === 1
                              ? "pointer-events-none border-[var(--color-border)] text-[var(--color-text-muted)]"
                              : "border-[var(--color-border-strong)] hover:bg-[var(--color-brand)] hover:text-white"
                          }`}
                        >
                          Prev
                        </Link>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalAchievementPages }, (_, index) => {
                            const page = index + 1;
                            const isActive = page === currentAchievementPage;
                            return (
                              <Link
                                key={page}
                                href={buildAchievementPageHref(page)}
                                aria-current={isActive ? "page" : undefined}
                                className={`border px-2 py-1 transition ${
                                  isActive
                                    ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                                    : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                                }`}
                              >
                                {page}
                              </Link>
                            );
                          })}
                        </div>

                        <Link
                          href={buildAchievementPageHref(currentAchievementPage + 1)}
                          aria-disabled={currentAchievementPage === totalAchievementPages}
                          className={`border px-3 py-1 transition ${
                            currentAchievementPage === totalAchievementPages
                              ? "pointer-events-none border-[var(--color-border)] text-[var(--color-text-muted)]"
                              : "border-[var(--color-border-strong)] hover:bg-[var(--color-brand)] hover:text-white"
                          }`}
                        >
                          Next
                        </Link>
                      </div>
                    )}
                  </section>
                )}
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

              {student.socialLinks && Object.values(student.socialLinks).some(Boolean) && (
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Connect</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {SOCIAL_META.map(({ key, label, icon }) => {
                      const url = student.socialLinks![key];
                      if (!url) return null;
                      return (
                        <li key={key}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            className="flex items-center gap-1.5 border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white"
                          >
                            {icon}
                            {label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
    </PageLayout>
  );
}
