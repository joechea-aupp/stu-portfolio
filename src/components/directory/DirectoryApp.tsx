"use client";

import { useEffect, useMemo, useState } from "react";
import type { FilterState, Student } from "@/types/student";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { DirectoryHero } from "@/components/hero/DirectoryHero";
import { DirectorySearch } from "@/components/search/DirectorySearch";
import { StudentGrid } from "@/components/cards/StudentGrid";
import { StudentCardSkeleton } from "@/components/cards/StudentCardSkeleton";
import { MobileFilterDrawer } from "@/components/filters/MobileFilterDrawer";
import { PageLayout } from "@/components/layout/PageLayout";

const initialFilters: FilterState = {
  query: "",
  majors: [],
  availableOnly: false,
};

const PAGE_SIZE = 10;

type StudentMetricsResponse = {
  metrics?: {
    views?: number;
    kudos?: number;
  };
};

function normalizeStudent(candidate: unknown): Student | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const value = candidate as Partial<Student>;

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.major !== "string" ||
    typeof value.year !== "string" ||
    typeof value.viewCount !== "number" ||
    typeof value.kudoCount !== "number" ||
    !Array.isArray(value.skills) ||
    typeof value.available !== "boolean" ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.achievements) ||
    typeof value.summary !== "string" ||
    typeof value.imageUrl !== "string"
  ) {
    return null;
  }

  return value as Student;
}

function matchesQuery(student: Student, query: string) {
  if (!query.trim()) {
    return true;
  }

  const q = query.toLowerCase();
  return (
    student.name.toLowerCase().includes(q) ||
    student.major.toLowerCase().includes(q) ||
    student.skills.some((skill) => skill.toLowerCase().includes(q))
  );
}

export function DirectoryApp() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/students", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { students?: unknown };
        const nextStudents = Array.isArray(data.students)
          ? data.students
              .map((candidate) => normalizeStudent(candidate))
              .filter((candidate): candidate is Student => candidate !== null)
          : [];

        setStudents(nextStudents);
      } catch {
        // Keep current UI state when request fails.
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const majorOptions = useMemo(() => {
    return Array.from(new Set(students.map((student) => student.major))).sort();
  }, [students]);

  const updateFilters = (updater: (current: FilterState) => FilterState) => {
    setFilters(updater);
    setPage(1);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesMajor =
        filters.majors.length === 0 || filters.majors.some((major) => student.major === major);
      const matchesAvailability = !filters.availableOnly || student.available;
      const matchesSearchTerm = matchesQuery(student, filters.query);

      return matchesMajor && matchesAvailability && matchesSearchTerm;
    });
  }, [students, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleListValue = <T extends string>(currentValues: T[], value: T): T[] => {
    return currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
  };

  const toggleMajor = (major: string) => {
    updateFilters((current) => ({
      ...current,
      majors: toggleListValue(current.majors, major),
    }));
  };

  const updateStudentMetrics = (studentId: string, metrics: { views?: number; kudos?: number }) => {
    setStudents((current) =>
      current.map((student) => {
        if (student.id !== studentId) {
          return student;
        }

        return {
          ...student,
          viewCount:
            typeof metrics.views === "number" && Number.isFinite(metrics.views) && metrics.views >= 0
              ? metrics.views
              : student.viewCount,
          kudoCount:
            typeof metrics.kudos === "number" && Number.isFinite(metrics.kudos) && metrics.kudos >= 0
              ? metrics.kudos
              : student.kudoCount,
        };
      }),
    );
  };

  const handleViewPortfolio = (studentId: string) => {
    void (async () => {
      try {
        const response = await fetch("/api/student-metrics", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "view",
            studentId,
          }),
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as StudentMetricsResponse;
        updateStudentMetrics(studentId, {
          views: data.metrics?.views,
        });
      } catch {
        // Ignore network errors.
      }
    })();
  };

  const handleGiveKudo = (studentId: string) => {
    void (async () => {
      try {
        const response = await fetch("/api/student-metrics", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "kudo",
            studentId,
          }),
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as StudentMetricsResponse;
        updateStudentMetrics(studentId, {
          kudos: data.metrics?.kudos,
        });
      } catch {
        // Ignore network errors.
      }
    })();
  };

  const portfolioViews = useMemo<Record<string, number>>(() => {
    return Object.fromEntries(students.map((student) => [student.id, student.viewCount]));
  }, [students]);

  const kudos = useMemo<Record<string, number>>(() => {
    return Object.fromEntries(students.map((student) => [student.id, student.kudoCount]));
  }, [students]);

  return (
    <PageLayout
      width="xl"
      className="py-0 text-[var(--color-text)]"
      containerClassName="flex border-x border-[var(--color-border)]"
    >
      <FilterSidebar
        filters={filters}
        majorOptions={majorOptions}
        onToggleMajor={toggleMajor}
        onAvailabilityChange={(availableOnly) =>
          updateFilters((current) => ({ ...current, availableOnly }))
        }
        onReset={() => {
          setFilters(initialFilters);
          setPage(1);
        }}
      />

      <main className="w-full px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-5 lg:hidden">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]"
          >
            Open filters
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            {filteredStudents.length} results
          </p>
        </div>

        <DirectoryHero />
        <DirectorySearch
          value={filters.query}
          onChange={(query) => updateFilters((current) => ({ ...current, query }))}
        />

        <div className="pt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          {isLoading ? (
            <span className="inline-block h-3 w-32 animate-pulse rounded bg-[var(--color-border)]" />
          ) : (
            <>Showing {filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"}</>
          )}
        </div>

        {isLoading ? (
          <section className="pt-8 pb-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <StudentCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ) : filteredStudents.length > 0 ? (
          <StudentGrid
            students={paginatedStudents}
            portfolioViews={portfolioViews}
            kudos={kudos}
            onViewPortfolio={handleViewPortfolio}
            onGiveKudo={handleGiveKudo}
          />
        ) : (
          <div className="mt-8 border-[3px] border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
            <p className="font-heading text-4xl uppercase text-[var(--color-brand)]">No students found</p>
            <p className="mt-3 text-sm uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Try broadening your filters.
            </p>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pb-2 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border border-[var(--color-border-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="border border-[var(--color-border-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      <MobileFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        filters={filters}
        majorOptions={majorOptions}
        onToggleMajor={toggleMajor}
        onAvailabilityChange={(availableOnly) =>
          updateFilters((current) => ({ ...current, availableOnly }))
        }
        onReset={() => {
          setFilters(initialFilters);
          setPage(1);
        }}
      />
    </PageLayout>
  );
}
