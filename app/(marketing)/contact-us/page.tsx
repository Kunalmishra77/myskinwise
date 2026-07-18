import { Mail, MessageCircle, Phone } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Card, CardBody } from "@/components/ui/card";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { ContactForm } from "@/components/features/contact-form";
import { FAQSection } from "@/components/features/faq-section";
import { buildMetadata } from "@/config/seo";
import { SITE, telHref, waHref } from "@/config/site";
import { FAQS } from "@/content/faqs";
import { heading, subheading, intro } from "@/content/contact";

export const metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Get in touch with Skinwise for guidance on acne and pigmentation treatments, order support, or general inquiries — by phone, email, WhatsApp, or our contact form.",
  path: "/contact-us",
});

/**
 * The 3 department phone lines, sourced from `SITE.phones` (config/site.ts)
 * — never hardcoded here — so the numbers stay in one place across the
 * footer and this page.
 */
const departmentPhones = [SITE.phones.general, SITE.phones.product, SITE.phones.shipment];

/**
 * Contact Us page — header/intro from `content/contact.ts` (WEBSITE_CONTENT.md
 * §13), contact methods (phone/email/WhatsApp) sourced entirely from `SITE`,
 * the shared `<ContactForm>`, and the contact-page FAQs with FAQPage
 * structured data. Server Component: no client-side data fetching needed.
 */
export default function ContactUsPage() {
  return (
    <>
      <Section className="pb-0 text-center">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact us", href: "/contact-us" }]} />
        <h1 className="mt-6 font-serif text-4xl font-semibold text-ink md:text-5xl">{heading}</h1>
        {/* `text-accent` directly as body-text color is only ~2.5:1 against
            white/canvas (fails AA); `text-accent-ink` keeps the rose hue
            while reaching a safe contrast margin. */}
        <p className="mt-3 text-sm font-medium uppercase tracking-wide text-accent-ink">{subheading}</p>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">{intro}</p>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departmentPhones.map((phone) => (
            <Card key={phone.label}>
              <CardBody className="flex flex-col items-center gap-2 text-center">
                <Phone aria-hidden="true" className="size-6 text-accent" />
                <h3 className="text-lg font-semibold text-ink">{phone.label}</h3>
                <a href={telHref(phone.e164)} className="text-muted hover:text-accent-ink">
                  {phone.display}
                </a>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card>
            <CardBody className="flex flex-col items-center gap-2 text-center">
              <Mail aria-hidden="true" className="size-6 text-accent" />
              <h3 className="text-lg font-semibold text-ink">Email Support</h3>
              <a href={`mailto:${SITE.email}`} className="text-muted hover:text-accent-ink">
                {SITE.email}
              </a>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex flex-col items-center gap-2 text-center">
              <MessageCircle aria-hidden="true" className="size-6 text-accent" />
              <h3 className="text-lg font-semibold text-ink">WhatsApp</h3>
              <a
                href={waHref(SITE.whatsapp.e164)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent-ink"
              >
                {SITE.whatsapp.display}
              </a>
            </CardBody>
          </Card>
        </div>
      </Section>

      <Section className="bg-surface">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-6 text-center text-2xl font-semibold text-ink md:text-3xl">
            Send Us a Message
          </h2>
          <ContactForm />
        </div>
      </Section>

      <FAQSection title="Frequently Asked Questions" items={FAQS.contactFaqs} emitSchema />
    </>
  );
}
