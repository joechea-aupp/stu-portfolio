"use client";

import type { ThemeName } from "@/types/student";

interface ThemeSwitcherProps {
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  layout?: "inline" | "stacked";
}

const themes: { value: ThemeName; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "slate", label: "Slate" },
  { value: "sunrise", label: "Sunrise" },
];

export function ThemeSwitcher({ theme, onThemeChange, layout = "inline" }: ThemeSwitcherProps) {
  const isStacked = layout === "stacked";

  return (
    <label
      className={
        isStacked
          ? "flex w-full flex-col gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          : "flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
      }
    >
      Theme
      <select
        value={theme}
        onChange={(event) => onThemeChange(event.target.value as ThemeName)}
        className={
          isStacked
            ? "h-9 w-full rounded-none border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text)] outline-none"
            : "h-8 rounded-none border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text)] outline-none"
        }
        aria-label="Select theme"
      >
        {themes.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
