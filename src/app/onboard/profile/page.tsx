"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AcademicYear, TimelineItem } from "@/types/student";
import { DRAFT_KEY } from "@/app/onboard/draft";
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

interface EditState {
  draft: DraftProfile;
  skills: string[];
  projects: TimelineItem[];
  achievements: TimelineItem[];
  summary: string;
}

export default function OnboardProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<EditState | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d: DraftProfile = JSON.parse(raw);
    return {
      draft: d,
      skills: d.skills ?? [],
      projects: d.projects.length ? d.projects : [{ ...EMPTY_TIMELINE }],
      achievements: d.achievements.length ? d.achievements : [{ ...EMPTY_TIMELINE }],
      summary: d.summary ?? "",
    };
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (state === null) router.replace("/onboard");
  }, [state, router]);

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
    const updated: DraftProfile = {
      ...draft,
      skills,
      projects: projects.filter((p) => p.title.trim()),
      achievements: achievements.filter((a) => a.title.trim()),
      summary,
    };

    const userId = localStorage.getItem("studenthub_user_id");
    if (!userId) {
      alert("Session expired. Please create your account again.");
      router.replace("/create-account");
      return;
    }

    const response = await fetch("/api/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: Number(userId),
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
      alert(payload.error ?? "Failed to save profile.");
      return;
    }

    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem("studenthub_user_id");
    router.push("/");
  }

  return (
    <PageLayout width="md" className="py-10" containerClassName="max-w-2xl">
        <Link
          href="/onboard"
          className="inline-block border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        >
          ← Back
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

          {/* Save */}
          <button
            type="submit"
            className="border-[2px] border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)] w-full"
          >
            Save &amp; finish
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
