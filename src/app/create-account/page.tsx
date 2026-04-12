"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { PageLayout } from "@/components/layout/PageLayout";
import { APP_NAME } from "@/lib/app-config";

export default function CreateAccountPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<"STUDENT" | "ADMINISTRATION">("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          userType,
          cfTurnstileToken: turnstileToken,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        userType?: "STUDENT" | "ADMINISTRATION";
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to create account.");
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      const targetUserType = payload.userType ?? userType;
      router.push(targetUserType === "ADMINISTRATION" ? "/onboard/administration" : "/onboard");
    } catch {
      setError("Something went wrong. Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageLayout width="sm" centered>
      <div className="border-[3px] border-[var(--color-brand)] bg-[var(--color-surface)]">
        <div className="bg-[var(--color-brand)] px-8 py-6">
          <p className="text-[9px] uppercase tracking-[0.16em] text-white/70">{APP_NAME}</p>
          <h1 className="mt-2 font-heading text-3xl uppercase leading-tight text-white">
            Create your account
          </h1>
          <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-white/75">
            Create your account first, then finish your student profile in onboarding.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-8">
          <Field label="Full name" htmlFor="name">
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              placeholder="e.g. Sophea Chan"
            />
          </Field>

          <Field label="Account type" htmlFor="userType">
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value as "STUDENT" | "ADMINISTRATION")}
              className="w-full border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
            >
              <option value="STUDENT">Student</option>
              <option value="ADMINISTRATION">Administration</option>
            </select>
          </Field>

          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              placeholder="you@aupp.edu.kh"
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-[2px] border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              placeholder="At least 8 characters"
            />
          </Field>

          {error ? (
            <p className="border border-red-400 bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ theme: "auto" }}
          />

          <button
            type="submit"
            disabled={submitting || !turnstileToken}
            className="mt-2 border-[2px] border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 font-heading text-sm uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>

          <p className="text-center text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Already registered?{" "}
            <Link href="/login" className="text-[var(--color-accent)] underline underline-offset-2">
              Log in
            </Link>
          </p>
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
      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
