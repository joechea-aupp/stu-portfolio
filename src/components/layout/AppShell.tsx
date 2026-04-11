"use client";

import { Footer } from "@/components/layout/Footer";
import { TopNav } from "@/components/layout/TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <TopNav />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}