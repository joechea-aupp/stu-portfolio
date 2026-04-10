"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface OnboardModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardModal({ open, onClose }: OnboardModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Close when clicking the backdrop
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="m-auto w-full max-w-sm border-[3px] border-[var(--color-accent)] bg-[var(--color-surface)] p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex open:flex-col"
    >
      {/* Header */}
      <div className="bg-[var(--color-brand)] px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl uppercase text-white leading-tight">
            Get featured
          </h2>
          <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/70">
            Join the showcase and get spotted by recruiters.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="mt-0.5 text-white/60 hover:text-white transition text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-6 py-6">
        {/* M365 SSO */}
        <button
          type="button"
          onClick={() => router.push("/onboard")}
          className="flex items-center justify-center gap-3 border-[2px] border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-3 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)]/90 w-full"
        >
          <MicrosoftIcon />
          Continue with university M365
        </button>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-[var(--color-border)]" />
          <span className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">or</span>
          <hr className="flex-1 border-[var(--color-border)]" />
        </div>

        {/* Create account */}
        <button
          type="button"
          className="border-[2px] border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-accent)]/90 w-full"
        >
          Create account
        </button>

        <p className="text-center text-[9px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Already have an account?{" "}
          <button
            type="button"
            className="text-[var(--color-accent)] underline underline-offset-2 hover:no-underline"
          >
            Log in
          </button>
        </p>
      </div>
    </dialog>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}
