"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AcademicYear, SocialLinks, TimelineItem } from "@/types/student";
import { PageLayout } from "@/components/layout/PageLayout";
import { OnboardProfileSkeleton } from "@/components/onboard/OnboardProfileSkeleton";

interface DraftProfile {
  name: string;
  major: string;
  graduationYear?: string;
  year: AcademicYear;
  availableForProject?: boolean;
  imageUrl: string;
  projects: TimelineItem[];
  achievements: TimelineItem[];
  summary: string;
  skills: string[];
  socialLinks?: SocialLinks;
}

const EMPTY_TIMELINE: TimelineItem = { period: "", title: "", details: "" };
type SocialLinkKey = keyof SocialLinks;

const SOCIAL_LINK_OPTIONS: Array<{
  key: SocialLinkKey;
  label: string;
  placeholder: string;
}> = [
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/your-handle",
  },
  {
    key: "github",
    label: "GitHub",
    placeholder: "https://github.com/your-handle",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/your-handle",
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/your-handle",
  },
];

const CLASSIFICATIONS: { value: AcademicYear; label: string }[] = [
  { value: "freshman", label: "Freshman" },
  { value: "sophomore", label: "Sophomore" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
];

interface EditState {
  draft: DraftProfile;
  skills: string[];
  projects: TimelineItem[];
  achievements: TimelineItem[];
  summary: string;
  socialLinks: SocialLinks;
}

interface VerifierOption {
  id: number;
  name: string;
  email: string;
  title: string;
  occupation: string;
}

function formatVerifierDisplayName(verifier: VerifierOption): string {
  return verifier.title ? `${verifier.title} ${verifier.name}` : verifier.name;
}

function getAvailableSocialLinkOptions(socialLinks: SocialLinks) {
  return SOCIAL_LINK_OPTIONS.filter(
    ({ key }) => !Object.prototype.hasOwnProperty.call(socialLinks, key),
  );
}

function getActiveSocialLinkOptions(socialLinks: SocialLinks) {
  return SOCIAL_LINK_OPTIONS.filter(({ key }) => Object.prototype.hasOwnProperty.call(socialLinks, key));
}

export default function OnboardProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [pendingSocialLink, setPendingSocialLink] = useState<SocialLinkKey | "">("");
  const [verifiers, setVerifiers] = useState<VerifierOption[]>([]);
  const [verifierSearchByIndex, setVerifierSearchByIndex] = useState<Record<number, string>>({});
  const [selectedVerifierByIndex, setSelectedVerifierByIndex] = useState<Record<number, string>>({});
  const [requestingAchievementIndex, setRequestingAchievementIndex] = useState<number | null>(null);
  const [expandedProjectIndexes, setExpandedProjectIndexes] = useState<number[]>([]);
  const [expandedAchievementIndexes, setExpandedAchievementIndexes] = useState<number[]>([]);
  const [achievementExpansionInitialized, setAchievementExpansionInitialized] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/onboard", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          setLoadError(payload.error ?? "Unable to load your profile draft.");
          setState(null);
          return;
        }

        setLoadError(null);

        const payload = (await response.json()) as {
          draft?: DraftProfile | null;
          user?: { name?: string };
        };
        const fallbackDraft: DraftProfile = {
          name: payload.user?.name?.trim() || "Student",
          major: "",
          graduationYear: "",
          year: "freshman",
          availableForProject: false,
          imageUrl: "",
          projects: [],
          achievements: [],
          summary: "",
          skills: [],
          socialLinks: {},
        };
        const draft = payload.draft ?? fallbackDraft;

        setState({
          draft,
          skills: draft.skills ?? [],
          projects: draft.projects.length ? draft.projects : [{ ...EMPTY_TIMELINE }],
          achievements: draft.achievements.length ? draft.achievements : [{ ...EMPTY_TIMELINE }],
          summary: draft.summary ?? "",
          socialLinks: draft.socialLinks ?? {},
        });
      } catch {
        if (controller.signal.aborted) return;
        setLoadError("Unable to load your profile draft.");
        setState(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [router]);

  useEffect(() => {
    if (!state) {
      return;
    }

    const availableOptions = getAvailableSocialLinkOptions(state.socialLinks);

    if (!availableOptions.length) {
      if (pendingSocialLink !== "") {
        setPendingSocialLink("");
      }
      return;
    }

    if (!availableOptions.some(({ key }) => key === pendingSocialLink)) {
      setPendingSocialLink(availableOptions[0].key);
    }
  }, [pendingSocialLink, state]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/onboard/achievement-verifications/verifiers", {
          method: "GET",
          cache: "no-store",
        });

        if (!active || !response.ok) {
          return;
        }

        const payload = (await response.json()) as { verifiers?: VerifierOption[] };
        setVerifiers(payload.verifiers ?? []);
      } catch {
        if (active) {
          setVerifiers([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state || achievementExpansionInitialized) {
      return;
    }

    const shouldOpenFirstEmptyEntry =
      state.achievements.length === 1 &&
      !state.achievements[0].title.trim() &&
      !state.achievements[0].period.trim() &&
      !(state.achievements[0].details ?? "").trim();

    setExpandedAchievementIndexes(shouldOpenFirstEmptyEntry ? [0] : []);
    setAchievementExpansionInitialized(true);
  }, [achievementExpansionInitialized, state]);

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
            {loadError ?? "Unable to load your profile draft."}
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
  const { draft, skills, projects, achievements, summary, socialLinks } = state;
  const visibleAchievements = achievements
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry.archivedAt);
  const archivedAchievements = achievements
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => Boolean(entry.archivedAt));
  const activeSocialLinkOptions = getActiveSocialLinkOptions(socialLinks);
  const availableSocialLinkOptions = getAvailableSocialLinkOptions(socialLinks);

  // ── skills ──────────────────────────────────────────────
  function addSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setState((s) => s && ({ ...s, skills: [...s.skills, trimmed] }));
    setSkillInput("");
  }
  function removeSkill(i: number) {
    setState((s) => s && ({ ...s, skills: s.skills.filter((_, idx) => idx !== i) }));
  }

  // ── projects ─────────────────────────────────────────────
  function updateProject(i: number, field: keyof TimelineItem, val: string) {
    setState((s) => s && ({ ...s, projects: s.projects.map((p, idx) => idx === i ? { ...p, [field]: val } : p) }));
  }
  function addProject() { setState((s) => s && ({ ...s, projects: [...s.projects, { ...EMPTY_TIMELINE }] })); }
  function removeProject(i: number) {
    setState((s) => s && ({ ...s, projects: s.projects.filter((_, idx) => idx !== i) }));
    setExpandedProjectIndexes((current) =>
      current
        .filter((index) => index !== i)
        .map((index) => (index > i ? index - 1 : index)),
    );
  }
  function expandProject(i: number) {
    setExpandedProjectIndexes((current) => (current.includes(i) ? current : [...current, i]));
  }
  function collapseProject(i: number) {
    setExpandedProjectIndexes((current) => current.filter((index) => index !== i));
  }

  // ── achievements ─────────────────────────────────────────
  function updateAchievement(i: number, field: keyof TimelineItem, val: string) {
    setState((s) => s && ({ ...s, achievements: s.achievements.map((a, idx) => idx === i ? { ...a, [field]: val } : a) }));
  }
  function addAchievement() {
    setState((s) => {
      if (!s) {
        return s;
      }

      const newIndex = s.achievements.length;
      setExpandedAchievementIndexes([newIndex]);

      return {
        ...s,
        achievements: [...s.achievements, { ...EMPTY_TIMELINE }],
      };
    });
  }
  function removeAchievement(i: number) {
    setState((s) => s && ({ ...s, achievements: s.achievements.filter((_, idx) => idx !== i) }));

    setExpandedAchievementIndexes((current) => {
      const next = current
        .filter((index) => index !== i)
        .map((index) => (index > i ? index - 1 : index));
      return next;
    });
  }

  function archiveAchievement(i: number) {
    const nextAchievements = achievements.map((achievement, idx) =>
      idx === i
        ? {
            ...achievement,
            archivedAt: achievement.archivedAt ?? new Date().toISOString(),
          }
        : achievement,
    );

    setState((s) =>
      s && {
        ...s,
        achievements: nextAchievements,
      },
    );
    setExpandedAchievementIndexes((current) => current.filter((index) => index !== i));
    void persistProfile(nextAchievements, "Achievement archived.");
  }

  function unarchiveAchievement(i: number) {
    const nextAchievements = achievements.map((achievement, idx) =>
      idx === i
        ? {
            ...achievement,
            archivedAt: undefined,
          }
        : achievement,
    );

    setState((s) =>
      s && {
        ...s,
        achievements: nextAchievements,
      },
    );
    setExpandedAchievementIndexes((current) => (current.includes(i) ? current : [...current, i]));
    void persistProfile(nextAchievements, "Achievement unarchived.");
  }

  function expandAchievement(i: number) {
    setExpandedAchievementIndexes((current) => (current.includes(i) ? current : [...current, i]));
  }

  function collapseAchievement(i: number) {
    setExpandedAchievementIndexes((current) => current.filter((index) => index !== i));
  }

  async function requestAchievementVerification(achievementIndex: number) {
    const selectedVerifier = Number.parseInt(selectedVerifierByIndex[achievementIndex] ?? "", 10);

    if (!Number.isInteger(selectedVerifier) || selectedVerifier <= 0) {
      setSaveFeedback("Please select a verifier before sending request.");
      return;
    }

    setRequestingAchievementIndex(achievementIndex);
    setSaveFeedback(null);

    try {
      const saved = await persistProfile(
        achievements,
        "Profile updated successfully.",
        false,
        false,
      );

      if (!saved) {
        return;
      }

      const response = await fetch("/api/onboard/achievement-verifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          achievementIndex,
          verifierUserId: selectedVerifier,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        requestedAt?: string;
        verifier?: { id: number; name: string };
      };

      if (!response.ok) {
        setSaveFeedback(payload.error ?? "Unable to submit verification request.");
        return;
      }

      setState((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          achievements: current.achievements.map((achievement, index) =>
            index === achievementIndex
              ? {
                  ...achievement,
                  pendingVerification: {
                    requestedAt: payload.requestedAt ?? new Date().toISOString(),
                    verifierUserId: payload.verifier?.id ?? selectedVerifier,
                    verifierName:
                      payload.verifier?.name ??
                      verifiers.find((entry) => entry.id === selectedVerifier)?.name ??
                      "Assigned verifier",
                  },
                }
              : achievement,
          ),
        };
      });
      setSaveFeedback("Verification request sent.");
    } catch {
      setSaveFeedback("Unable to submit verification request.");
    } finally {
      setRequestingAchievementIndex(null);
    }
  }

  function updateSocialLink(key: SocialLinkKey, value: string) {
    setState((s) =>
      s
        ? {
            ...s,
            socialLinks: { ...s.socialLinks, [key]: value },
          }
        : s,
    );
  }

  function addSocialLinkField() {
    if (!pendingSocialLink) {
      return;
    }

    setState((s) => {
      if (!s || Object.prototype.hasOwnProperty.call(s.socialLinks, pendingSocialLink)) {
        return s;
      }

      return {
        ...s,
        socialLinks: { ...s.socialLinks, [pendingSocialLink]: "" },
      };
    });
  }

  function removeSocialLinkField(key: SocialLinkKey) {
    setState((s) => {
      if (!s) {
        return s;
      }

      const nextSocialLinks = { ...s.socialLinks };
      delete nextSocialLinks[key];

      return {
        ...s,
        socialLinks: nextSocialLinks,
      };
    });
  }

  async function persistProfile(
    nextAchievements: TimelineItem[],
    successMessage: string,
    refreshAfterSave = false,
    showSuccessFeedback = true,
  ): Promise<boolean> {
    setSaving(true);
    setSaveFeedback(null);

    const updated: DraftProfile = {
      ...draft,
      skills,
      projects: projects.filter((p) => p.title.trim()),
      achievements: nextAchievements.filter((a) => (a.archivedAt ? true : a.title.trim().length > 0)),
      summary,
      socialLinks,
    };

    try {
      const response = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major: updated.major,
          graduationYear: updated.graduationYear,
          year: updated.year,
          availableForProject: Boolean(updated.availableForProject),
          summary: updated.summary,
          imageUrl: updated.imageUrl,
          skills: updated.skills,
          projects: updated.projects,
          achievements: updated.achievements,
          socialLinks: updated.socialLinks,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSaveFeedback(payload.error ?? "Failed to save profile.");
        return false;
      }

      if (showSuccessFeedback) {
        setSaveFeedback(successMessage);
      }

      if (refreshAfterSave) {
        router.refresh();
      }

      return true;
    } catch {
      setSaveFeedback("Failed to save profile.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  // ── save ─────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await persistProfile(achievements, "Profile updated successfully.", true);
  }

  return (
    <PageLayout width="md" className="py-10" containerClassName="max-w-2xl">
        <Link
          href="/"
          className="inline-block border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        >
          ← Back to directory
        </Link>

        {/* Identity summary */}
        <div className="mb-8 mt-6 flex items-center gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 border-[2px] border-[var(--color-brand)] overflow-hidden bg-[var(--color-bg)]">
            {draft.imageUrl && (
              <Image
                src={draft.imageUrl}
                alt={
                  typeof draft.name === "string" && draft.name.trim().length > 0
                    ? `${draft.name} profile photo`
                    : "Student profile photo"
                }
                fill
                className="object-cover"
              />
            )}
          </div>
          <div>
            <p className="font-heading text-xl uppercase text-[var(--color-text)] leading-tight">{draft.name}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {draft.major}
              {draft.graduationYear ? ` · ${draft.graduationYear}` : ""}
              {` · ${draft.year}`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-10">

          {/* ── Profile info ── */}
          <Section title="Profile info">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Major</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={draft.major}
                  onChange={(e) => setState((s) => s && ({ ...s, draft: { ...s.draft, major: e.target.value } }))}
                  className={inputCls}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Graduation year</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  placeholder="e.g. 2028"
                  value={draft.graduationYear ?? ""}
                  onChange={(e) => setState((s) => s && ({ ...s, draft: { ...s.draft, graduationYear: e.target.value } }))}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Classification</label>
                <div className="relative">
                  <select
                    value={draft.year}
                    onChange={(e) => setState((s) => s && ({ ...s, draft: { ...s.draft, year: e.target.value as AcademicYear } }))}
                    className="w-full cursor-pointer appearance-none border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 pr-8 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                  >
                    {CLASSIFICATIONS.map((classification) => (
                      <option key={classification.value} value={classification.value}>
                        {classification.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 border-[2px] border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5">
                <input
                  id="availableForProject"
                  type="checkbox"
                  checked={Boolean(draft.availableForProject)}
                  onChange={(e) =>
                    setState((s) => s && ({ ...s, draft: { ...s.draft, availableForProject: e.target.checked } }))
                  }
                  className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
                />
                <label htmlFor="availableForProject" className="cursor-pointer text-xs text-[var(--color-text)]">
                  Available for project opportunities
                </label>
              </div>
            </div>
          </Section>

          {/* ── Skills ── */}
          <Section title="Skills">
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text)]"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(i)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] leading-none"
                    aria-label={`Remove ${s}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. React, Python…"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                className={inputCls}
              />
              <AddButton onClick={addSkill} label="Add skill" />
            </div>
          </Section>

          {/* ── Notes / Summary ── */}
          <Section title="Notes / Summary">
            <textarea
              rows={4}
              placeholder="A short bio or professional summary…"
              value={summary}
              onChange={(e) => setState((s) => s && ({ ...s, summary: e.target.value }))}
              className={`${inputCls} resize-y`}
            />
          </Section>

          <Section title="Social links">
            <div className="flex flex-col gap-4">
              {activeSocialLinkOptions.length ? (
                <div className="flex flex-col gap-4">
                  {activeSocialLinkOptions.map((option) => (
                    <div
                      key={option.key}
                      className="border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <label
                          htmlFor={`social-link-${option.key}`}
                          className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                        >
                          {option.label}
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSocialLinkField(option.key)}
                          className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        id={`social-link-${option.key}`}
                        type="url"
                        placeholder={option.placeholder}
                        value={socialLinks[option.key] ?? ""}
                        onChange={(e) => updateSocialLink(option.key, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="border-[2px] border-dashed border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
                  Add the social platforms you want to show on your portfolio.
                </p>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Platform
                  </label>
                  <select
                    value={pendingSocialLink}
                    onChange={(e) => setPendingSocialLink(e.target.value as SocialLinkKey | "")}
                    disabled={!availableSocialLinkOptions.length}
                    className="w-full cursor-pointer appearance-none border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 pr-8 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {availableSocialLinkOptions.length ? (
                      availableSocialLinkOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))
                    ) : (
                      <option value="">All available platforms added</option>
                    )}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addSocialLinkField}
                  disabled={!pendingSocialLink}
                  className="border-[2px] border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2.5 font-heading text-xs uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)]/90 disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-[var(--color-border)] disabled:text-[var(--color-text-muted)]"
                >
                  Add social link
                </button>
              </div>
            </div>
          </Section>

          {/* ── Projects ── */}
          <Section title="Projects">
            <div className="flex flex-col gap-4">
              {projects.map((p, i) => (
                <TimelineEntryRow
                  key={i}
                  entry={p}
                  index={i}
                  total={projects.length}
                  expanded={expandedProjectIndexes.includes(i)}
                  onChange={(field, val) => updateProject(i, field, val)}
                  onRemove={() => removeProject(i)}
                  onExpand={() => expandProject(i)}
                  onCollapse={() => collapseProject(i)}
                />
              ))}
            </div>
            <AddItemButton onClick={addProject} label="Add project" />
          </Section>

          {/* ── Achievements ── */}
          <Section title="Achievements">
            <div className="flex flex-col gap-4">
              {visibleAchievements.map(({ entry, index }) => (
                  <AchievementEntryRow
                    key={index}
                    entry={entry}
                    index={index}
                    total={achievements.length}
                    expanded={expandedAchievementIndexes.includes(index)}
                    onChange={(field, val) => updateAchievement(index, field, val)}
                    onRemove={() => removeAchievement(index)}
                    onArchive={() => archiveAchievement(index)}
                    onExpand={() => expandAchievement(index)}
                    onCollapse={() => collapseAchievement(index)}
                    verifierSearch={verifierSearchByIndex[index] ?? ""}
                    onVerifierSearchChange={(value) =>
                      setVerifierSearchByIndex((current) => ({
                        ...current,
                        [index]: value,
                      }))
                    }
                    selectedVerifierId={selectedVerifierByIndex[index] ?? ""}
                    onSelectedVerifierIdChange={(value) =>
                      setSelectedVerifierByIndex((current) => ({
                        ...current,
                        [index]: value,
                      }))
                    }
                    verifiers={verifiers}
                    requesting={requestingAchievementIndex === index}
                    onRequestVerification={() => void requestAchievementVerification(index)}
                  />
              ))}
              {visibleAchievements.length === 0 ? (
                <p className="border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  No active achievements. Add a new one below.
                </p>
              ) : null}

              {archivedAchievements.length > 0 ? (
                <div className="mt-2 border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Archived achievements
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    {archivedAchievements.map(({ entry, index }) => (
                      <div
                        key={`archived-${index}`}
                        className="flex items-center justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                      >
                        <div>
                          <p className="text-sm text-[var(--color-text)]">
                            {entry.title.trim().length > 0 ? entry.title : "Untitled achievement"}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                            {entry.period.trim() || "No period added"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => unarchiveAchievement(index)}
                          className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        >
                          Unarchive
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <AddItemButton onClick={addAchievement} label="Add achievement" />
          </Section>

          {saveFeedback ? (
            <p className="border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {saveFeedback}
            </p>
          ) : null}

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="border-[2px] border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)] w-full"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
    </PageLayout>
  );
}

// ── Sub-components ──────────────────────────────────────────

const inputCls =
  "w-full border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 outline-none focus:border-[var(--color-accent)] transition";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-lg uppercase tracking-[0.08em] text-[var(--color-text)]">
          {title}
        </h2>
        <div className="flex-1 border-t-[2px] border-[var(--color-border)]" />
      </div>
      {children}
    </section>
  );
}

interface TimelineEntryRowProps {
  entry: TimelineItem;
  index: number;
  total: number;
  expanded: boolean;
  onChange: (field: keyof TimelineItem, val: string) => void;
  onRemove: () => void;
  onExpand: () => void;
  onCollapse: () => void;
}

function TimelineEntryRow({
  entry,
  index,
  total,
  expanded,
  onChange,
  onRemove,
  onExpand,
  onCollapse,
}: TimelineEntryRowProps) {
  const displayTitle = entry.title.trim().length > 0 ? entry.title : "Untitled project";
  const displayPeriod = entry.period.trim();

  return (
    <div className="border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Entry {index + 1}
        </span>
        <div className="flex items-center gap-3">
          {!expanded ? (
            <button
              type="button"
              onClick={onExpand}
              aria-expanded={false}
              className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={onCollapse}
              aria-expanded={true}
              className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              Minimize
            </button>
          )}
          {total > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {!expanded ? (
        <div className="flex flex-col gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5">
          <p className="text-sm text-[var(--color-text)]">{displayTitle}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {displayPeriod || "No period added"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Title</label>
              <input
                type="text"
                placeholder="e.g. Final Year Project"
                value={entry.title}
                onChange={(e) => onChange("title", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Period</label>
              <input
                type="text"
                placeholder="e.g. Jan 2025 - Apr 2025"
                value={entry.period}
                onChange={(e) => onChange("period", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Details</label>
            <textarea
              rows={2}
              placeholder="Brief description..."
              value={entry.details ?? ""}
              onChange={(e) => onChange("details", e.target.value)}
              className={`${inputCls} resize-y`}
            />
          </div>
        </>
      )}
    </div>
  );
}

interface AchievementEntryRowProps extends TimelineEntryRowProps {
  verifiers: VerifierOption[];
  expanded: boolean;
  verifierSearch: string;
  selectedVerifierId: string;
  requesting: boolean;
  onArchive: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onVerifierSearchChange: (value: string) => void;
  onSelectedVerifierIdChange: (value: string) => void;
  onRequestVerification: () => void;
}

function AchievementEntryRow({
  entry,
  index,
  expanded,
  onChange,
  onRemove,
  onArchive,
  onExpand,
  onCollapse,
  verifiers,
  verifierSearch,
  selectedVerifierId,
  requesting,
  onVerifierSearchChange,
  onSelectedVerifierIdChange,
  onRequestVerification,
}: AchievementEntryRowProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const normalizedQuery = verifierSearch.trim().toLowerCase();
  const filteredVerifiers = normalizedQuery
    ? verifiers.filter(
        (verifier) =>
          verifier.name.toLowerCase().includes(normalizedQuery) ||
          verifier.email.toLowerCase().includes(normalizedQuery),
      )
    : verifiers;
  const activeOptionId =
    dropdownOpen && highlightedIndex >= 0 && highlightedIndex < filteredVerifiers.length
      ? `verifier-option-${index}-${filteredVerifiers[highlightedIndex].id}`
      : undefined;

  const canRequestVerification =
    entry.title.trim().length > 0 &&
    entry.period.trim().length > 0 &&
    !entry.verifiedBy &&
    !entry.pendingVerification;
  const isVerified = Boolean(entry.verifiedBy);
  const displayTitle = entry.title.trim().length > 0 ? entry.title : "Untitled achievement";
  const displayPeriod = entry.period.trim();

  function handleSelectVerifier(verifier: VerifierOption) {
    onSelectedVerifierIdChange(String(verifier.id));
    onVerifierSearchChange(formatVerifierDisplayName(verifier));
    setDropdownOpen(false);
    setHighlightedIndex(-1);
  }

  function handleComboboxKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!filteredVerifiers.length) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setDropdownOpen(true);
      setHighlightedIndex((current) => (current + 1) % filteredVerifiers.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setDropdownOpen(true);
      setHighlightedIndex((current) => (current <= 0 ? filteredVerifiers.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter") {
      if (!dropdownOpen) {
        return;
      }

      event.preventDefault();

      const selected =
        highlightedIndex >= 0 && highlightedIndex < filteredVerifiers.length
          ? filteredVerifiers[highlightedIndex]
          : filteredVerifiers[0];

      if (selected) {
        handleSelectVerifier(selected);
      }
      return;
    }

    if (event.key === "Tab") {
      if (!dropdownOpen) {
        return;
      }

      const selected =
        highlightedIndex >= 0 && highlightedIndex < filteredVerifiers.length
          ? filteredVerifiers[highlightedIndex]
          : filteredVerifiers[0];

      if (selected) {
        handleSelectVerifier(selected);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  }

  return (
    <div className="border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Entry {index + 1}
        </span>
        <div className="flex items-center gap-3">
          {!expanded ? (
            <button
              type="button"
              onClick={onExpand}
              className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              {isVerified ? "Detail" : "Edit"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCollapse}
              className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              Minimize
            </button>
          )}
          {entry.verifiedBy ? (
            <button
              type="button"
              onClick={onArchive}
              className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              Archive
            </button>
          ) : (
            <button
              type="button"
              onClick={onRemove}
              className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {!expanded ? (
        <div className="flex flex-col gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5">
          <p className="text-sm text-[var(--color-text)]">{displayTitle}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {displayPeriod || "No period added"}
          </p>
        </div>
      ) : (
        <>
          {isVerified ? (
            <div className="flex flex-col gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Title</p>
                  <p className="mt-1 text-sm text-[var(--color-text)]">{displayTitle}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Period</p>
                  <p className="mt-1 text-sm text-[var(--color-text)]">{displayPeriod || "No period added"}</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Details</p>
                <p className="mt-1 text-sm text-[var(--color-text)] whitespace-pre-wrap">
                  {(entry.details ?? "").trim() || "No details added"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Final Year Project"
                    value={entry.title}
                    onChange={(e) => onChange("title", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Period</label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2025 - Apr 2025"
                    value={entry.period}
                    onChange={(e) => onChange("period", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Details</label>
                <textarea
                  rows={2}
                  placeholder="Brief description..."
                  value={entry.details ?? ""}
                  onChange={(e) => onChange("details", e.target.value)}
                  className={`${inputCls} resize-y`}
                />
              </div>
            </>
          )}
        </>
      )}

      {entry.verifiedBy ? (
        <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-700">
          Verified by {entry.verifiedBy.name}
        </p>
      ) : entry.pendingVerification ? (
        <p className="text-[10px] uppercase tracking-[0.12em] text-amber-700">
          Pending verification by {entry.pendingVerification.verifierName}
        </p>
      ) : expanded ? (
        <div className="grid gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Request verification
          </p>
          <div className="relative">
            <input
              type="text"
              value={verifierSearch}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={dropdownOpen}
              aria-controls={`verifier-listbox-${index}`}
              aria-activedescendant={activeOptionId}
              autoComplete="off"
              onFocus={() => {
                setDropdownOpen(true);
                const selectedIndex = filteredVerifiers.findIndex(
                  (verifier) => String(verifier.id) === selectedVerifierId,
                );
                setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : filteredVerifiers.length > 0 ? 0 : -1);
              }}
              onChange={(event) => {
                onVerifierSearchChange(event.target.value);
                onSelectedVerifierIdChange("");
                setDropdownOpen(true);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleComboboxKeyDown}
              onBlur={() => {
                window.setTimeout(() => {
                  setDropdownOpen(false);
                  setHighlightedIndex(-1);
                }, 120);
              }}
              placeholder="Search verifier name or email"
              className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 pr-9 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
            {verifierSearch ? (
              <button
                type="button"
                onClick={() => {
                  onVerifierSearchChange("");
                  onSelectedVerifierIdChange("");
                  setDropdownOpen(true);
                  setHighlightedIndex(filteredVerifiers.length > 0 ? 0 : -1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                aria-label="Clear verifier search"
              >
                ×
              </button>
            ) : null}

            {dropdownOpen ? (
              <div
                id={`verifier-listbox-${index}`}
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-20 max-h-40 overflow-y-auto border border-[var(--color-border)] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
              >
                {filteredVerifiers.length > 0 ? (
                  filteredVerifiers.map((verifier, optionIndex) => {
                    const isSelected = String(verifier.id) === selectedVerifierId;
                    const isHighlighted = optionIndex === highlightedIndex;
                    return (
                      <button
                        id={`verifier-option-${index}-${verifier.id}`}
                        role="option"
                        aria-selected={isSelected}
                        key={verifier.id}
                        type="button"
                        onMouseEnter={() => setHighlightedIndex(optionIndex)}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectVerifier(verifier);
                        }}
                        className={`flex w-full items-start justify-between gap-2 px-2.5 py-2 text-left text-xs transition ${
                          isHighlighted
                            ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                            : isSelected
                            ? "bg-[var(--color-accent)] text-white"
                            : "text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                        }`}
                      >
                        <span className="font-semibold">{formatVerifierDisplayName(verifier)}</span>
                        <span className={`shrink-0 text-right ${isSelected ? "text-white/85" : "text-[var(--color-text-muted)]"}`}>
                          <span className="block">{verifier.occupation}</span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-2.5 py-2 text-xs text-[var(--color-text-muted)]">No matching verifier found.</p>
                )}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRequestVerification}
            disabled={!canRequestVerification || requesting || !selectedVerifierId}
            className="w-full border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)] disabled:opacity-50"
          >
            {requesting ? "Sending request..." : "Request verification"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 border-[2px] border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2.5 font-heading text-xs uppercase tracking-[0.08em] text-white hover:bg-[var(--color-brand)]/90 transition"
    >
      Add
    </button>
  );
}

function AddItemButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 w-full border-[2px] border-dashed border-[var(--color-border-strong)] py-2.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
    >
      + {label}
    </button>
  );
}
