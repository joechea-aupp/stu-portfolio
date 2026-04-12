"use client";

import { useState } from "react";
import { OnboardModal } from "@/components/onboard/OnboardModal";

interface SubmitPortfolioCardProps {
  isLoggedIn?: boolean;
}

export function SubmitPortfolioCard({ isLoggedIn = false }: SubmitPortfolioCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const heading = isLoggedIn ? "Inspire with your portfolio" : "Submit your portfolio";
  const description = isLoggedIn
    ? "Show your progress, motivate peers, and attract real opportunities."
    : "Join the showcase and get spotted by recruiters.";

  return (
    <>
      <article className="flex flex-col gap-3 border-[3px] border-[var(--color-accent)] bg-[var(--color-brand)] p-4 transition-colors duration-200 hover:border-[var(--color-brand)] hover:bg-[var(--color-accent)]">
        <div>
          <h3 className="font-heading text-[28px] leading-[0.95] uppercase text-white">
            {heading}
          </h3>
          <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/80">
            {description}
          </p>
        </div>

        {!isLoggedIn && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="border-[2px] border-white bg-[var(--color-accent)] px-3 py-1.5 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-[var(--color-brand)]"
          >
            Get featured
          </button>
        )}
      </article>

      <OnboardModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
