"use client";

import { useSyncExternalStore } from "react";

const PORTFOLIO_VIEWS_STORAGE_KEY = "portfolio-views";
const KUDOS_STORAGE_KEY = "portfolio-kudos";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("portfolio-views-updated", onStoreChange);
  window.addEventListener("portfolio-kudos-updated", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("portfolio-views-updated", onStoreChange);
    window.removeEventListener("portfolio-kudos-updated", onStoreChange);
  };
}

function getCount(key: string, id: string): number {
  try {
    const raw = window.localStorage.getItem(key) ?? "{}";
    const parsed = JSON.parse(raw);
    const val = parsed?.[id];
    return typeof val === "number" && Number.isFinite(val) && val >= 0 ? val : 0;
  } catch {
    return 0;
  }
}

function useStorageCount(key: string, id: string): number {
  return useSyncExternalStore(
    subscribe,
    () => getCount(key, id),
    () => 0,
  );
}

export function PortfolioStats({ studentId }: { studentId: string }) {
  const views = useStorageCount(PORTFOLIO_VIEWS_STORAGE_KEY, studentId);
  const kudos = useStorageCount(KUDOS_STORAGE_KEY, studentId);

  return (
    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--color-brand)]">
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1">
        <span aria-hidden="true">♥</span>
        {kudos}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
          <path d="M12 5C5.2 5 1.2 11 1 11.3a1 1 0 0 0 0 1.4C1.2 13 5.2 19 12 19s10.8-6 11-6.3a1 1 0 0 0 0-1.4C22.8 11 18.8 5 12 5Zm0 12c-4.9 0-8.2-3.9-9-5 .8-1.1 4.1-5 9-5s8.2 3.9 9 5c-.8 1.1-4.1 5-9 5Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        {views}
      </span>
    </div>
  );
}
