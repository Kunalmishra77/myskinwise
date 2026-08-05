"use client";

import * as React from "react";
import { PRODUCTS_BY_SLUG } from "@/content/products";
import type { Product } from "@/content/products/types";

/**
 * A small cart, backed by localStorage and shared across the app without a
 * provider.
 *
 * It is an external store read through useSyncExternalStore, so the header
 * badge, the drawer, the /cart page and every "add to cart" button stay in
 * sync with no context wrapping the tree — and it survives a reload. The cart
 * stores only a slug + quantity per line; everything else (name, image, price)
 * is resolved from the catalogue at render time, so the cart can never drift
 * from the source of truth or hold a stale price.
 *
 * There is no online payment by design: an order is a WhatsApp handoff (see
 * buildOrderMessage). Unpriced products carry no invented number — they say
 * the price is confirmed on WhatsApp, and totals only ever sum the priced
 * lines, never a fabricated figure for the rest.
 */

const KEY = "sw_cart";

export type CartEntry = { slug: string; qty: number };
export type CartLine = { product: Product; qty: number };

let entries: CartEntry[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

const MAX_QTY = 20; // a sane per-line ceiling for a compounded skincare order

function clampQty(n: unknown): number {
  const q = Math.floor(Number(n));
  if (!Number.isFinite(q) || q < 1) return 1;
  return Math.min(q, MAX_QTY);
}

function load(): CartEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    const out: CartEntry[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
      // Accept both the legacy string[] shape and the {slug, qty} shape, so an
      // existing cart from before quantities survives the upgrade.
      const slug = typeof item === "string" ? item : item?.slug;
      const qty = typeof item === "string" ? 1 : clampQty(item?.qty);
      if (typeof slug === "string" && !seen.has(slug) && PRODUCTS_BY_SLUG.has(slug as never)) {
        seen.add(slug);
        out.push({ slug, qty });
      }
    }
    return out;
  } catch {
    return [];
  }
}

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    entries = load();
    hydrated = true;
  }
}

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(entries));
  listeners.forEach((l) => l());
}

// Keep other tabs in sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      entries = load();
      listeners.forEach((l) => l());
    }
  });
}

export const cartStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  snapshot(): CartEntry[] {
    ensureHydrated();
    return entries;
  },
  has(slug: string) {
    ensureHydrated();
    return entries.some((e) => e.slug === slug);
  },
  qty(slug: string) {
    ensureHydrated();
    return entries.find((e) => e.slug === slug)?.qty ?? 0;
  },
  add(slug: string) {
    ensureHydrated();
    if (!PRODUCTS_BY_SLUG.has(slug as never) || entries.some((e) => e.slug === slug)) return;
    entries = [...entries, { slug, qty: 1 }];
    persist();
  },
  addMany(next: string[]) {
    ensureHydrated();
    const have = new Set(entries.map((e) => e.slug));
    const added: CartEntry[] = [];
    for (const s of next) {
      if (!have.has(s) && PRODUCTS_BY_SLUG.has(s as never)) {
        have.add(s);
        added.push({ slug: s, qty: 1 });
      }
    }
    if (added.length) {
      entries = [...entries, ...added];
      persist();
    }
  },
  setQty(slug: string, qty: number) {
    ensureHydrated();
    if (qty < 1) {
      cartStore.remove(slug);
      return;
    }
    if (!entries.some((e) => e.slug === slug)) {
      if (PRODUCTS_BY_SLUG.has(slug as never)) {
        entries = [...entries, { slug, qty: clampQty(qty) }];
        persist();
      }
      return;
    }
    entries = entries.map((e) => (e.slug === slug ? { ...e, qty: clampQty(qty) } : e));
    persist();
  },
  increment(slug: string) {
    cartStore.setQty(slug, cartStore.qty(slug) + 1);
  },
  decrement(slug: string) {
    // Decrementing the last one removes the line.
    cartStore.setQty(slug, cartStore.qty(slug) - 1);
  },
  remove(slug: string) {
    ensureHydrated();
    entries = entries.filter((e) => e.slug !== slug);
    persist();
  },
  clear() {
    entries = [];
    persist();
  },
};

const EMPTY: CartEntry[] = [];

export function useCart() {
  const stored = React.useSyncExternalStore(cartStore.subscribe, cartStore.snapshot, () => EMPTY);

  /*
   * Until mounted, report an empty cart — so the FIRST client render matches
   * the server's (which has no localStorage), and only then switches to the
   * real contents. Without this, a reload with items in the cart renders a
   * different tree on the client than the server sent (a filled badge, an "in
   * cart" button) and React throws a hydration error (#418). Every cart
   * consumer gets this protection from one place.
   */
  const [mounted, setMounted] = React.useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);
  const current = mounted ? stored : EMPTY;

  const items: CartLine[] = current
    .map((e) => {
      const product = PRODUCTS_BY_SLUG.get(e.slug as never);
      return product ? { product, qty: e.qty } : null;
    })
    .filter((l): l is CartLine => Boolean(l));

  const products = items.map((l) => l.product);
  const count = items.reduce((n, l) => n + l.qty, 0);
  const subtotal = items.reduce((sum, l) => sum + (l.product.mrp ?? 0) * l.qty, 0);
  const hasUnpriced = items.some((l) => l.product.mrp === null);

  return {
    items,
    slugs: current.map((e) => e.slug),
    products,
    count,
    subtotal,
    hasUnpriced,
    // `has`/`qty` reflect the mounted view too, so buttons don't flip state
    // during hydration.
    has: (slug: string) => (mounted ? cartStore.has(slug) : false),
    qty: (slug: string) => (mounted ? cartStore.qty(slug) : 0),
    add: cartStore.add,
    addMany: cartStore.addMany,
    setQty: cartStore.setQty,
    increment: cartStore.increment,
    decrement: cartStore.decrement,
    remove: cartStore.remove,
    clear: cartStore.clear,
  };
}

/** ₹ with Indian grouping, or the "confirm on WhatsApp" line for unpriced. */
export function formatPrice(mrp: number | null): string {
  return mrp !== null ? `₹${mrp.toLocaleString("en-IN")}` : "price on confirmation";
}

export type OrderContact = { name?: string; phone?: string; note?: string };

/**
 * Formats the cart as a WhatsApp order message — deliberately simple: a
 * headline and the list of products (name × quantity), nothing more. Prices,
 * subtotals and boilerplate ("please confirm availability / price / payment")
 * are intentionally left out; the team confirms all of that in the chat, so
 * repeating it in the pre-filled text just makes the message look cluttered.
 *
 * Optional contact (name / phone / note) is folded in so the team knows who
 * placed the order — it travels only inside this WhatsApp message, never to our
 * own server.
 */
export function buildOrderMessage(lines: CartLine[], contact?: OrderContact): string {
  const rows = lines.map(({ product, qty }) => `• ${product.name} × ${qty}`);

  const contactLines: string[] = [];
  if (contact?.name?.trim()) contactLines.push(`Name: ${contact.name.trim()}`);
  if (contact?.phone?.trim()) contactLines.push(`WhatsApp: ${contact.phone.trim()}`);
  if (contact?.note?.trim()) contactLines.push(`Note: ${contact.note.trim()}`);

  return [
    "*Skinwise order request*",
    "",
    "I'd like to order:",
    ...rows,
    ...(contactLines.length ? ["", ...contactLines] : []),
  ].join("\n");
}
