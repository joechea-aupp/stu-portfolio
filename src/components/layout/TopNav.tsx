import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import type { ThemeName } from "@/types/student";

interface TopNavProps {
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
}

const navItems = ["Directory", "Portfolios", "Events", "Library"];

export function TopNav({ theme, onThemeChange }: TopNavProps) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#"
          className="font-heading text-[24px] font-bold uppercase tracking-[0.06em] text-[var(--color-accent)]"
        >
          StudentHub
        </a>

        <nav className="ml-4 hidden items-center gap-8 md:flex" aria-label="Primary">
          {navItems.map((item, index) => (
            <a
              key={item}
              href="#"
              className={`border-b-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                index === 0
                  ? "border-[var(--color-accent)] text-[var(--color-text)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
          <button
            type="button"
            className="hidden h-9 items-center border border-[var(--color-border)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] sm:flex"
            aria-label="Notification"
          >
            Bell
          </button>
          <button
            type="button"
            className="hidden h-9 items-center border border-[var(--color-border)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] sm:flex"
            aria-label="Profile"
          >
            User
          </button>
        </div>
      </div>
    </header>
  );
}
