"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Globe, Mail, MessageCircle, Send, type LucideIcon } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { IMAGES } from "@/content/assets";

const EXPLORE_LINKS: { label: string; href: string }[] = [
  { label: "The AI Analyzer", href: "#analyzer" },
  { label: "AI Chat", href: "#chat" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Concerns", href: "#concerns" },
  { label: "Results", href: "#results" },
];

/**
 * Real social/contact links built entirely from `SITE` — nothing hardcoded.
 * `href: null` entries (currently Instagram, an empty `SITE.social`
 * placeholder, and Facebook, for which `SITE` has no field at all) are
 * filtered out at render time rather than pointing anywhere fake, mirroring
 * the existing marketing footer's `socials.filter(Boolean)` convention.
 * lucide-react ships no Instagram/Facebook brand glyphs (dropped upstream
 * for trademark reasons), so generic icons stand in — the `aria-label`
 * carries the real platform name for assistive tech.
 */
function getSocialLinks(): { key: string; label: string; href: string; Icon: LucideIcon }[] {
  const candidates: { key: string; label: string; href: string | null; Icon: LucideIcon }[] = [
    { key: "instagram", label: "Instagram", href: SITE.social.instagram || null, Icon: Camera },
    { key: "facebook", label: "Facebook", href: null, Icon: Globe },
    { key: "whatsapp", label: "WhatsApp", href: waHref(SITE.whatsapp.e164), Icon: MessageCircle },
  ];
  return candidates.filter((c): c is { key: string; label: string; href: string; Icon: LucideIcon } => Boolean(c.href));
}

export function Footer() {
  const socialLinks = getSocialLinks();
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const onNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO(newsletter-integration): wire up to the real subscribe endpoint —
    // this is a visual-only capture for Stage 1.
    setSubmitted(true);
  };

  return (
    <footer className="bg-plum font-body text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="flex flex-col gap-4 md:col-span-1">
            <Link href="/" className="w-fit">
              <Image
                src={IMAGES.logo.src}
                alt={IMAGES.logo.alt}
                width={IMAGES.logo.width}
                height={IMAGES.logo.height}
                className="h-9 w-auto"
              />
            </Link>
            <p className="max-w-xs text-sm text-white/70">
              AI-powered skin analysis, paired with real dermatology expertise — a routine built around your exact
              concern.
            </p>
            {socialLinks.length > 0 && (
              <ul className="mt-2 flex items-center gap-3">
                {socialLinks.map(({ key, label, href, Icon }) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-rose hover:text-plum"
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="eyebrow eyebrow--dark mb-4">Explore</h2>
            <ul className="flex flex-col gap-2.5 text-sm text-white/75">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="eyebrow eyebrow--dark mb-4">Concerns</h2>
            <ul className="flex flex-col gap-2.5 text-sm text-white/75">
              {SITE.concerns.map((concern) => (
                <li key={concern.slug}>
                  <Link href={`/${concern.slug}`} className="transition hover:text-white">
                    {concern.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-4 inline-flex items-center gap-2 text-sm text-white/75 transition hover:text-white"
            >
              <Mail aria-hidden="true" className="size-4" />
              {SITE.email}
            </a>
          </div>

          <div>
            <h2 className="eyebrow eyebrow--dark mb-4">Stay in the loop</h2>
            <p className="mb-4 text-sm text-white/70">Skincare science and routine tips, occasionally, never spam.</p>
            {submitted ? (
              <p className="text-sm font-medium text-rose">Thanks — you&apos;re on the list.</p>
            ) : (
              <form onSubmit={onNewsletterSubmit} className="flex items-center gap-2">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  className="w-full min-w-0 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-ink text-white transition hover:bg-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-plum"
                >
                  <Send aria-hidden="true" className="size-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© 2025 Razorbill Private Limited.</p>
        </div>
      </div>
    </footer>
  );
}
