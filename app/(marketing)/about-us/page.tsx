import { Section } from "@/components/ui/section";
import { Card, CardBody } from "@/components/ui/card";
import { buildMetadata } from "@/config/seo";
import { JsonLd } from "@/components/features/json-ld";
import { SITE } from "@/config/site";
import { heading, subheading, mission, vision, coreValues, founderStory, approach } from "@/content/about";

export const metadata = buildMetadata({
  title: "About Us | Skinwise",
  description:
    "Meet Skinwise: our mission, vision, and core values, the founder's story behind personalized, science-backed skincare, and our approach to lasting results.",
  path: "/about-us",
});

/**
 * schema.org Person structured data for the founder, so search engines can
 * associate Anant Sanadhya with Skinwise as its founder. Rendered alongside
 * the site-wide Organization schema already emitted in the root layout.
 */
const founderPersonSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: founderStory.name,
  jobTitle: "Founder",
  worksFor: { "@type": "Organization", name: SITE.name },
};

/**
 * About Us page — composed entirely from `content/about.ts` (real,
 * client-sourced copy from WEBSITE_CONTENT.md §2). Server Component: no
 * client-side data fetching needed.
 */
export default function AboutUsPage() {
  return (
    <>
      <JsonLd data={founderPersonSchema} />

      {/* Heading / subheading */}
      <Section className="text-center">
        <h1 className="font-serif text-4xl font-semibold text-ink md:text-5xl">{heading}</h1>
        {/* `text-accent` directly as body-text color is only ~2.5:1 against
            white/canvas (fails AA); `text-accent-ink` keeps the rose hue
            while reaching a safe contrast margin. */}
        <p className="mt-3 text-sm font-medium uppercase tracking-wide text-accent-ink">{subheading}</p>
      </Section>

      {/* Mission & Vision */}
      <Section className="bg-surface">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-ink md:text-3xl">Our Mission</h2>
            <p className="mt-4 text-lg text-muted">{mission}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink md:text-3xl">Our Vision</h2>
            <p className="mt-4 text-lg text-muted">{vision}</p>
          </div>
        </div>
      </Section>

      {/* Core Values grid */}
      <Section>
        <h2 className="text-center text-2xl font-semibold text-ink md:text-3xl">Our Core Values</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {coreValues.map((value) => (
            <Card key={value.title} className="text-center">
              <CardBody>
                <h3 className="text-lg font-semibold text-ink">{value.title}</h3>
                <p className="mt-2 text-sm text-muted">{value.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>

      {/* Founder bio — text-forward only. No real portrait of Anant Sanadhya
          is available in the asset library; a stock model photo was
          previously placed here but that misrepresents a stock person as
          the founder, so no image is rendered until a real one exists.
          // TODO(client): real founder portrait of Anant Sanadhya pending */}
      <Section className="bg-surface">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-ink md:text-3xl">Founder&apos;s Story</h2>
          <p className="mt-2 text-sm font-medium text-accent-ink">{founderStory.name}</p>
          <div className="mt-4 flex flex-col gap-4">
            {founderStory.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-base text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* Our Approach — 3 pillars */}
      <Section>
        <h2 className="text-center text-2xl font-semibold text-ink md:text-3xl">Our Approach</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {approach.map((pillar) => (
            <Card key={pillar.title}>
              <CardBody>
                <h3 className="text-lg font-semibold text-ink">{pillar.title}</h3>
                <p className="mt-2 text-sm text-muted">{pillar.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
