export type NavItem = { label: string; href: string; children?: NavItem[] };
type Phone = { label: string; display: string; e164: string };
export const SITE = {
  name: "Skinwise",
  legalEntity: "Razorbill Private Limited",
  url: "https://myskinwise.com",
  email: "support@myskinwise.com",
  // TODO(client-confirm): canonical phone set (Contact-page 3-department split)
  phones: {
    general: { label: "General Inquiries", display: "+91 93191 35065", e164: "+919319135065" },
    product: { label: "Product Queries", display: "+91 99587 15003", e164: "+919958715003" },
    shipment: { label: "Shipment Queries", display: "+91 96501 21669", e164: "+919650121669" },
  } satisfies Record<string, Phone>,
  whatsapp: { display: "+91 93191 35065", e164: "919319135065" },
  concerns: [
    { slug: "pigmentation", label: "Hyperpigmentation" },
    { slug: "acne", label: "Acne" },
    { slug: "acne-scars", label: "Acne Scars" },
    { slug: "dark-circles", label: "Dark Circles" },
    { slug: "oily-skin", label: "Oily Skin" },
    { slug: "dry-skin", label: "Dry Skin" },
    { slug: "other-issues", label: "Other Issues" },
  ],
  nav: [] as NavItem[],
  social: { instagram: "" }, // TODO(client-confirm)
  copyright: "© 2025 Razorbill Private Limited. All Rights Reserved.",
};
/*
 * `Skin AI` groups the four primary product features under one header item.
 *
 * Before this, the header carried only marketing destinations, and an audit
 * of the deployed site found the Skin Analyzer had zero inbound links from
 * any page while the voice agent had one. Neither appeared in any navigation.
 * They are grouped rather than listed flat because five top-level items plus
 * four feature links does not fit a header, and because they genuinely are
 * one family: different ways to have your skin looked at.
 */
SITE.nav = [
  { label: "Home", href: "/" },
  {
    label: "Skin AI",
    href: "#",
    children: [
      { label: "Skin Check", href: "/skin-check" },
      { label: "AI Skin Analyzer", href: "/skin-check/analyzer" },
      { label: "AI Assistant", href: "/assistant" },
      { label: "Talk to Skinwise AI", href: "/voice" },
    ],
  },
  { label: "Skin Problem", href: "#", children: SITE.concerns.map(c => ({ label: c.label, href: `/${c.slug}` })) },
  { label: "Formulations", href: "/products" },
  { label: "Our Expertise", href: "/about-us" },
  { label: "Contact", href: "/contact-us" },
];
export const telHref = (e164: string) => `tel:${e164.replace(/\s/g, "")}`;
export const waHref = (e164: string) => `https://wa.me/${e164.replace(/\D/g, "")}`;
