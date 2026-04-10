"use client";

import { useEffect, useMemo, useState } from "react";
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

const PAGE_SIZE = 2;

const defaultTheme: ThemeName = "classic";

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

          {filteredStudents.length > 0 ? (
            <StudentGrid students={paginatedStudents} />
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
