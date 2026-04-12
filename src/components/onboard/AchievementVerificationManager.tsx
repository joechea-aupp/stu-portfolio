"use client";

import { useCallback, useEffect, useState } from "react";

interface VerificationRequestItem {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  student: {
    id: number;
    name: string;
  };
  assignedVerifier: {
    id: number;
    name: string;
  };
  achievementIndex: number;
  achievement: {
    title: string;
    period: string;
    details: string;
  } | null;
}

interface RequestsPayload {
  requests?: VerificationRequestItem[];
  error?: string;
}

export function AchievementVerificationManager({ className }: { className?: string }) {
  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/administration/achievement-verifications?status=${statusFilter}&limit=50`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as RequestsPayload;

      if (!response.ok) {
        setRequests([]);
        setFeedback(payload.error ?? "Unable to load verification requests.");
        return;
      }

      setRequests(payload.requests ?? []);
    } catch {
      setRequests([]);
      setFeedback("Unable to load verification requests.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function runReviewAction(requestId: number, action: "approve" | "reject") {
    const rejectionReason =
      action === "reject"
        ? window.prompt("Enter rejection reason", "Insufficient supporting evidence.")?.trim() ?? ""
        : "";

    if (action === "reject" && !rejectionReason) {
      setFeedback("Rejection reason is required.");
      return;
    }

    setBusyRequestId(requestId);
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/achievement-verifications", {
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

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback(payload.error ?? "Unable to submit review action.");
        return;
      }

      setFeedback(action === "approve" ? "Request approved." : "Request rejected.");
      await loadRequests();
    } catch {
      setFeedback("Unable to submit review action.");
    } finally {
      setBusyRequestId(null);
    }
  }

  return (
    <section className={`${className ?? "mt-8"} border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg uppercase tracking-[0.08em] text-[var(--color-text)]">
            Achievement verification requests
          </h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Review requests assigned to your account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "PENDING" | "APPROVED" | "REJECTED")}
            className="border border-[var(--color-border)] bg-white px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text)]"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            type="button"
            onClick={() => void loadRequests()}
            className="border border-[var(--color-border-strong)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          >
            Refresh
          </button>
        </div>
      </div>

      {feedback ? (
        <p className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          {feedback}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">Loading verification requests...</p>
      ) : requests.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">No requests in this status.</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-[var(--color-border)]">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-[var(--color-bg)]">
              <tr>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Student</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Achievement</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Requested</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Status</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const isBusy = busyRequestId === request.id;

                return (
                  <tr key={request.id} className="border-t border-[var(--color-border)] align-top">
                    <td className="px-3 py-2 text-[var(--color-text)]">
                      <p className="font-semibold">{request.student.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">ID: {request.student.id}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-[var(--color-text)]">{request.achievement?.title ?? "Achievement missing"}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{request.achievement?.period ?? "-"}</p>
                      {request.achievement?.details ? (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{request.achievement.details}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">
                      {new Date(request.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                        {request.status}
                      </span>
                      {request.rejectionReason ? (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Reason: {request.rejectionReason}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {request.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void runReviewAction(request.id, "approve")}
                            className="border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void runReviewAction(request.id, "reject")}
                            className="border border-rose-600 bg-rose-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--color-text-muted)]">No further action.</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
