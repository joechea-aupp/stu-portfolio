"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import type { ThemeName } from "@/types/student";

const navItems = [
  { label: "Directory", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
];

const defaultTheme: ThemeName = "classic";

export function TopNav({ initialKnownSession }: { initialKnownSession: boolean }) {
  const pathname = usePathname();
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null);
  const [wasLoggedIn, setWasLoggedIn] = useState(initialKnownSession);

  useLayoutEffect(() => {
    function syncKnownSession() {
      setWasLoggedIn(window.localStorage.getItem("session-known") === "true");
    }

    syncKnownSession();
    window.addEventListener("auth-state-changed", syncKnownSession);

    return () => {
      window.removeEventListener("auth-state-changed", syncKnownSession);
    };
  }, []);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
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
    if (!accountMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (isMounted) {
        setAuthLoading(true);
      }

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
            id?: number;
            name?: string;
          };
        };

        if (payload.user?.id && payload.user?.name) {
          setCurrentUser({ id: payload.user.id, name: payload.user.name });
          window.localStorage.setItem("session-known", "true");
        } else {
          setCurrentUser(null);
          window.localStorage.setItem("session-known", "false");
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
          window.localStorage.setItem("session-known", "false");
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
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      window.localStorage.setItem("session-known", "false");
      window.dispatchEvent(new Event("auth-state-changed"));
      setAccountMenuOpen(false);
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
                prefetch={false}
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
            wasLoggedIn ? (
              <div className="h-9 w-28 animate-pulse bg-[var(--color-border)]" aria-hidden="true" />
            ) : (
              <>
                <div className="hidden sm:block h-9 w-16 animate-pulse bg-[var(--color-border)]" aria-hidden="true" />
                <div className="h-9 w-28 animate-pulse bg-[var(--color-border)]" aria-hidden="true" />
              </>
            )
          ) : currentUser ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
                className="inline-flex h-9 items-center gap-2 border border-[var(--color-border)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <span className="hidden sm:inline">{currentUser.name}</span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 fill-none stroke-current stroke-[1.8]"
                >
                  <circle cx="12" cy="8" r="3.25" />
                  <path d="M5.5 19c1.9-3.3 4.1-4.95 6.5-4.95S16.6 15.7 18.5 19" strokeLinecap="round" />
                </svg>
                <span className="sr-only">Account</span>
              </button>

              {accountMenuOpen ? (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-20 flex w-[240px] flex-col gap-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                  role="menu"
                  aria-label="Account options"
                >
                  <div className="border-b border-[var(--color-border)] pb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                      Signed in
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{currentUser.name}</p>
                  </div>

                  <Link
                    href="/onboard/profile"
                    role="menuitem"
                    className="inline-flex h-9 items-center justify-center border border-[var(--color-border-strong)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    Edit portfolio
                  </Link>

                  <ThemeSwitcher theme={theme} onThemeChange={setTheme} layout="stacked" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    role="menuitem"
                    className="inline-flex h-9 items-center justify-center border border-[var(--color-border)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
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
        </div>
      </div>
    </header>
  );
}
