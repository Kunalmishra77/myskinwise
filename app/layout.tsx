import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";
import { organizationSchema } from "@/config/seo";
import { JsonLd } from "@/components/features/json-ld";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Skinwise", template: "%s | Skinwise" },
  description: "Skinwise — dermatologist-formulated, tailor-made skincare for pigmentation, acne, and other skin concerns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationSchema} />
        {children}
      </body>
    </html>
  );
}
