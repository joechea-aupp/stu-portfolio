import type { ReactNode } from "react";

type PageWidth = "sm" | "md" | "lg" | "xl";

const PAGE_WIDTH_CLASS: Record<PageWidth, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-5xl",
  xl: "max-w-[1280px]",
};

interface PageLayoutProps {
  children: ReactNode;
  width?: PageWidth;
  centered?: boolean;
  className?: string;
  containerClassName?: string;
}

function compactClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageLayout({
  children,
  width = "lg",
  centered = false,
  className,
  containerClassName,
}: PageLayoutProps) {
  return (
    <main
      className={compactClassNames(
        "flex-1 min-h-full bg-[var(--color-bg)] px-4 sm:px-6 lg:px-8",
        centered ? "flex items-center py-12" : "py-8",
        className,
      )}
    >
      <div
        className={compactClassNames(
          "mx-auto w-full",
          PAGE_WIDTH_CLASS[width],
          containerClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}