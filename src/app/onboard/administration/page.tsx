"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdministrationGender, AdministrationProfile, AdministrationTitle } from "@/types/student";
import { PageLayout } from "@/components/layout/PageLayout";
import { AdministrationUserManager } from "@/components/onboard/AdministrationUserManager";
import { AchievementVerificationManager } from "@/components/onboard/AchievementVerificationManager";
import { StudentMajorsManager } from "@/components/onboard/StudentMajorsManager";
import { OnboardProfileSkeleton } from "@/components/onboard/OnboardProfileSkeleton";
import {
  DEFAULT_ADMINISTRATION_IMAGE_URL,
  resolveAdministrationImageUrl,
} from "@/lib/profile-images";

interface DraftResponse {
  draft?: AdministrationProfile | null;
  user?: { name?: string };
  error?: string;
}

interface SessionResponse {
  authenticated?: boolean;
  user?: {
    permissions?: string[];
  };
}

interface EditState {
  name: string;
  title: AdministrationTitle;
  occupation: string;
  company: string;
  phoneNumber: string;
  gender: AdministrationGender | "";
  summary: string;
  profilePicUrl: string;
}

type AdministrationTab = "profile" | "users" | "rbac" | "majors" | "achievements";

const TITLES: Array<{ value: AdministrationTitle; label: string }> = [
  { value: "MR", label: "Mr." },
  { value: "MS", label: "Ms." },
  { value: "DR", label: "Dr." },
];

const GENDERS: Array<{ value: AdministrationGender; label: string }> = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

function normalizeGender(gender: string): AdministrationGender | "" {
  if (gender === "Male" || gender === "Female") {
    return gender;
  }

  return "";
}

export default function AdministrationOnboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdministrationTab>("profile");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

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
          setLoadError(payload.error ?? "Unable to load administration profile.");
          setState(null);
          return;
        }

        const fallbackDraft: AdministrationProfile = {
          title: "MR",
          occupation: "",
          company: "",
          phoneNumber: "",
          gender: "",
          summary: "",
          profilePicUrl: DEFAULT_ADMINISTRATION_IMAGE_URL,
        };

        const draft = payload.draft ?? fallbackDraft;

        setState({
          name: payload.user?.name?.trim() || "Administration",
          title: draft.title,
          occupation: draft.occupation,
          company: draft.company,
          phoneNumber: draft.phoneNumber,
          gender: normalizeGender(draft.gender),
          summary: draft.summary,
          profilePicUrl: resolveAdministrationImageUrl(draft.profilePicUrl),
        });
        setLoadError(null);
        setPreview(resolveAdministrationImageUrl(draft.profilePicUrl));
      } catch {
        if (active) {
          setLoadError("Unable to load administration profile.");
          setState(null);
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

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
        });

        if (!active || !response.ok) {
          return;
        }

        const payload = (await response.json()) as SessionResponse;
        setUserPermissions(payload.user?.permissions ?? []);
      } catch {
        if (active) {
          setUserPermissions([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const canAccessUsersTab =
    userPermissions.includes("users.access") ||
    userPermissions.includes("users.edit") ||
    userPermissions.includes("users.toggle-active") ||
    userPermissions.includes("users.reset-password");
  const canAccessRbacTab =
    userPermissions.includes("roles.create") ||
    userPermissions.includes("roles.update") ||
    userPermissions.includes("roles.assign");
  const canAccessAchievementTab = userPermissions.includes("achievements.verify");
  const canAccessMajorsTab =
    userPermissions.includes("majors.view") ||
    userPermissions.includes("majors.create") ||
    userPermissions.includes("majors.edit") ||
    userPermissions.includes("majors.toggle-active");

  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (requestedTab === "achievements" && canAccessAchievementTab) {
      setActiveTab("achievements");
    }
  }, [canAccessAchievementTab, searchParams]);

  useEffect(() => {
    if (activeTab === "users" && !canAccessUsersTab) {
      setActiveTab("profile");
      return;
    }

    if (activeTab === "rbac" && !canAccessRbacTab) {
      setActiveTab("profile");
      return;
    }

    if (activeTab === "achievements" && !canAccessAchievementTab) {
      setActiveTab("profile");
      return;
    }

    if (activeTab === "majors" && !canAccessMajorsTab) {
      setActiveTab("profile");
    }
  }, [activeTab, canAccessAchievementTab, canAccessMajorsTab, canAccessRbacTab, canAccessUsersTab]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setSaveFeedback(null);

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

      setState((current) =>
        current
          ? {
              ...current,
              profilePicUrl: payload.url ?? "",
            }
          : current,
      );
    } catch (uploadError) {
      setSaveFeedback(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setPreview(resolveAdministrationImageUrl(state?.profilePicUrl));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!state) {
      return;
    }

    setSaving(true);
    setSaveFeedback(null);

    try {
      const response = await fetch("/api/onboard/administration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: state.title,
          occupation: state.occupation,
          company: state.company,
          phoneNumber: state.phoneNumber,
          gender: state.gender,
          summary: state.summary,
          profilePicUrl: state.profilePicUrl,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSaveFeedback(payload.error ?? "Unable to save administration profile.");
        return;
      }

      setSaveFeedback("Profile updated successfully.");
      router.refresh();
    } catch {
      setSaveFeedback("Unable to save administration profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <OnboardProfileSkeleton />;
  }

  if (!state) {
    return (
      <PageLayout width="md" className="py-10" containerClassName="max-w-2xl">
        <div className="border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Profile editor unavailable
          </p>
          <p className="mt-2 text-sm text-[var(--color-text)]">
            {loadError ?? "Unable to load administration profile."}
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center border border-[var(--color-border)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Back to directory
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex h-9 items-center justify-center border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)]"
            >
              Retry
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      width="md"
      className="py-10"
      containerClassName={activeTab === "profile" ? "max-w-2xl" : "max-w-6xl"}
    >
      <Link
        href="/"
        className="inline-flex h-9 items-center border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
      >
        ← Back to directory
      </Link>

      <div className="mt-4 mb-2 border-b border-[var(--color-border)] pb-3">
        <div className="inline-flex border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`min-w-24 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
              activeTab === "profile"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
            aria-pressed={activeTab === "profile"}
          >
            Profile
          </button>
          {canAccessUsersTab ? (
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`min-w-24 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                activeTab === "users"
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              aria-pressed={activeTab === "users"}
            >
              Users
            </button>
          ) : null}
          {canAccessRbacTab ? (
            <button
              type="button"
              onClick={() => setActiveTab("rbac")}
              className={`min-w-24 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                activeTab === "rbac"
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              aria-pressed={activeTab === "rbac"}
            >
              RBAC
            </button>
          ) : null}
          {canAccessAchievementTab ? (
            <button
              type="button"
              onClick={() => setActiveTab("achievements")}
              className={`min-w-24 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                activeTab === "achievements"
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              aria-pressed={activeTab === "achievements"}
            >
              Achievements
            </button>
          ) : null}
          {canAccessMajorsTab ? (
            <button
              type="button"
              onClick={() => setActiveTab("majors")}
              className={`min-w-24 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                activeTab === "majors"
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              aria-pressed={activeTab === "majors"}
            >
              Majors
            </button>
          ) : null}
        </div>
      </div>

      {activeTab === "profile" ? (
        <>
          <div className="mb-8 mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative h-16 w-16 flex-shrink-0 overflow-hidden border-[2px] border-[var(--color-brand)] bg-[var(--color-bg)] transition hover:border-[var(--color-accent)] disabled:opacity-60"
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
              <p className="font-heading text-xl uppercase leading-tight text-[var(--color-text)]">{state.name}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Administration profile
              </p>
              <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">JPG or PNG, max 5 MB</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={handlePhotoChange}
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            <Section title="Profile info">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Title" htmlFor="title">
                  <select
                    id="title"
                    value={state.title}
                    onChange={(e) =>
                      setState((current) =>
                        current
                          ? {
                              ...current,
                              title: e.target.value as AdministrationTitle,
                            }
                          : current,
                      )
                    }
                    className={`${inputClassName} cursor-pointer appearance-none bg-[var(--color-surface)]`}
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
                    value={state.occupation}
                    onChange={(e) =>
                      setState((current) =>
                        current
                          ? {
                              ...current,
                              occupation: e.target.value,
                            }
                          : current,
                      )
                    }
                    required
                    className={inputClassName}
                    placeholder="e.g. Program Director"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Company" htmlFor="company">
                  <input
                    id="company"
                    type="text"
                    value={state.company}
                    onChange={(e) =>
                      setState((current) =>
                        current
                          ? {
                              ...current,
                              company: e.target.value,
                            }
                          : current,
                      )
                    }
                    required
                    className={inputClassName}
                    placeholder="e.g. AUPP"
                  />
                </Field>

                <Field label="Phone number" htmlFor="phoneNumber">
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={state.phoneNumber}
                    onChange={(e) =>
                      setState((current) =>
                        current
                          ? {
                              ...current,
                              phoneNumber: e.target.value,
                            }
                          : current,
                      )
                    }
                    required
                    className={inputClassName}
                    placeholder="e.g. +855 12 345 678"
                  />
                </Field>
              </div>

              <Field label="Gender" htmlFor="gender">
                <select
                  id="gender"
                  value={state.gender}
                  onChange={(e) =>
                    setState((current) =>
                      current
                        ? {
                            ...current,
                            gender: e.target.value as AdministrationGender | "",
                          }
                        : current,
                    )
                  }
                  required
                  className={`${inputClassName} cursor-pointer appearance-none bg-[var(--color-surface)]`}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </Field>
            </Section>

            <Section title="Notes / Summary">
              <textarea
                id="summary"
                value={state.summary}
                onChange={(e) =>
                  setState((current) =>
                    current
                      ? {
                          ...current,
                          summary: e.target.value,
                        }
                      : current,
                  )
                }
                required
                rows={5}
                className={`${inputClassName} resize-y`}
                placeholder="Short administration profile summary"
              />
            </Section>

            {saveFeedback ? (
              <p className="border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {saveFeedback}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full border-[2px] border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </>
      ) : activeTab === "users" ? (
        <AdministrationUserManager className="mt-6" tab="users" />
      ) : activeTab === "rbac" ? (
        <AdministrationUserManager className="mt-6" tab="rbac" />
      ) : activeTab === "majors" ? (
        <StudentMajorsManager className="mt-6" />
      ) : (
        <AchievementVerificationManager className="mt-6" />
      )}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-lg uppercase tracking-[0.08em] text-[var(--color-text)]">{title}</h2>
        <div className="flex-1 border-t-[2px] border-[var(--color-border)]" />
      </div>
      {children}
    </section>
  );
}

const inputClassName =
  "w-full border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 outline-none transition focus:border-[var(--color-accent)]";
