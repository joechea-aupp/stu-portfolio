"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ManagedUserType = "STUDENT" | "ADMINISTRATION";

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  userType: ManagedUserType;
  isActive: boolean;
  hasProfile: boolean;
  createdAt: string;
}

interface ApiPayload {
  users?: ManagedUser[];
  updated?: ManagedUser;
  currentUserId?: number;
  error?: string;
}

interface EditDraft {
  name: string;
  email: string;
  userType: ManagedUserType;
}

interface PasswordResetDraft {
  password: string;
  confirmPassword: string;
}

interface AdministrationUserManagerProps {
  className?: string;
}

export function AdministrationUserManager({ className }: AdministrationUserManagerProps) {
  const USERS_PER_PAGE = 8;
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [resettingUserId, setResettingUserId] = useState<number | null>(null);
  const [passwordResetDraft, setPasswordResetDraft] = useState<PasswordResetDraft | null>(null);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedUsers = useMemo(
    () => users.slice().sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))),
    [users],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) {
      return sortedUsers;
    }

    return sortedUsers.filter((user) => {
      const searchable = [
        String(user.id),
        user.name,
        user.email,
        user.userType,
        user.isActive ? "enabled" : "disabled",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [normalizedSearch, sortedUsers]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, page, USERS_PER_PAGE]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/users", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok) {
        setFeedback(payload.error ?? "Unable to load users.");
        setUsers([]);
        return;
      }

      setUsers(payload.users ?? []);
      setPage(1);
      setCurrentUserId(typeof payload.currentUserId === "number" ? payload.currentUserId : null);
    } catch {
      setFeedback("Unable to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function patchUserInState(updatedUser: ManagedUser) {
    setUsers((current) => current.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)));
  }

  async function runAction(input: Record<string, unknown>): Promise<boolean> {
    const targetId = typeof input.userId === "number" ? input.userId : null;
    if (!targetId) {
      return false;
    }

    setBusyUserId(targetId);
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const payload = (await response.json()) as ApiPayload;

      if (!response.ok) {
        setFeedback(payload.error ?? "Request failed.");
        return false;
      }

      if (payload.updated) {
        patchUserInState(payload.updated);
      }

      setFeedback("Update completed.");
      return true;
    } catch {
      setFeedback("Request failed.");
      return false;
    } finally {
      setBusyUserId(null);
    }
  }

  function startEdit(user: ManagedUser) {
    setResettingUserId(null);
    setPasswordResetDraft(null);
    setPasswordResetError(null);
    setEditingUserId(user.id);
    setEditDraft({
      name: user.name,
      email: user.email,
      userType: user.userType,
    });
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditDraft(null);
  }

  function startResetPassword(userId: number) {
    setEditingUserId(null);
    setEditDraft(null);
    setResettingUserId(userId);
    setPasswordResetDraft({
      password: "",
      confirmPassword: "",
    });
    setPasswordResetError(null);
  }

  function cancelResetPassword() {
    setResettingUserId(null);
    setPasswordResetDraft(null);
    setPasswordResetError(null);
  }

  async function submitEdit(userId: number) {
    if (!editDraft) {
      return;
    }

    const didUpdate = await runAction({
      userId,
      action: "edit",
      name: editDraft.name,
      email: editDraft.email,
      userType: editDraft.userType,
    });

    if (didUpdate) {
      cancelEdit();
    }
  }

  async function submitPasswordReset() {
    if (resettingUserId === null || !passwordResetDraft) {
      return;
    }

    const password = passwordResetDraft.password.trim();
    const confirmPassword = passwordResetDraft.confirmPassword.trim();

    if (!password || !confirmPassword) {
      setPasswordResetError("Please enter and confirm the password.");
      return;
    }

    if (password.length < 8) {
      setPasswordResetError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordResetError("Passwords do not match.");
      return;
    }

    setPasswordResetError(null);

    const didUpdate = await runAction({
      userId: resettingUserId,
      action: "resetPassword",
      newPassword: password,
    });

    if (didUpdate) {
      cancelResetPassword();
    }
  }

  return (
    <>
      <section className={`${className ?? "mt-12"} border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg uppercase tracking-[0.08em] text-[var(--color-text)]">Users</h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Enable, disable, edit profile fields, and reset passwords.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadUsers()}
          className="border border-[var(--color-border-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="grid min-w-[240px] flex-1 max-w-md gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Search users
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="Search by id, name, email, type, or status"
          />
        </label>

        {normalizedSearch ? (
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {filteredUsers.length} result{filteredUsers.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      {feedback ? (
        <p className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          {feedback}
        </p>
      ) : null}

      {loading ? (
        <UserTableSkeleton />
      ) : sortedUsers.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">No users found.</p>
      ) : filteredUsers.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">No users match your search.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto border border-[var(--color-border)]">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="bg-[var(--color-bg)]">
                <tr>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">ID</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Name</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Email</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Type</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Status</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Profile</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Created</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const isBusy = busyUserId === user.id;

                  return (
                    <tr key={user.id} className="border-t border-[var(--color-border)] align-top">
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{user.id}</td>
                      <td className="px-3 py-2 text-[var(--color-text)]">{user.name}</td>
                      <td className="px-3 py-2 text-[var(--color-text)]">{user.email}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                            user.userType === "ADMINISTRATION"
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : "border-violet-200 bg-violet-50 text-violet-700"
                          }`}
                        >
                          {user.userType}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                            user.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {user.isActive ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                            user.hasProfile
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {user.hasProfile ? "Complete" : "Missing"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isBusy || busyUserId !== null || resettingUserId !== null}
                            onClick={() => startEdit(user)}
                            className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || (user.isActive && user.id === currentUserId)}
                            onClick={() =>
                              void runAction({
                                userId: user.id,
                                action: user.isActive ? "disable" : "enable",
                              })
                            }
                            className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                          >
                            {user.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || busyUserId !== null || editingUserId !== null}
                            onClick={() => startResetPassword(user.id)}
                            className="border border-[var(--color-accent)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-50"
                          >
                            Reset password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 ? (
            <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pb-1 pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="border border-[var(--color-border-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:pointer-events-none disabled:opacity-30"
              >
                ← Prev
              </button>

              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                Page {page} of {pageCount}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={page === pageCount}
                className="border border-[var(--color-border-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:pointer-events-none disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          ) : null}
        </>
      )}
      </section>

      {editingUserId !== null && editDraft ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && busyUserId !== editingUserId) {
              cancelEdit();
            }
          }}
          role="presentation"
        >
          <div className="w-full max-w-xl border-[2px] border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-base uppercase tracking-[0.08em] text-[var(--color-text)]">Edit user</h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Update name, email, and type.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={busyUserId === editingUserId}
                className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Name</span>
                <input
                  value={editDraft.name}
                  onChange={(e) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            name: e.target.value,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  placeholder="Name"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Email</span>
                <input
                  value={editDraft.email}
                  onChange={(e) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            email: e.target.value,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  placeholder="Email"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Type</span>
                <select
                  value={editDraft.userType}
                  onChange={(e) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            userType: e.target.value as ManagedUserType,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMINISTRATION">ADMINISTRATION</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={busyUserId === editingUserId}
                className="border border-[var(--color-border-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitEdit(editingUserId)}
                disabled={busyUserId === editingUserId}
                className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)] disabled:opacity-40"
              >
                {busyUserId === editingUserId ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resettingUserId !== null && passwordResetDraft ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && busyUserId !== resettingUserId) {
              cancelResetPassword();
            }
          }}
          role="presentation"
        >
          <div className="w-full max-w-lg border-[2px] border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-base uppercase tracking-[0.08em] text-[var(--color-text)]">Reset password</h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Enter and confirm a new password.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelResetPassword}
                disabled={busyUserId === resettingUserId}
                className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">New password</span>
                <input
                  type="password"
                  value={passwordResetDraft.password}
                  onChange={(e) =>
                    setPasswordResetDraft((current) =>
                      current
                        ? {
                            ...current,
                            password: e.target.value,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  placeholder="Minimum 8 characters"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Confirm password</span>
                <input
                  type="password"
                  value={passwordResetDraft.confirmPassword}
                  onChange={(e) =>
                    setPasswordResetDraft((current) =>
                      current
                        ? {
                            ...current,
                            confirmPassword: e.target.value,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  placeholder="Re-enter password"
                />
              </label>
            </div>

            {passwordResetError ? (
              <p className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                {passwordResetError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelResetPassword}
                disabled={busyUserId === resettingUserId}
                className="border border-[var(--color-border-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitPasswordReset()}
                disabled={busyUserId === resettingUserId}
                className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)] disabled:opacity-40"
              >
                {busyUserId === resettingUserId ? "Saving..." : "Confirm reset"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function UserTableSkeleton() {
  const rows = Array.from({ length: 7 });

  return (
    <div className="mt-4 overflow-x-auto border border-[var(--color-border)]">
      <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
        <thead className="bg-[var(--color-bg)]">
          <tr>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">ID</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Name</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Email</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Type</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Status</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Profile</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Created</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((_, index) => (
            <tr key={index} className="border-t border-[var(--color-border)]">
              <td className="px-3 py-3">
                <div className="h-3 w-6 animate-pulse bg-[var(--color-border)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-28 animate-pulse bg-[var(--color-border)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-40 animate-pulse bg-[var(--color-border)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-24 animate-pulse bg-[var(--color-border)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-16 animate-pulse bg-[var(--color-border)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-20 animate-pulse bg-[var(--color-border)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-20 animate-pulse bg-[var(--color-border)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-36 animate-pulse bg-[var(--color-border)]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
