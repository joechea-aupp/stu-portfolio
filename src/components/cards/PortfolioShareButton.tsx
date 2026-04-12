"use client";

import { useState } from "react";

type PortfolioShareButtonProps = {
  title: string;
  description: string;
  url: string;
};

export function PortfolioShareButton({
  title,
  description,
  url,
}: PortfolioShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard when sharing is canceled or unavailable.
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      return;
    }

    if (typeof window !== "undefined") {
      window.prompt("Copy and share this link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white"
      aria-label="Share this portfolio"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
        <path
          d="M14 4l6 0 0 6M20 4l-9 9M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {copied ? "Link copied" : "Share profile"}
    </button>
  );
}
