"use client";

import * as React from "react";
import { PRODUCTS_BY_SLUG } from "@/content/products";
import type { Product } from "@/content/products/types";

/**
 * A tiny cart, backed by localStorage and shared across the app without a
 * provider.
 *
 * It is an external store read through useSyncExternalStore, so the header
 * badge, the drawer and every "add to cart" button on every page stay in sync
 * with no context wrapping the tree — and it survives a reload. The cart holds
 * product slugs only; everything else (name, image, price) is resolved from
 * the catalogue at render time, so the cart can never drift from the source of
 * truth or store a stale price.
 *
 * There is no online payment by design: an order is a WhatsApp handoff (see
 * buildOrderMessage). Unpriced products carry no invented number — they say
 * the price is confirmed on WhatsApp, exactly as everywhere else.
 */

const KEY = "sw_cart";
let slugs: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((s) => typeof s === "string" && PRODUCTS_BY_SLUG.has(s as never)) : [];
  } catch {
    return [];
  }
}

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    slugs = load();
    hydrated = true;
  }
}

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(slugs));
  listeners.forEach((l) => l());
}

// Keep other tabs in sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      slugs = load();
      listeners.forEach((l) => l());
    }
  });
}

export const cartStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  snapshot(): string[] {
    ensureHydrated();
    return slugs;
  },
  has(slug: string) {
    ensureHydrated();
    return slugs.includes(slug);
  },
  add(slug: string) {
    ensureHydrated();
    if (!PRODUCTS_BY_SLUG.has(slug as never) || slugs.includes(slug)) return;
    slugs = [...slugs, slug];
    persist();
  },
  addMany(next: string[]) {
    ensureHydrated();
    const set = new Set(slugs);
    for (const s of next) if (PRODUCTS_BY_SLUG.has(s as never)) set.add(s);
    slugs = [...set];
    persist();
  },
  remove(slug: string) {
    ensureHydrated();
    slugs = slugs.filter((s) => s !== slug);
    persist();
  },
  clear() {
    slugs = [];
    persist();
  },
};

export function useCart() {
  const current = React.useSyncExternalStore(
    cartStore.subscribe,
    cartStore.snapshot,
    () => [] as string[],
  );
  const products = current
    .map((s) => PRODUCTS_BY_SLUG.get(s as never))
    .filter((p): p is Product => Boolean(p));
  return {
    slugs: current,
    products,
    count: current.length,
    add: cartStore.add,
    addMany: cartStore.addMany,
    remove: cartStore.remove,
    clear: cartStore.clear,
    has: cartStore.has,
  };
}

/** Formats the cart as a WhatsApp order message. No invented prices. */
export function buildOrderMessage(products: Product[]): string {
  const lines = products.map((p) => {
    const price = p.mrp !== null ? `₹${p.mrp.toLocaleString("en-IN")}` : "price to confirm";
    return `• ${p.name} (${price})`;
  });
  return [
    "*Skinwise order request*",
    "",
    "I'd like to order:",
    ...lines,
    "",
    "Please confirm availability, the final price for any custom items, and how to pay. Thank you!",
  ].join("\n");
}
