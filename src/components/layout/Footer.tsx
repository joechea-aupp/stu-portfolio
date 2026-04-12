import { APP_NAME } from "@/lib/app-config";

export function Footer() {
  return (
    <footer className="border-t-[4px] border-[var(--color-accent)] bg-[var(--color-brand)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <p className="font-heading text-2xl uppercase tracking-[0.04em]">{APP_NAME} Directory</p>

        <div className="flex flex-wrap items-center gap-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85">
          <a href="#" className="hover:text-white">
            Privacy policy
          </a>
          <a href="#" className="hover:text-white">
            Terms of service
          </a>
          <a href="#" className="hover:text-white">
            Support
          </a>
        </div>

        <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">2026 - American University of Phnom Penh</p>
      </div>
    </footer>
  );
}
