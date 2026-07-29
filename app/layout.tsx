import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";
import { organizationSchema } from "@/config/seo";
import { JsonLd } from "@/components/features/json-ld";
import { LanguageProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";

/*
 * Two families, not four. Fraunces and Inter were loaded here alongside
 * these two while the homepage rebuild ran on its own parallel design
 * system; consolidating onto one palette (see app/globals.css) makes them
 * dead weight, so they are gone.
 *
 * The CSS variables are named `-family` to keep them distinct from the
 * Tailwind theme tokens that consume them (`--font-display` /
 * `--font-body` in @theme). Pointing a theme token at a next/font variable
 * of the same name would be self-referential.
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display-family",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body-family",
  display: "swap",
});

/*
 * Devanagari for Hindi. Manrope and Cormorant are Latin-only, so without this
 * every Hindi glyph would fall back to whatever the OS provides, which is
 * inconsistent across devices. The font stack in globals.css lists this after
 * the Latin families, so browsers pick it per-glyph — Latin text stays
 * Manrope, Hindi text renders in Noto — with no locale conditional needed.
 */
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Skinwise", template: "%s | Skinwise" },
  description: "Skinwise — dermatologist-formulated, tailor-made skincare for pigmentation, acne, and other skin concerns.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationSchema} />
        <LanguageProvider locale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
