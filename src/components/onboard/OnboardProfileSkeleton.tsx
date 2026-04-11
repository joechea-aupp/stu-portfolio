import { PageLayout } from "@/components/layout/PageLayout";

export function OnboardProfileSkeleton() {
  return (
    <PageLayout width="md" className="py-10" containerClassName="max-w-2xl">
      <div className="animate-pulse">
        {/* Back link */}
        <div className="h-7 w-32 rounded bg-[var(--color-border)]" />

        {/* Identity summary */}
        <div className="mb-8 mt-6 flex items-center gap-4">
          <div className="h-16 w-16 flex-shrink-0 border-[2px] border-[var(--color-border)] bg-[var(--color-border)]" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 rounded bg-[var(--color-border)]" />
            <div className="h-3 w-28 rounded bg-[var(--color-border)]" />
          </div>
        </div>

        {/* Section: Profile info */}
        <div className="flex flex-col gap-6">
          <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-10 rounded bg-[var(--color-border)]" />
            <div className="h-10 rounded bg-[var(--color-border)]" />
            <div className="h-10 rounded bg-[var(--color-border)]" />
            <div className="h-10 rounded bg-[var(--color-border)]" />
          </div>

          {/* Avatar upload */}
          <div className="h-24 rounded bg-[var(--color-border)]" />
        </div>

        {/* Section: Summary */}
        <div className="mt-10 flex flex-col gap-3">
          <div className="h-4 w-20 rounded bg-[var(--color-border)]" />
          <div className="h-28 rounded bg-[var(--color-border)]" />
        </div>

        {/* Section: Skills */}
        <div className="mt-10 flex flex-col gap-3">
          <div className="h-4 w-16 rounded bg-[var(--color-border)]" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 rounded bg-[var(--color-border)]" />
            <div className="h-10 w-20 rounded bg-[var(--color-border)]" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-[var(--color-border)]" />
            <div className="h-6 w-16 rounded-full bg-[var(--color-border)]" />
            <div className="h-6 w-24 rounded-full bg-[var(--color-border)]" />
          </div>
        </div>

        {/* Section: Projects */}
        <div className="mt-10 flex flex-col gap-3">
          <div className="h-4 w-20 rounded bg-[var(--color-border)]" />
          <div className="h-20 rounded bg-[var(--color-border)]" />
        </div>

        {/* Section: Achievements */}
        <div className="mt-10 flex flex-col gap-3">
          <div className="h-4 w-28 rounded bg-[var(--color-border)]" />
          <div className="h-20 rounded bg-[var(--color-border)]" />
        </div>

        {/* Save button */}
        <div className="mt-10 h-10 w-28 rounded bg-[var(--color-border)]" />
      </div>
    </PageLayout>
  );
}
