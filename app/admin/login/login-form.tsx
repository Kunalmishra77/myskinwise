"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Split out of page.tsx so `useSearchParams` (which reads ?next=) sits under
 * a Suspense boundary. Without that, Next bails the whole /admin/login route
 * out of prerendering and the production build fails.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/v1/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(params.get("next") || "/admin/leads");
      router.refresh();
    } else if (res.status === 429) {
      setError("Too many attempts. Please wait a few minutes.");
    } else if (res.status === 503) {
      setError("Accounts are not configured on this server.");
    } else {
      /*
       * One message for both wrong email and wrong password, matching what
       * the API returns. Saying "no such account" would let anyone confirm
       * which staff addresses exist.
       */
      setError("Those details were not recognised.");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <h1 className="font-display text-3xl font-semibold text-ink">Skinwise team</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Sign in with your expert account. Internal consultation workspace.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-rose-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !email || !password}
          className="mt-1 rounded-full bg-rose-ink px-6 py-3 font-body font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-xs text-ink-soft">
        Accounts are created by an administrator. If you have lost your password, ask for it to be
        reset — there is no self-service reset, by design, on a console that holds customer photos.
      </p>
    </div>
  );
}
