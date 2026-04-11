"use client";

import { Footer } from "@/components/layout/Footer";
import { TopNav } from "@/components/layout/TopNav";

export function AppShell({
  children,
  initialKnownSession,
}: {
  children: React.ReactNode;
  initialKnownSession: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <TopNav initialKnownSession={initialKnownSession} />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}