import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Internal workspace shell. Sits outside the (app) route group so it never
 * carries the customer navigation, and every route beneath it is already
 * gated by middleware.ts before it renders.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-warm">
      <header className="border-b border-ink/10 bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3">
          <span className="font-display text-lg font-semibold text-ink">Skinwise team</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin/consultations" className="text-ink-soft hover:text-rose-ink">
              Consultations
            </Link>
            <Link href="/admin/orders" className="text-ink-soft hover:text-rose-ink">
              Orders
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
