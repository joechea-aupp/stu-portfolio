"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { AdministrationProfile, AdministrationTitle } from "@/types/student";
import { PageLayout } from "@/components/layout/PageLayout";

interface DraftResponse {
  draft?: AdministrationProfile | null;
  user?: { name?: string };
  error?: string;
}

const TITLES: Array<{ value: AdministrationTitle; label: string }> = [
  { value: "MR", label: "Mr." },
  { value: "MS", label: "Ms." },
  { value: "DR", label: "Dr." },
];

export default function AdministrationOnboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState<AdministrationTitle>("MR");
  const [occupation, setOccupation] = useState("");
  const [company, setCompany] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [summary, setSummary] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/onboard/administration", {
          method: "GET",
          cache: "no-store",
        });

        if (!active) {
          return;
        }

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          router.replace("/onboard");
          return;
        }

        const payload = (await response.json()) as DraftResponse;

        if (!response.ok) {
          setError(payload.error ?? "Unable to load administration onboarding.");
          return;
        }

        if (payload.draft) {
          setTitle(payload.draft.title);
          setOccupation(payload.draft.occupation);
          setCompany(payload.draft.company);
          setPhoneNumber(payload.draft.phoneNumber);
          setGender(payload.draft.gender);
          setSummary(payload.draft.summary);
          setProfilePicUrl(payload.draft.profilePicUrl);
          setPreview(payload.draft.profilePicUrl || null);
        }
      } catch {
        if (active) {
          setError("Unable to load administration onboarding.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: form,
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setProfilePicUrl(payload.url ?? "");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/onboard/administration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          occupation,
          company,
          phoneNumber,
          gender,
          summary,
          profilePicUrl,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to save administration profile.");
        return;
      }

      setSuccess("Administration profile saved.");
    } catch {
      setError("Unable to save administration profile.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageLayout width="sm" centered>
        <div className="border-[3px] border-[var(--color-brand)] bg-[var(--color-surface)] px-8 py-10">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Loading administration onboarding...
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout width="sm" centered>
      <div className="w-full max-w-lg border-[3px] border-[var(--color-brand)] bg-[var(--color-surface)]">
        <div className="bg-[var(--color-brand)] px-8 py-5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/60">Administration onboarding</p>
          <h1 className="mt-2 font-heading text-3xl uppercase leading-tight text-white">Complete your profile</h1>
          <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-white/70">
            Set up your administration details before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-8">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Profile photo
            </span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="relative h-20 w-20 flex-shrink-0 overflow-hidden border-[2px] border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] transition hover:border-[var(--color-accent)] disabled:opacity-60"
                aria-label="Upload profile photo"
              >
                {uploading ? (
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Uploading...
                  </span>
                ) : preview ? (
                  <Image src={preview} alt="Profile preview" fill className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Upload
                  </span>
                )}
              </button>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Upload a professional profile photo.</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]/70">
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

          <Field label="Title" htmlFor="title">
            <select
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value as AdministrationTitle)}
              className={inputClassName}
            >
              {TITLES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Occupation" htmlFor="occupation">
            <input
              id="occupation"
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              required
              className={inputClassName}
              placeholder="e.g. Program Director"
            />
          </Field>

          <Field label="Company" htmlFor="company">
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className={inputClassName}
              placeholder="e.g. AUPP"
            />
          </Field>

          <Field label="Phone number" htmlFor="phoneNumber">
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className={inputClassName}
              placeholder="e.g. +855 12 345 678"
            />
          </Field>

          <Field label="Gender" htmlFor="gender">
            <input
              id="gender"
              type="text"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className={inputClassName}
              placeholder="e.g. Female"
            />
          </Field>

          <Field label="Summary" htmlFor="summary">
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              rows={5}
              className={inputClassName}
              placeholder="Short administration profile summary"
            />
          </Field>

          {error ? (
            <p className="border border-red-400 bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {success ? (
            <p className="border border-emerald-400 bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || uploading}
            className="mt-2 border-[2px] border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save administration profile"}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]";
