"use client";

import { useEffect, useMemo, useSyncExternalStore, useState } from "react";
import { students } from "@/data/students";
import type { FilterState, Student, ThemeName } from "@/types/student";
import { TopNav } from "@/components/layout/TopNav";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { DirectoryHero } from "@/components/hero/DirectoryHero";
import { DirectorySearch } from "@/components/search/DirectorySearch";
import { StudentGrid } from "@/components/cards/StudentGrid";
import { Footer } from "@/components/layout/Footer";
import { MobileFilterDrawer } from "@/components/filters/MobileFilterDrawer";

const initialFilters: FilterState = {
  query: "",
  majors: [],
  availableOnly: false,
};

const PAGE_SIZE = 5;
const PORTFOLIO_VIEWS_STORAGE_KEY = "portfolio-views";
const KUDOS_STORAGE_KEY = "portfolio-kudos";

const defaultTheme: ThemeName = "classic";

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
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const stored = window.localStorage.getItem("directory-theme");
    return stored === "classic" || stored === "slate" || stored === "sunrise"
      ? stored
      : defaultTheme;
  });
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

  const portfolioViews = useMemo<Record<string, number>>(() => {
    return normalizeCountRecord(portfolioViewsSnapshot);
  }, [portfolioViewsSnapshot]);

  const kudos = useMemo<Record<string, number>>(() => {
    return normalizeCountRecord(kudosSnapshot);
  }, [kudosSnapshot]);

  const updateFilters = (updater: (current: FilterState) => FilterState) => {
    setFilters(updater);
    setPage(1);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("directory-theme", theme);
  }, [theme]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
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
  }, [filters]);

  const totalPortfolioViews = useMemo(() => {
    return students.reduce((total, student) => total + (portfolioViews[student.id] ?? 0), 0);
  }, [portfolioViews]);

  const totalKudos = useMemo(() => {
    return students.reduce((total, student) => total + (kudos[student.id] ?? 0), 0);
  }, [kudos]);

  const maxPortfolioViews = useMemo(() => {
    return students.reduce((max, student) => Math.max(max, portfolioViews[student.id] ?? 0), 0);
  }, [portfolioViews]);

  const maxKudos = useMemo(() => {
    return students.reduce((max, student) => Math.max(max, kudos[student.id] ?? 0), 0);
  }, [kudos]);

  const topViewedStudent = useMemo(() => {
    return students.reduce<Student | null>((top, student) => {
      if (!top) {
        return student;
      }
      return (portfolioViews[student.id] ?? 0) > (portfolioViews[top.id] ?? 0) ? student : top;
    }, null);
  }, [portfolioViews]);

  const topKudoedStudent = useMemo(() => {
    return students.reduce<Student | null>((top, student) => {
      if (!top) {
        return student;
      }
      return (kudos[student.id] ?? 0) > (kudos[top.id] ?? 0) ? student : top;
    }, null);
  }, [kudos]);

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
    const nextViews = {
      ...portfolioViews,
      [studentId]: (portfolioViews[studentId] ?? 0) + 1,
    };

    window.localStorage.setItem(PORTFOLIO_VIEWS_STORAGE_KEY, JSON.stringify(nextViews));
    window.dispatchEvent(new Event("portfolio-views-updated"));
  };

  const handleGiveKudo = (studentId: string) => {
    const nextKudos = {
      ...kudos,
      [studentId]: (kudos[studentId] ?? 0) + 1,
    };

    window.localStorage.setItem(KUDOS_STORAGE_KEY, JSON.stringify(nextKudos));
    window.dispatchEvent(new Event("portfolio-kudos-updated"));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <TopNav theme={theme} onThemeChange={setTheme} />

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 border-x border-[var(--color-border)]">
        <FilterSidebar
          filters={filters}
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

          <section className="mt-4 border-[3px] border-[var(--color-brand)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-bg)] to-[var(--color-surface)] p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Total kudos</p>
                <p className="mt-1 font-heading text-3xl uppercase leading-none text-[var(--color-brand)]">{totalKudos}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">Portfolio views: {totalPortfolioViews}</p>
              </div>
              <div className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Most prestige</p>
                <p className="mt-1 truncate font-heading text-xl uppercase leading-none text-[var(--color-brand)]">
                  {topKudoedStudent ? topKudoedStudent.name : "None yet"}
                </p>
                <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">Top views: {topViewedStudent ? topViewedStudent.name : "None yet"}</p>
              </div>
              <div className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Leading kudos</p>
                <p className="mt-1 font-heading text-3xl uppercase leading-none text-[var(--color-accent)]">{maxKudos}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">Leading views: {maxPortfolioViews}</p>
              </div>
            </div>
          </section>

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
          )}        </main>
      </div>

      <Footer />

      <MobileFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        filters={filters}
        onToggleMajor={toggleMajor}
        onAvailabilityChange={(availableOnly) =>
          updateFilters((current) => ({ ...current, availableOnly }))
        }
        onReset={() => { setFilters(initialFilters); setPage(1); }}
      />
    </div>
  );
}
