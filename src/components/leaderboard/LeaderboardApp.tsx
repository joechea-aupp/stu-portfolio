"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import type { Student } from "@/types/student";

const LEADERBOARD_LIMIT = 10;

type LeaderboardMetric = "verified" | "views" | "kudos";

interface LeaderboardRow {
  student: Student;
  verifiedAchievements: number;
  views: number;
  kudos: number;
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

function getMetricValue(row: LeaderboardRow, metric: LeaderboardMetric) {
  if (metric === "views") return row.views;
  if (metric === "kudos") return row.kudos;
  return row.verifiedAchievements;
}

function sortLeaderboardRows(rows: LeaderboardRow[], metric: LeaderboardMetric) {
  return [...rows].sort((a, b) => {
    const primary = getMetricValue(b, metric) - getMetricValue(a, metric);
    if (primary !== 0) return primary;

    const verifiedTieBreaker = b.verifiedAchievements - a.verifiedAchievements;
    if (verifiedTieBreaker !== 0) return verifiedTieBreaker;

    const viewsTieBreaker = b.views - a.views;
    if (viewsTieBreaker !== 0) return viewsTieBreaker;

    const kudosTieBreaker = b.kudos - a.kudos;
    if (kudosTieBreaker !== 0) return kudosTieBreaker;

    return a.student.name.localeCompare(b.student.name);
  });
}

function metricButtonClass(currentMetric: LeaderboardMetric, metric: LeaderboardMetric) {
  return currentMetric === metric
    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
    : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-brand)] hover:bg-[var(--color-bg)]";
}

export function LeaderboardApp() {
  const [metric, setMetric] = useState<LeaderboardMetric>("verified");
  const [students, setStudents] = useState<Student[]>([]);

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
        // Keep current UI when request fails.
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const entries = useMemo<LeaderboardRow[]>(() => {
    return students.map((student) => ({
      student,
      verifiedAchievements: student.achievements.filter((item) => item.verifiedBy).length,
      views: student.viewCount,
      kudos: student.kudoCount,
    }));
  }, [students]);

  const rows = useMemo<LeaderboardRow[]>(() => {
    return sortLeaderboardRows(entries, metric).slice(0, LEADERBOARD_LIMIT);
  }, [entries, metric]);

  const topVerifiedRow = useMemo(() => sortLeaderboardRows(entries, "verified")[0] ?? null, [entries]);
  const topKudoRow = useMemo(() => sortLeaderboardRows(entries, "kudos")[0] ?? null, [entries]);
  const topViewedRow = useMemo(() => sortLeaderboardRows(entries, "views")[0] ?? null, [entries]);

  return (
    <PageLayout
      width="xl"
      className="py-6 text-[var(--color-text)]"
      containerClassName="border-x border-[var(--color-border)]"
    >
      <section className="border-[3px] border-[var(--color-brand)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-bg)] to-[var(--color-surface)] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Student ranking board
        </p>
        <h1 className="mt-2 font-heading text-[42px] uppercase leading-[0.9] text-[var(--color-brand)] sm:text-[54px]">
          Leaderboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Ranked by top verified achievements by default. Switch the filter to sort by portfolio views
          or kudos.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMetric("verified")}
            className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${metricButtonClass(metric, "verified")}`}
            aria-pressed={metric === "verified"}
          >
            Top Verified
          </button>
          <button
            type="button"
            onClick={() => setMetric("views")}
            className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${metricButtonClass(metric, "views")}`}
            aria-pressed={metric === "views"}
          >
            Top Views
          </button>
          <button
            type="button"
            onClick={() => setMetric("kudos")}
            className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${metricButtonClass(metric, "kudos")}`}
            aria-pressed={metric === "kudos"}
          >
            Top Kudos
          </button>
        </div>
      </section>

      <section className="mt-4 border-[3px] border-[var(--color-brand)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-bg)] to-[var(--color-surface)] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Top verified achievement
            </p>
            <p className="mt-1 truncate font-heading text-[30px] uppercase leading-[0.95] text-[var(--color-brand)] sm:text-[38px]">
              {topVerifiedRow ? topVerifiedRow.student.name : "None yet"}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Verified: {topVerifiedRow ? topVerifiedRow.verifiedAchievements : 0}
            </p>
          </div>
          <div className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Top kudo
            </p>
            <p className="mt-1 truncate font-heading text-[30px] uppercase leading-[0.95] text-[var(--color-brand)] sm:text-[38px]">
              {topKudoRow ? topKudoRow.student.name : "None yet"}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Kudos: {topKudoRow ? topKudoRow.kudos : 0}
            </p>
          </div>
          <div className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Top view
            </p>
            <p className="mt-1 truncate font-heading text-[30px] uppercase leading-[0.95] text-[var(--color-brand)] sm:text-[38px]">
              {topViewedRow ? topViewedRow.student.name : "None yet"}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Views: {topViewedRow ? topViewedRow.views : 0}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-strong)] bg-[var(--color-bg)]">
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">Rank</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">Student</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">Verified</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">Views</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">Kudos</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">Profile</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isTopRank = index === 0;

                return (
                  <tr
                    key={row.student.id}
                    className={`border-b border-[var(--color-border)] last:border-b-0 ${
                      isTopRank ? "bg-[color-mix(in_oklab,var(--color-accent)_10%,white)]" : ""
                    }`}
                  >
                    <td className="px-3 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-brand)] sm:px-4">
                      #{index + 1}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <p className="font-semibold text-[var(--color-text)]">{row.student.name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        {row.student.major}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-[var(--color-text)] sm:px-4">
                      {row.verifiedAchievements}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-[var(--color-text)] sm:px-4">{row.views}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-[var(--color-text)] sm:px-4">{row.kudos}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <Link
                        href={`/students/${row.student.id}`}
                        className="inline-block border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PageLayout>
  );
}
