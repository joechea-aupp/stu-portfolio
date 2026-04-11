"use client";

import { useEffect, useMemo, useSyncExternalStore, useState } from "react";
import type { FilterState, Student } from "@/types/student";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { DirectoryHero } from "@/components/hero/DirectoryHero";
import { DirectorySearch } from "@/components/search/DirectorySearch";
import { StudentGrid } from "@/components/cards/StudentGrid";
import { MobileFilterDrawer } from "@/components/filters/MobileFilterDrawer";
import { PageLayout } from "@/components/layout/PageLayout";

const initialFilters: FilterState = {
  query: "",
  majors: [],
  availableOnly: false,
};

const PAGE_SIZE = 10;
const PORTFOLIO_VIEWS_STORAGE_KEY = "portfolio-views";
const KUDOS_STORAGE_KEY = "portfolio-kudos";
const DIRECTORY_STUDENTS_STORAGE_KEY = "directory-students";

type StudentMetricsResponse = {
  metrics?: {
    views?: number;
    kudos?: number;
  };
};

function writeMetricToStorage(storageKey: string, studentId: string, value: number) {
  if (typeof window === "undefined") {
    return;
  }

  const current = normalizeCountRecord(window.localStorage.getItem(storageKey) ?? "{}");
  const next = {
    ...current,
    [studentId]: value,
  };

  window.localStorage.setItem(storageKey, JSON.stringify(next));
}

function subscribeDirectoryStudents(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("directory-students-updated", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("directory-students-updated", onStoreChange);
  };
}

function subscribePortfolioViews(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("portfolio-views-updated", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("portfolio-views-updated", onStoreChange);
  };
}

function subscribeKudos(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("portfolio-kudos-updated", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("portfolio-kudos-updated", onStoreChange);
  };
}

function getPortfolioViewsSnapshot() {
  if (typeof window === "undefined") {
    return "{}";
  }

  return window.localStorage.getItem(PORTFOLIO_VIEWS_STORAGE_KEY) ?? "{}";
}

function getPortfolioViewsServerSnapshot() {
  return "{}";
}

function getKudosSnapshot() {
  if (typeof window === "undefined") {
    return "{}";
  }

  return window.localStorage.getItem(KUDOS_STORAGE_KEY) ?? "{}";
}

function getKudosServerSnapshot() {
  return "{}";
}

function getDirectoryStudentsSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(DIRECTORY_STUDENTS_STORAGE_KEY) ?? "[]";
}

function getDirectoryStudentsServerSnapshot() {
  return "[]";
}

function normalizeCountRecord(snapshot: string): Record<string, number> {
  try {
    const parsed = JSON.parse(snapshot);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const normalized: Record<string, number> = {};
    for (const [studentId, count] of Object.entries(parsed)) {
      if (typeof count === "number" && Number.isFinite(count) && count >= 0) {
        normalized[studentId] = count;
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

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
    !Array.isArray(value.skills) ||
    typeof value.available !== "boolean" ||
    typeof value.gpa !== "number" ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.achievements) ||
    typeof value.summary !== "string" ||
    typeof value.imageUrl !== "string"
  ) {
    return null;
  }

  return value as Student;
}

function parseStudentsSnapshot(snapshot: string | null): Student[] {
  if (!snapshot) {
    return [];
  }

  try {
    const parsed = JSON.parse(snapshot);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((candidate) => normalizeStudent(candidate))
      .filter((candidate): candidate is Student => candidate !== null);
  } catch {
    return [];
  }
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
  const portfolioViewsSnapshot = useSyncExternalStore(
    subscribePortfolioViews,
    getPortfolioViewsSnapshot,
    getPortfolioViewsServerSnapshot,
  );
  const kudosSnapshot = useSyncExternalStore(
    subscribeKudos,
    getKudosSnapshot,
    getKudosServerSnapshot,
  );
  const directoryStudentsSnapshot = useSyncExternalStore(
    subscribeDirectoryStudents,
    getDirectoryStudentsSnapshot,
    getDirectoryStudentsServerSnapshot,
  );

  const portfolioViews = useMemo<Record<string, number>>(() => {
    return normalizeCountRecord(portfolioViewsSnapshot);
  }, [portfolioViewsSnapshot]);

  const kudos = useMemo<Record<string, number>>(() => {
    return normalizeCountRecord(kudosSnapshot);
  }, [kudosSnapshot]);

  const directoryStudents = useMemo(() => {
    const cached = parseStudentsSnapshot(directoryStudentsSnapshot);
    return cached;
  }, [directoryStudentsSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

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

        window.localStorage.setItem(
          DIRECTORY_STUDENTS_STORAGE_KEY,
          JSON.stringify(nextStudents),
        );
        window.dispatchEvent(new Event("directory-students-updated"));
      } catch {
        // Keep cached or static students when network request fails.
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const majorOptions = useMemo(() => {
    return Array.from(new Set(directoryStudents.map((student) => student.major))).sort();
  }, [directoryStudents]);

  const updateFilters = (updater: (current: FilterState) => FilterState) => {
    setFilters(updater);
    setPage(1);
  };

  const filteredStudents = useMemo(() => {
    return directoryStudents.filter((student) => {
      const matchesMajor =
        filters.majors.length === 0 || filters.majors.some((major) => student.major === major);
      const matchesAvailability = !filters.availableOnly || student.available;
      const matchesSearchTerm = matchesQuery(student, filters.query);

      return (
        matchesMajor &&
        matchesAvailability &&
        matchesSearchTerm
      );
    });
  }, [directoryStudents, filters]);

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

        if (response.ok) {
          const data = (await response.json()) as StudentMetricsResponse;
          const dbViews = data.metrics?.views;

          if (typeof dbViews === "number" && Number.isFinite(dbViews) && dbViews >= 0) {
            writeMetricToStorage(PORTFOLIO_VIEWS_STORAGE_KEY, studentId, dbViews);
            window.dispatchEvent(new Event("portfolio-views-updated"));
            return;
          }
        }
      } catch {
        // Fall through to local optimistic update when request fails.
      }

      const nextViews = {
        ...portfolioViews,
        [studentId]: (portfolioViews[studentId] ?? 0) + 1,
      };

      window.localStorage.setItem(PORTFOLIO_VIEWS_STORAGE_KEY, JSON.stringify(nextViews));
      window.dispatchEvent(new Event("portfolio-views-updated"));
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

        if (response.ok) {
          const data = (await response.json()) as StudentMetricsResponse;
          const dbKudos = data.metrics?.kudos;

          if (typeof dbKudos === "number" && Number.isFinite(dbKudos) && dbKudos >= 0) {
            writeMetricToStorage(KUDOS_STORAGE_KEY, studentId, dbKudos);
            window.dispatchEvent(new Event("portfolio-kudos-updated"));
            return;
          }
        }
      } catch {
        // Fall through to local optimistic update when request fails.
      }

      const nextKudos = {
        ...kudos,
        [studentId]: (kudos[studentId] ?? 0) + 1,
      };

      window.localStorage.setItem(KUDOS_STORAGE_KEY, JSON.stringify(nextKudos));
      window.dispatchEvent(new Event("portfolio-kudos-updated"));
    })();
  };

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
          onReset={() => { setFilters(initialFilters); setPage(1); }}
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
            Showing {filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"}
          </div>

          {filteredStudents.length > 0 ? (
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
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4 pb-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border border-[var(--color-border-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
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
                className="border border-[var(--color-border-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
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
        onReset={() => { setFilters(initialFilters); setPage(1); }}
      />
    </PageLayout>
  );
}
