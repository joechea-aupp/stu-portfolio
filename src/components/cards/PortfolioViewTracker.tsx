"use client";

import { useEffect } from "react";

const PORTFOLIO_VIEWS_STORAGE_KEY = "portfolio-views";
const VIEW_DEBOUNCE_WINDOW_MS = 15_000;

type StudentMetricsResponse = {
  metrics?: {
    views?: number;
  };
};

function writeStorageView(studentId: string, value: number) {
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_VIEWS_STORAGE_KEY) ?? "{}";
    const parsed = JSON.parse(raw);
    const current = parsed && typeof parsed === "object" ? parsed : {};
    const next = {
      ...current,
      [studentId]: value,
    };

    window.localStorage.setItem(PORTFOLIO_VIEWS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("portfolio-views-updated"));
  } catch {
    // Ignore storage failures.
  }
}

export function PortfolioViewTracker({ studentId }: { studentId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sessionKey = `portfolio-view-tracker:${studentId}`;
    const lastTrackedAtRaw = window.sessionStorage.getItem(sessionKey);
    const lastTrackedAt = lastTrackedAtRaw ? Number.parseInt(lastTrackedAtRaw, 10) : 0;

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
          writeStorageView(studentId, dbViews);
          window.sessionStorage.setItem(sessionKey, String(Date.now()));
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
