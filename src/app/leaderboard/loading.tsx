import { PageLayout } from "@/components/layout/PageLayout";

const LEADERBOARD_SKELETON_ROWS = 10;

export default function Loading() {
  return (
    <PageLayout
      width="xl"
      className="py-6 text-[var(--color-text)]"
      containerClassName="border-x border-[var(--color-border)]"
    >
      <section className="animate-pulse border-[3px] border-[var(--color-brand)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-bg)] to-[var(--color-surface)] p-4 sm:p-5">
        <div className="h-3 w-32 rounded bg-[var(--color-border)]" />
        <div className="mt-3 h-12 w-56 rounded bg-[var(--color-border)] sm:h-14 sm:w-64" />
        <div className="mt-3 h-3 w-full max-w-2xl rounded bg-[var(--color-border)]" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-9 w-28 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)]"
            />
          ))}
        </div>
      </section>

      <section className="mt-4 border-[3px] border-[var(--color-brand)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-bg)] to-[var(--color-surface)] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="animate-pulse border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
            >
              <div className="h-3 w-2/5 rounded bg-[var(--color-border)]" />
              <div className="mt-2 h-8 w-4/5 rounded bg-[var(--color-border)]" />
              <div className="mt-2 h-3 w-1/3 rounded bg-[var(--color-border)]" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-strong)] bg-[var(--color-bg)]">
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">
                  Rank
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">
                  Student
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">
                  Verified
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">
                  Views
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">
                  Kudos
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] sm:px-4">
                  Profile
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: LEADERBOARD_SKELETON_ROWS }, (_, index) => (
                <tr
                  key={index}
                  className="animate-pulse border-b border-[var(--color-border)] last:border-b-0"
                >
                  <td className="px-3 py-3 sm:px-4">
                    <div className="h-4 w-8 rounded bg-[var(--color-border)]" />
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <div className="h-4 w-32 rounded bg-[var(--color-border)]" />
                    <div className="mt-1.5 h-3 w-20 rounded bg-[var(--color-border)]" />
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <div className="h-4 w-6 rounded bg-[var(--color-border)]" />
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <div className="h-4 w-8 rounded bg-[var(--color-border)]" />
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <div className="h-4 w-6 rounded bg-[var(--color-border)]" />
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <div className="h-7 w-14 rounded bg-[var(--color-border)]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageLayout>
  );
}
