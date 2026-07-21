import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { buildMetadata } from "@/config/seo";
import { SITE, telHref, waHref } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata = buildMetadata({
  title: "Your space",
  description:
    "Reach your Skinwise skin expert, and see what your personal skincare space will hold.",
  path: "/me",
});

/*
 * Foundation-phase "Me" tab.
 *
 * Skinwise deliberately has no accounts at launch — the audience is
 * WhatsApp-native, and phone-OTP sign-in in India means DLT registration
 * and per-SMS cost for a login nobody asked for. So this screen shows no
 * sign-in form and claims no logged-out state: pretending an account system
 * exists would be a lie the rest of the product cannot honour.
 *
 * What it does instead is give the tab a real job today (reaching a human)
 * and set an honest expectation about what will live here once the
 * assessment and consultation flows land.
 */

const COMING = [
  "Your skin profile and the concern you told us about",
  "The routine your expert put together for you",
  "Your consultation and order history",
  "Your photos, with the option to delete them at any time",
];

export default function MePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12">
      <Eyebrow>Your space</Eyebrow>
      <h1 className="mt-4 font-display text-display font-semibold text-ink">
        Your skincare journey, in one place.
      </h1>
      <p className="mt-4 font-body text-ink-soft">
        Skinwise does not ask you to create an account. When you complete a Skin Check, we send
        your results straight to your WhatsApp — and this is where they will live.
      </p>

      <section className="mt-10 rounded-3xl bg-blush p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Coming here soon</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {COMING.map((item) => (
            <li key={item} className="flex gap-3 font-body text-sm text-ink">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-ink" />
              {item}
            </li>
          ))}
        </ul>
        <Button asChild className="mt-6 w-full sm:w-auto">
          <Link href="/skin-check">Start your Skin Check</Link>
        </Button>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Need a person?</h2>
        <p className="mt-2 font-body text-sm text-ink-soft">
          Our team answers directly — no bots, no queue.
        </p>
        <ul className="mt-5 flex flex-col gap-3">
          <li>
            <a
              href={waHref(SITE.whatsapp.e164)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-ink/10 px-4 py-3.5 font-body text-sm text-ink transition hover:bg-blush"
            >
              <MessageCircle aria-hidden="true" className="size-5 text-rose-ink" />
              WhatsApp {SITE.whatsapp.display}
            </a>
          </li>
          <li>
            <a
              href={telHref(SITE.phones.general.e164)}
              className="flex items-center gap-3 rounded-2xl border border-ink/10 px-4 py-3.5 font-body text-sm text-ink transition hover:bg-blush"
            >
              <Phone aria-hidden="true" className="size-5 text-rose-ink" />
              {SITE.phones.general.label} &middot; {SITE.phones.general.display}
            </a>
          </li>
          <li>
            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-3 rounded-2xl border border-ink/10 px-4 py-3.5 font-body text-sm text-ink transition hover:bg-blush"
            >
              <Mail aria-hidden="true" className="size-5 text-rose-ink" />
              {SITE.email}
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
