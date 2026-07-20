import Image from "next/image";
import Link from "next/link";
import { Globe, Mail, MessageCircle, Phone } from "lucide-react";
import { SITE, telHref, waHref } from "@/config/site";
import { IMAGES } from "@/content/assets";
import { SubscribeForm } from "@/components/features/subscribe-form";

const visitLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact us", href: "/contact-us" },
  ...SITE.concerns.map((c) => ({ label: c.label, href: `/${c.slug}` })),
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Refund & Cancellation", href: "/refund-and-cancellation" },
];

/**
 * Human-readable labels for the social platforms Footer knows about, keyed
 * by the `SITE.social` field name — the actual URLs (and whether a
 * platform even appears) come entirely from `SITE.social`, so adding a real
 * link there is enough to surface it here; no hardcoded profile URLs live
 * in this component. `lucide-react` doesn't ship brand/logo icons (dropped
 * upstream for trademark reasons), so every platform shares the same
 * generic `Globe` glyph — the accessible name still distinguishes them for
 * assistive tech via `aria-label`.
 */
const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
};

/**
 * Site-wide footer. Every phone number, email and WhatsApp link is read
 * from `SITE` (config/site.ts) — nothing here is hardcoded — so the
 * contact details stay in one place and the old `?page_id=6943` "Home"
 * link bug can't creep back in (that link is hardcoded to `/` below).
 */
export function Footer() {
  const socials = Object.entries(SITE.social).filter(([, url]) => Boolean(url)) as [
    keyof typeof SITE.social,
    string,
  ][];

  return (
    <footer className="bg-blush text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link href="/" className="w-fit">
              <Image
                src={IMAGES.logo.src}
                alt={IMAGES.logo.alt}
                width={IMAGES.logo.width}
                height={IMAGES.logo.height}
                className="h-8 w-auto"
              />
            </Link>
            <ul className="flex flex-col gap-2 text-sm text-ink/80">
              <li>
                <a
                  href={telHref(SITE.phones.general.e164)}
                  className="inline-flex items-center gap-2 hover:text-accent-ink"
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {SITE.phones.general.label}: {SITE.phones.general.display}
                </a>
              </li>
              <li>
                <a
                  href={telHref(SITE.phones.product.e164)}
                  className="inline-flex items-center gap-2 hover:text-accent-ink"
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {SITE.phones.product.label}: {SITE.phones.product.display}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2 hover:text-accent-ink"
                >
                  <Mail aria-hidden="true" className="size-4" />
                  {SITE.email}
                </a>
              </li>
            </ul>

            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent-ink">
                Reach Out
              </h2>
              <ul className="flex flex-col gap-2 text-sm text-ink/80">
                <li>
                  <a
                    href={waHref(SITE.whatsapp.e164)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-accent-ink"
                  >
                    <MessageCircle aria-hidden="true" className="size-4" />
                    WhatsApp: {SITE.whatsapp.display}
                  </a>
                </li>
                <li>
                  <a
                    href={telHref(SITE.phones.general.e164)}
                    className="inline-flex items-center gap-2 hover:text-accent-ink"
                  >
                    <Phone aria-hidden="true" className="size-4" />
                    Customer Care: {SITE.phones.general.display}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="inline-flex items-center gap-2 hover:text-accent-ink"
                  >
                    <Mail aria-hidden="true" className="size-4" />
                    {SITE.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent-ink">
              Visit Links
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-ink/80">
              {visitLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-accent-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent-ink">
              Subscribe Now
            </h2>
            <p className="mb-4 text-sm text-ink/80">
              Never miss our updates! Subscribe today!
            </p>
            <SubscribeForm />

            {socials.length > 0 && (
              <ul className="mt-6 flex items-center gap-3">
                {socials.map(([key, url]) => {
                  const label = socialLabels[key];
                  if (!label) return null;
                  return (
                    <li key={key}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="inline-flex size-9 items-center justify-center rounded-full bg-accent-ink text-white transition hover:bg-ink"
                      >
                        <Globe aria-hidden="true" className="size-4" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-accent/20 pt-6 text-sm text-ink/70 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-accent-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p>{SITE.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
