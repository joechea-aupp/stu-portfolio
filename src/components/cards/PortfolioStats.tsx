"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type StudentMetricsResponse = {
  metrics?: {
    views?: number;
    kudos?: number;
  };
};

interface MetricsState {
  views: number;
  kudos: number;
}

interface StudentMetricsUpdatedEvent extends Event {
  detail?: {
    studentId?: string;
    metrics?: {
      views?: number;
      kudos?: number;
    };
  };
}

export function PortfolioStats({
  studentId,
  extraBadge,
}: {
  studentId: string;
  extraBadge?: ReactNode;
}) {
  const [metrics, setMetrics] = useState<MetricsState>({ views: 0, kudos: 0 });

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(`/api/student-metrics?studentId=${encodeURIComponent(studentId)}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as StudentMetricsResponse;
        const dbViews = data.metrics?.views;
        const dbKudos = data.metrics?.kudos;

        setMetrics({
          views:
            typeof dbViews === "number" && Number.isFinite(dbViews) && dbViews >= 0
              ? dbViews
              : 0,
          kudos:
            typeof dbKudos === "number" && Number.isFinite(dbKudos) && dbKudos >= 0
              ? dbKudos
              : 0,
        });
      } catch {
        // Keep current UI state when metrics fetch fails.
      }
    })();

    const onMetricsUpdated = (event: Event) => {
      const detail = (event as StudentMetricsUpdatedEvent).detail;
      if (!detail || detail.studentId !== studentId) {
        return;
      }

      setMetrics((current) => ({
        views:
          typeof detail.metrics?.views === "number" && Number.isFinite(detail.metrics.views)
            ? detail.metrics.views
            : current.views,
        kudos:
          typeof detail.metrics?.kudos === "number" && Number.isFinite(detail.metrics.kudos)
            ? detail.metrics.kudos
            : current.kudos,
      }));
    };

    window.addEventListener("student-metrics-updated", onMetricsUpdated);

    return () => {
      controller.abort();
      window.removeEventListener("student-metrics-updated", onMetricsUpdated);
    };
  }, [studentId]);

  return (
    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--color-brand)]">
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1">
        <span aria-hidden="true">♥</span>
        {metrics.kudos}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
          <path d="M12 5C5.2 5 1.2 11 1 11.3a1 1 0 0 0 0 1.4C1.2 13 5.2 19 12 19s10.8-6 11-6.3a1 1 0 0 0 0-1.4C22.8 11 18.8 5 12 5Zm0 12c-4.9 0-8.2-3.9-9-5 .8-1.1 4.1-5 9-5s8.2 3.9 9 5c-.8 1.1-4.1 5-9 5Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        {metrics.views}
      </span>
      {extraBadge}
    </div>
  );
}
