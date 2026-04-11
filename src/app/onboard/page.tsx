"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { AcademicYear } from "@/types/student";
import { DRAFT_KEY } from "@/app/onboard/draft";
import { PageLayout } from "@/components/layout/PageLayout";

const CLASSIFICATIONS: { value: AcademicYear; label: string }[] = [
  { value: "freshman", label: "Freshman" },
  { value: "sophomore", label: "Sophomore" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
];

export default function OnboardPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [major, setMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [year, setYear] = useState<AcademicYear | "">("");
  const [availableForProject, setAvailableForProject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const payload = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Upload failed.");
      setImageUrl(payload.url ?? "");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
    const draft = {
      ...existing,
      major,
      graduationYear,
      year,
      availableForProject,
      imageUrl,
      projects: existing.projects ?? [],
      achievements: existing.achievements ?? [],
      summary: existing.summary ?? "",
      skills: existing.skills ?? [],
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    router.push("/onboard/profile");
  }

  return (
    <PageLayout width="sm" centered>
      <div className="w-full max-w-lg">
          {/* Card */}
          <div className="border-[3px] border-[var(--color-brand)] bg-[var(--color-surface)]">
            {/* Card header */}
            <div className="bg-[var(--color-brand)] px-8 py-5">
              <div className="flex items-center gap-2">
                <MicrosoftIcon />
                <span className="text-[9px] uppercase tracking-[0.18em] text-white/60">
                  Signed in via University M365
                </span>
              </div>
              <h1 className="mt-2 font-heading text-3xl uppercase text-white leading-tight">
                Complete your profile
              </h1>
              <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-white/70">
                Fill in the details below to get featured in the directory.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col gap-6">
              {/* Profile photo */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Profile photo
                </span>
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="relative h-20 w-20 flex-shrink-0 border-[2px] border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] overflow-hidden hover:border-[var(--color-accent)] transition disabled:opacity-60"
                    aria-label="Upload profile photo"
                  >
                    {uploading ? (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        Uploading…
                      </span>
                    ) : preview ? (
                      <Image
                        src={preview}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                        <UploadIcon />
                        <span className="text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          Upload
                        </span>
                      </span>
                    )}
                  </button>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Click the box to upload your photo.
                    </p>
                    <p className="mt-0.5 text-[9px] text-[var(--color-text-muted)]/70 uppercase tracking-[0.1em]">
                      JPG or PNG · max 5 MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Major */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="major"
                  className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                >
                  Major
                </label>
                <input
                  id="major"
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 outline-none focus:border-[var(--color-accent)] transition"
                />
              </div>

              {/* Graduation year */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="graduationYear"
                  className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                >
                  Graduation year
                </label>
                <input
                  id="graduationYear"
                  type="number"
                  inputMode="numeric"
                  min={2000}
                  max={2100}
                  required
                  placeholder="e.g. 2028"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 outline-none focus:border-[var(--color-accent)] transition"
                />
              </div>

              {/* Classification */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="classification"
                  className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                >
                  Classification
                </label>
                <div className="relative">
                  <select
                    id="classification"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value as AcademicYear)}
                    className="w-full appearance-none border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 pr-8 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition cursor-pointer"
                  >
                    <option value="" disabled>
                      Select classification
                    </option>
                    {CLASSIFICATIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>

              {/* Project availability */}
              <div className="flex items-start gap-3 border-[2px] border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3">
                <input
                  id="availableForProject"
                  type="checkbox"
                  checked={availableForProject}
                  onChange={(e) => setAvailableForProject(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
                />
                <label
                  htmlFor="availableForProject"
                  className="cursor-pointer text-xs text-[var(--color-text)]"
                >
                  Available for project opportunities
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading}
                className="mt-2 border-[2px] border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)] w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Submit &amp; get featured
              </button>
            </form>
          </div>
      </div>
    </PageLayout>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--color-text-muted)]"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
