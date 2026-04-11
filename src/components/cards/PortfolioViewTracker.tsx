"use client";

import { useEffect } from "react";

const VIEW_DEBOUNCE_WINDOW_MS = 15_000;
const trackedAtByStudent = new Map<string, number>();

type StudentMetricsResponse = {
  metrics?: {
    views?: number;
    kudos?: number;
  };
};

export function PortfolioViewTracker({ studentId }: { studentId: string }) {
  useEffect(() => {
    const lastTrackedAt = trackedAtByStudent.get(studentId) ?? 0;

    if (
      Number.isFinite(lastTrackedAt) &&
      lastTrackedAt > 0 &&
      Date.now() - lastTrackedAt < VIEW_DEBOUNCE_WINDOW_MS
    ) {
      return;
    }

    const controller = new AbortController();

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
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as StudentMetricsResponse;
        const dbViews = data.metrics?.views;

        if (typeof dbViews === "number" && Number.isFinite(dbViews) && dbViews >= 0) {
          trackedAtByStudent.set(studentId, Date.now());
          window.dispatchEvent(
            new CustomEvent("student-metrics-updated", {
              detail: {
                studentId,
                metrics: {
                  views: dbViews,
                  kudos: data.metrics?.kudos,
                },
              },
            }),
          );
        }
      } catch {
        // Ignore network errors.
      }
    })();

    return () => {
      controller.abort();
    };
  }, [studentId]);

  return null;
}
