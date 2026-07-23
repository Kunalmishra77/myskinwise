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
  const [token, setToken] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/v1/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(params.get("next") || "/admin/consultations");
      router.refresh();
    } else if (res.status === 429) {
      setError("Too many attempts. Please wait a few minutes.");
    } else {
      setError("That access token was not recognised.");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <h1 className="font-display text-3xl font-semibold text-ink">Skinwise team</h1>
      <p className="mt-2 text-sm text-ink-soft">Internal consultation workspace.</p>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <label htmlFor="token" className="text-sm font-semibold text-ink">
          Access token
        </label>
        <input
          id="token"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-rose-ink">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !token}
          className="rounded-full bg-rose-ink px-6 py-3 font-body font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
