import Link from "next/link";
import { ArrowRight, Camera, ClipboardList, MessageCircle, Mic } from "lucide-react";

/**
 * The three ways into the product.
 *
 * This exists because an audit of the deployed site found that two of the four
 * primary features were effectively invisible: `/skin-check/analyzer` had zero
 * inbound links from any page, and `/voice` had exactly one. Both were
 * reachable only by typing the URL. Meanwhile "Skin Check" appeared nineteen
 * times on the home page alone. The product was not missing features, it was
 * missing any way to find them.
 *
 * The hierarchy is deliberate rather than three equal cards. Skin Check stays
 * the primary action — it is the only path that reaches an expert and it works
 * for someone who will not photograph their face — so it is visually raised
 * and listed first. The Analyzer is second because it is the most
 * differentiated thing here. The assistant is third and carries both text and
 * voice, since "talk to us" is one intent with two input methods, not two
 * separate destinations competing for attention.
 *
 * Every description says plainly what the person will do and what they get
 * back. The Analyzer's copy in particular avoids anything diagnostic: it
 * offers "visual observations", never a reading, a diagnosis or a score.
 */
const PATHS = [
  {
    href: "/skin-check",
    eyebrow: "Answer questions",
    title: "Check your skin",
    body: "A few guided questions about your skin, your routine and your history. An expert reviews your answers and builds your routine.",
    action: "Start your Skin Check",
    Icon: ClipboardList,
    primary: true,
  },
  {
    href: "/skin-check/analyzer",
    eyebrow: "Upload a photo",
    title: "Scan your skin with AI",
    body: "Take or upload a clear photo of your face and get AI-powered visual observations in seconds. Reviewed by a Skinwise expert before any routine is made.",
    action: "Open the Skin Analyzer",
    Icon: Camera,
    primary: false,
  },
  {
    href: "/assistant",
    eyebrow: "Type or talk",
    title: "Ask Skinwise AI",
    body: "Ask anything about ingredients, routines or your own regimen. Type your question, or talk to it out loud.",
    action: "Ask a question",
    Icon: MessageCircle,
    primary: false,
  },
] as const;

export function StartPaths() {
  return (
    <section className="mt-16 lg:mt-24" aria-labelledby="start-paths-heading">
      <div className="mx-auto w-full max-w-6xl px-5">
        <h2
          id="start-paths-heading"
          className="max-w-xl font-display text-h2 font-semibold text-ink"
        >
          Three ways to start.
        </h2>
        <p className="mt-3 max-w-xl text-ink-soft">
          Use whichever suits you — or all three. Every route ends with a qualified expert reading
          your skin before anything is recommended.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PATHS.map(({ href, eyebrow, title, body, action, Icon, primary }) => (
            <li key={href} className={primary ? "md:-mt-3" : undefined}>
              <Link
                href={href}
                className={`group flex h-full flex-col rounded-3xl p-6 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2 ${
                  primary
                    ? "bg-rose-ink text-white shadow-lift hover:shadow-lift"
                    : "bg-surface text-ink shadow-soft hover:shadow-lift"
                }`}
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-2xl ${
                    primary ? "bg-white/15 text-white" : "bg-blush text-rose-ink"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>

                <span
                  className={`mt-5 text-xs font-semibold uppercase tracking-wide ${
                    primary ? "text-white/75" : "text-rose-ink"
                  }`}
                >
                  {eyebrow}
                </span>
                <h3 className="mt-1.5 font-display text-2xl font-semibold">{title}</h3>
                <p className={`mt-3 flex-1 text-sm ${primary ? "text-white/85" : "text-ink-soft"}`}>
                  {body}
                </p>

                <span
                  className={`mt-6 inline-flex items-center gap-1.5 font-body text-sm font-semibold ${
                    primary ? "text-white" : "text-rose-ink"
                  }`}
                >
                  {action}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/*
          The voice agent gets its own line rather than a fourth card. It is a
          different way to use the assistant, not a different destination, and
          giving it equal billing would push the Skin Check off a phone screen.
          It still needs to be visible somewhere a first-time visitor will see
          it, which before this was nowhere at all.
        */}
        <p className="mt-6 text-sm text-ink-soft">
          <Mic aria-hidden="true" className="mr-1.5 inline size-4 text-rose-ink" />
          Prefer to speak?{" "}
          <Link
            href="/voice"
            className="inline-flex min-h-11 items-center font-semibold text-rose-ink underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
          >
            Talk to Skinwise AI out loud
          </Link>{" "}
          — hands-free, in your own words.
        </p>
      </div>
    </section>
  );
}
