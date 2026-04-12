"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface MajorRow {
  id: string;
  name: string;
  isActive: boolean;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MajorsResponse {
  majors?: MajorRow[];
  currentUserPermissions?: string[];
  error?: string;
}

interface MajorMutationResponse {
  major?: MajorRow;
  error?: string;
}

const PERMISSION = {
  VIEW: "majors.view",
  CREATE: "majors.create",
  EDIT: "majors.edit",
  TOGGLE: "majors.toggle-active",
} as const;

export function StudentMajorsManager({ className = "" }: { className?: string }) {
  const [majors, setMajors] = useState<MajorRow[]>([]);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const canCreate = currentUserPermissions.includes(PERMISSION.CREATE);
  const canEdit = currentUserPermissions.includes(PERMISSION.EDIT);
  const canToggle = currentUserPermissions.includes(PERMISSION.TOGGLE);

  const sortedMajors = useMemo(
    () => [...majors].sort((a, b) => a.name.localeCompare(b.name)),
    [majors],
  );

  const loadMajors = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/majors", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as MajorsResponse;

      if (!response.ok) {
        setFeedback(payload.error ?? "Unable to load majors.");
        return;
      }

      setMajors(payload.majors ?? []);
      setCurrentUserPermissions(payload.currentUserPermissions ?? []);
    } catch {
      setFeedback("Unable to load majors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMajors();
  }, [loadMajors]);

  async function handleCreateMajor() {
    if (!createName.trim()) {
      setFeedback("Major name is required.");
      return;
    }

    setPendingId("create");
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/majors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: createName }),
      });

      const payload = (await response.json()) as MajorMutationResponse;

      if (!response.ok || !payload.major) {
        setFeedback(payload.error ?? "Unable to create major.");
        return;
      }

      setMajors((current) => [...current, payload.major as MajorRow]);
      setCreateName("");
      setFeedback("Major created.");
    } catch {
      setFeedback("Unable to create major.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleSaveEdit(majorId: string) {
    if (!editingName.trim()) {
      setFeedback("Major name is required.");
      return;
    }

    setPendingId(majorId);
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/majors", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          majorId,
          action: "edit",
          name: editingName,
        }),
      });

      const payload = (await response.json()) as MajorMutationResponse;

      if (!response.ok || !payload.major) {
        setFeedback(payload.error ?? "Unable to update major.");
        return;
      }

      setMajors((current) => current.map((row) => (row.id === majorId ? (payload.major as MajorRow) : row)));
      setEditingId(null);
      setEditingName("");
      setFeedback("Major updated.");
    } catch {
      setFeedback("Unable to update major.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleToggleActive(majorId: string) {
    setPendingId(majorId);
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/majors", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          majorId,
          action: "toggleActive",
        }),
      });

      const payload = (await response.json()) as MajorMutationResponse;

      if (!response.ok || !payload.major) {
        setFeedback(payload.error ?? "Unable to change major status.");
        return;
      }

      setMajors((current) => current.map((row) => (row.id === majorId ? (payload.major as MajorRow) : row)));
      setFeedback(payload.major.isActive ? "Major activated." : "Major deactivated.");
    } catch {
      setFeedback("Unable to change major status.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className={`border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-4 ${className}`.trim()}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
        <div>
          <h2 className="font-heading text-lg uppercase tracking-[0.08em] text-[var(--color-text)]">Majors</h2>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Manage predefined student majors and active status
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMajors()}
          className="border border-[var(--color-border-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        >
          Refresh
        </button>
      </div>

      {feedback ? (
        <p className="mb-4 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          {feedback}
        </p>
      ) : null}

      {canCreate ? (
        <div className="mb-4 flex flex-col gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] p-3 sm:flex-row">
          <input
            type="text"
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            placeholder="Add major name"
            className="w-full border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 outline-none transition focus:border-[var(--color-accent)]"
          />
          <button
            type="button"
            disabled={pendingId === "create"}
            onClick={() => void handleCreateMajor()}
            className="border-[2px] border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)] disabled:opacity-60"
          >
            {pendingId === "create" ? "Adding..." : "Add Major"}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading majors...</p>
      ) : (
        <div className="overflow-x-auto border border-[var(--color-border)]">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm text-[var(--color-text)]">
            <thead className="bg-[var(--color-bg)] text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              <tr>
                <th className="border-b border-[var(--color-border)] px-3 py-2">Major</th>
                <th className="border-b border-[var(--color-border)] px-3 py-2">Status</th>
                <th className="border-b border-[var(--color-border)] px-3 py-2">Students</th>
                <th className="border-b border-[var(--color-border)] px-3 py-2">Updated</th>
                <th className="border-b border-[var(--color-border)] px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMajors.map((major) => {
                const isPending = pendingId === major.id;
                const isEditing = editingId === major.id;

                return (
                  <tr key={major.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="w-full border-[2px] border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                        />
                      ) : (
                        major.name
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                          major.isActive
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                            : "border-rose-300 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {major.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2">{major.studentCount}</td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">
                      {new Date(major.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        {canEdit ? (
                          isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => void handleSaveEdit(major.id)}
                                className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)] disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName("");
                                }}
                                className="border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                setEditingId(major.id);
                                setEditingName(major.name);
                              }}
                              className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)] disabled:opacity-60"
                            >
                              Edit
                            </button>
                          )
                        ) : null}

                        {canToggle ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => void handleToggleActive(major.id)}
                            className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)] disabled:opacity-60"
                          >
                            {major.isActive ? "Deactivate" : "Activate"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedMajors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-sm text-[var(--color-text-muted)]">
                    No majors found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
