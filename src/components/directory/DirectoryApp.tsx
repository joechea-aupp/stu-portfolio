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

  const toggleListValue = <T extends string>(currentValues: T[], value: T): T[] => {
    return currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
  };

  const toggleMajor = (major: string) => {
    setFilters((current) => ({
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
            setFilters((current) => ({ ...current, availableOnly }))
          }
          onReset={() => setFilters(initialFilters)}
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
            onChange={(query) => setFilters((current) => ({ ...current, query }))}
          />

          <div className="pt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Showing {filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"}
          </div>

          {filteredStudents.length > 0 ? (
            <StudentGrid students={filteredStudents} />
          ) : (
            <div className="mt-8 border-[3px] border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
              <p className="font-heading text-4xl uppercase text-[var(--color-brand)]">No students found</p>
              <p className="mt-3 text-sm uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Try broadening your filters.
              </p>
            </div>
          )}
        </main>
      </div>

      <Footer />

      <MobileFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        filters={filters}
        onToggleMajor={toggleMajor}
        onAvailabilityChange={(availableOnly) =>
          setFilters((current) => ({ ...current, availableOnly }))
        }
        onReset={() => setFilters(initialFilters)}
      />
    </div>
  );
}
