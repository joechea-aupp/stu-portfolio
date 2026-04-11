"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import type { ThemeName } from "@/types/student";

const navItems = [
  { label: "Directory", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
];

const defaultTheme: ThemeName = "classic";

export function TopNav() {
  const pathname = usePathname();
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const stored = window.localStorage.getItem("directory-theme");
    return stored === "classic" || stored === "slate" || stored === "sunrise"
      ? stored
      : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("directory-theme", theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
        });

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        const payload = (await response.json()) as {
          user?: {
            name?: string;
          };
        };

        if (payload.user?.name) {
          setCurrentUser({ name: payload.user.name });
        } else {
          setCurrentUser(null);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setCurrentUser(null);
      window.location.href = "/";
    }
  }

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-heading text-[24px] font-bold uppercase tracking-[0.06em] text-[var(--color-accent)]"
        >
          StudentHub
        </Link>

        <nav className="ml-4 hidden items-center gap-8 md:flex" aria-label="Primary">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`border-b-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isActive
                    ? "border-[var(--color-accent)] text-[var(--color-text)]"
                    : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {authLoading ? (
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] sm:block">
              Checking session
            </span>
          ) : currentUser ? (
            <>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] sm:block">
                Logged in as {currentUser.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="h-9 items-center border border-[var(--color-border)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="h-9 items-center border border-[var(--color-border)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hidden sm:inline-flex"
              >
                Login
              </Link>
              <Link
                href="/create-account"
                className="h-9 items-center border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)] inline-flex"
              >
                Create account
              </Link>
            </>
          )}
          <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
        </div>
      </div>
    </header>
  );
}
