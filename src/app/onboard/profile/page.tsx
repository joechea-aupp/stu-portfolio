"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AcademicYear, TimelineItem } from "@/types/student";
import { PageLayout } from "@/components/layout/PageLayout";

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
}

const EMPTY_TIMELINE: TimelineItem = { period: "", title: "", details: "" };
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
}

export default function OnboardProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

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
          setState(null);
          return;
        }

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
        };
        const draft = payload.draft ?? fallbackDraft;

        setState({
          draft,
          skills: draft.skills ?? [],
          projects: draft.projects.length ? draft.projects : [{ ...EMPTY_TIMELINE }],
          achievements: draft.achievements.length ? draft.achievements : [{ ...EMPTY_TIMELINE }],
          summary: draft.summary ?? "",
        });
      } catch {
        setState(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [router]);

  if (loading) return null;

  if (!state) return null;
  const { draft, skills, projects, achievements, summary } = state;

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
  function removeProject(i: number) { setState((s) => s && ({ ...s, projects: s.projects.filter((_, idx) => idx !== i) })); }

  // ── achievements ─────────────────────────────────────────
  function updateAchievement(i: number, field: keyof TimelineItem, val: string) {
    setState((s) => s && ({ ...s, achievements: s.achievements.map((a, idx) => idx === i ? { ...a, [field]: val } : a) }));
  }
  function addAchievement() { setState((s) => s && ({ ...s, achievements: [...s.achievements, { ...EMPTY_TIMELINE }] })); }
  function removeAchievement(i: number) { setState((s) => s && ({ ...s, achievements: s.achievements.filter((_, idx) => idx !== i) })); }

  // ── save ─────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveFeedback(null);

    const updated: DraftProfile = {
      ...draft,
      skills,
      projects: projects.filter((p) => p.title.trim()),
      achievements: achievements.filter((a) => a.title.trim()),
      summary,
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
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSaveFeedback(payload.error ?? "Failed to save profile.");
        return;
      }

      setSaveFeedback("Profile updated successfully.");
      router.refresh();
    } catch {
      setSaveFeedback("Failed to save profile.");
    } finally {
      setSaving(false);
    }
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

          {/* ── Projects ── */}
          <Section title="Projects">
            <div className="flex flex-col gap-4">
              {projects.map((p, i) => (
                <TimelineEntryRow
                  key={i}
                  entry={p}
                  index={i}
                  total={projects.length}
                  onChange={(field, val) => updateProject(i, field, val)}
                  onRemove={() => removeProject(i)}
                />
              ))}
            </div>
            <AddItemButton onClick={addProject} label="Add project" />
          </Section>

          {/* ── Achievements ── */}
          <Section title="Achievements">
            <div className="flex flex-col gap-4">
              {achievements.map((a, i) => (
                <TimelineEntryRow
                  key={i}
                  entry={a}
                  index={i}
                  total={achievements.length}
                  onChange={(field, val) => updateAchievement(i, field, val)}
                  onRemove={() => removeAchievement(i)}
                />
              ))}
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
  onChange: (field: keyof TimelineItem, val: string) => void;
  onRemove: () => void;
}

function TimelineEntryRow({ entry, index, total, onChange, onRemove }: TimelineEntryRowProps) {
  return (
    <div className="border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Entry {index + 1}
        </span>
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
            placeholder="e.g. Jan 2025 – Apr 2025"
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
          placeholder="Brief description…"
          value={entry.details ?? ""}
          onChange={(e) => onChange("details", e.target.value)}
          className={`${inputCls} resize-y`}
        />
      </div>
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
