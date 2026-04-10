"use client";

import type { ThemeName } from "@/types/student";

interface ThemeSwitcherProps {
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
}

const themes: { value: ThemeName; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "slate", label: "Slate" },
  { value: "sunrise", label: "Sunrise" },
];

export function ThemeSwitcher({ theme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
      Theme
      <select
        value={theme}
        onChange={(event) => onThemeChange(event.target.value as ThemeName)}
        className="h-8 rounded-none border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text)] outline-none"
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
