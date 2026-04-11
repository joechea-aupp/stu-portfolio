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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const sortedUsers = useMemo(
    () => users.slice().sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))),
    [users],
  );

  const pageCount = Math.max(1, Math.ceil(sortedUsers.length / USERS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * USERS_PER_PAGE;
    return sortedUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [page, sortedUsers, USERS_PER_PAGE]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

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

  async function runAction(input: Record<string, unknown>) {
    const targetId = typeof input.userId === "number" ? input.userId : null;
    if (!targetId) {
      return;
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
        return;
      }

      if (payload.updated) {
        patchUserInState(payload.updated);
      }

      setFeedback("Update completed.");
    } catch {
      setFeedback("Request failed.");
    } finally {
      setBusyUserId(null);
    }
  }

  function startEdit(user: ManagedUser) {
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

  async function submitEdit(userId: number) {
    if (!editDraft) {
      return;
    }

    await runAction({
      userId,
      action: "edit",
      name: editDraft.name,
      email: editDraft.email,
      userType: editDraft.userType,
    });

    cancelEdit();
  }

  async function resetPassword(userId: number) {
    const entered = window.prompt("Enter the new password (minimum 8 characters):");
    if (entered === null) {
      return;
    }

    await runAction({
      userId,
      action: "resetPassword",
      newPassword: entered,
    });
  }

  return (
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

      {feedback ? (
        <p className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          {feedback}
        </p>
      ) : null}

      {loading ? (
        <UserTableSkeleton />
      ) : sortedUsers.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">No users found.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto border border-[var(--color-border)]">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="bg-[var(--color-bg)]">
                <tr>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">ID</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Name</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Email</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Role</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Status</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Profile</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Created</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const isBusy = busyUserId === user.id;
                  const isEditing = editingUserId === user.id && editDraft;

                  return (
                    <tr key={user.id} className="border-t border-[var(--color-border)] align-top">
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{user.id}</td>
                      <td className="px-3 py-2 text-[var(--color-text)]">{user.name}</td>
                      <td className="px-3 py-2 text-[var(--color-text)]">{user.email}</td>
                      <td className="px-3 py-2 text-[var(--color-text)]">{user.userType}</td>
                      <td className="px-3 py-2 text-[var(--color-text)]">{user.isActive ? "Enabled" : "Disabled"}</td>
                      <td className="px-3 py-2 text-[var(--color-text)]">{user.hasProfile ? "Complete" : "Missing"}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
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
                            disabled={isBusy}
                            onClick={() => void resetPassword(user.id)}
                            className="border border-[var(--color-accent)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-50"
                          >
                            Reset password
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="mt-3 grid grid-cols-1 gap-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] p-3 sm:grid-cols-3">
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
                              className="w-full border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                              placeholder="Name"
                            />
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
                              className="w-full border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                              placeholder="Email"
                            />
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
                              className="w-full border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="ADMINISTRATION">ADMINISTRATION</option>
                            </select>
                            <div className="sm:col-span-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void submitEdit(user.id)}
                                className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-white hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
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
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Role</th>
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
