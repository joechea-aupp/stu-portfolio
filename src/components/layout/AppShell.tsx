"use client";

import { Footer } from "@/components/layout/Footer";
import { TopNav } from "@/components/layout/TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}