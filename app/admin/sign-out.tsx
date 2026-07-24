"use client";

import { useRouter } from "next/navigation";

/** Ends the session and returns to the login screen. */
export function SignOut({ name }: { name: string }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/v1/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      {/*
        Showing who is signed in is not decoration. Every action in this
        console is now attributed to this person in the audit log, so they
        should be able to see whose name is going on it.
      */}
      <span className="hidden text-sm text-ink-soft sm:inline">{name}</span>
      <button
        type="button"
        onClick={signOut}
        className="rounded-full border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-blush"
      >
        Sign out
      </button>
    </div>
  );
}
