"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
    userType: "STUDENT" | "ADMINISTRATION";
    permissions: string[];
  } | null>(null);
  const [wasLoggedIn, setWasLoggedIn] = useState(initialKnownSession);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationBusyId, setNotificationBusyId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{
      id: number;
      student: { id: number; name: string };
      achievement: { title: string; period: string; details: string } | null;
      requestedAt: string;
    }>
  >([]);

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
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
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
    if (!accountMenuOpen && !notificationOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }

      if (!notificationPanelRef.current?.contains(event.target as Node)) {
        setNotificationOpen(false);
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
  }, [accountMenuOpen, notificationOpen]);

  useEffect(() => {
    setAccountMenuOpen(false);
    setNotificationOpen(false);
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
            userType?: "STUDENT" | "ADMINISTRATION";
            permissions?: string[];
          };
        };

        if (payload.user?.id && payload.user?.name) {
          setCurrentUser({
            id: payload.user.id,
            name: payload.user.name,
            userType: payload.user.userType === "ADMINISTRATION" ? "ADMINISTRATION" : "STUDENT",
            permissions: payload.user.permissions ?? [],
          });
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
      setNotificationOpen(false);
      setCurrentUser(null);
      window.location.href = "/";
    }
  }

  const canVerifyAchievements =
    currentUser?.userType === "ADMINISTRATION" &&
    currentUser.permissions.includes("achievements.verify");

  const loadPendingCount = useCallback(async () => {
    if (!canVerifyAchievements) {
      setPendingCount(0);
      return;
    }

    try {
      const response = await fetch("/api/administration/achievement-verifications/count", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setPendingCount(0);
        return;
      }

      const payload = (await response.json()) as { pendingCount?: number };
      setPendingCount(typeof payload.pendingCount === "number" ? payload.pendingCount : 0);
    } catch {
      setPendingCount(0);
    }
  }, [canVerifyAchievements]);

  const loadNotifications = useCallback(async () => {
    if (!canVerifyAchievements) {
      setNotifications([]);
      return;
    }

    setNotificationLoading(true);

    try {
      const response = await fetch("/api/administration/achievement-verifications?status=PENDING&limit=8", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      const payload = (await response.json()) as {
        requests?: Array<{
          id: number;
          student: { id: number; name: string };
          achievement: { title: string; period: string; details: string } | null;
          requestedAt: string;
        }>;
      };

      setNotifications(payload.requests ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  }, [canVerifyAchievements]);

  async function runNotificationAction(requestId: number, action: "approve" | "reject") {
    const rejectionReason =
      action === "reject"
        ? window.prompt("Enter rejection reason", "Insufficient supporting evidence.")?.trim() ?? ""
        : "";

    if (action === "reject" && !rejectionReason) {
      return;
    }

    setNotificationBusyId(requestId);

    try {
      await fetch("/api/administration/achievement-verifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          action,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });
    } finally {
      setNotificationBusyId(null);
      await loadNotifications();
      await loadPendingCount();
    }
  }

  useEffect(() => {
    if (!canVerifyAchievements) {
      setPendingCount(0);
      setNotifications([]);
      return;
    }

    void loadPendingCount();
  }, [canVerifyAchievements, loadPendingCount, pathname]);

  useEffect(() => {
    if (!notificationOpen || !canVerifyAchievements) {
      return;
    }

    void loadNotifications();
    void loadPendingCount();
  }, [canVerifyAchievements, loadNotifications, loadPendingCount, notificationOpen]);

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
            <div className="relative flex items-center gap-2" ref={accountMenuRef}>
              {canVerifyAchievements ? (
                <div className="relative flex shrink-0" ref={notificationPanelRef}>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen((open) => !open)}
                    aria-expanded={notificationOpen}
                    aria-haspopup="menu"
                    aria-label="Open achievement verification notifications"
                    className="relative inline-flex h-9 w-9 items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
                      <path d="M6.5 10.25a5.5 5.5 0 1111 0v4.08l1.06 1.98c.28.52-.08 1.19-.67 1.19H5.11c-.59 0-.95-.67-.67-1.19L5.5 14.33v-4.08z" />
                      <path d="M10 19.5a2 2 0 004 0" strokeLinecap="round" />
                    </svg>
                    {pendingCount > 0 ? (
                      <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[9px] font-bold text-white">
                        {pendingCount > 9 ? "9+" : pendingCount}
                      </span>
                    ) : null}
                  </button>

                  {notificationOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-[340px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                          Verification requests
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            void loadNotifications();
                            void loadPendingCount();
                          }}
                          className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                        >
                          Refresh
                        </button>
                      </div>

                      {notificationLoading ? (
                        <p className="text-xs text-[var(--color-text-muted)]">Loading...</p>
                      ) : notifications.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-muted)]">No pending requests.</p>
                      ) : (
                        <div className="max-h-[360px] space-y-2 overflow-y-auto">
                          {notifications.map((request) => (
                            <div key={request.id} className="border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
                              <p className="text-[11px] font-semibold text-[var(--color-text)]">{request.student.name}</p>
                              <p className="text-[11px] text-[var(--color-text-muted)]">{request.achievement?.title ?? "Achievement missing"}</p>
                              <p className="text-[10px] text-[var(--color-text-muted)]">{request.achievement?.period ?? "-"}</p>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  disabled={notificationBusyId === request.id}
                                  onClick={() => void runNotificationAction(request.id, "approve")}
                                  className="flex-1 border border-emerald-600 bg-emerald-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={notificationBusyId === request.id}
                                  onClick={() => void runNotificationAction(request.id, "reject")}
                                  className="flex-1 border border-rose-600 bg-rose-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Link
                        href="/onboard/administration?tab=achievements"
                        className="mt-3 inline-flex w-full items-center justify-center border border-[var(--color-border-strong)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      >
                        Open full review queue
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
                className="inline-flex h-9 shrink-0 items-center gap-2 border border-[var(--color-border)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
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
                    href={currentUser.userType === "ADMINISTRATION" ? "/onboard/administration" : "/onboard/profile"}
                    role="menuitem"
                    className="inline-flex h-9 items-center justify-center border border-[var(--color-border-strong)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    Edit profile
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
