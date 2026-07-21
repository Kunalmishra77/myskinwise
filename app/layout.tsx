import type { Metadata } from "next";
import { Cormorant_Garamond, Fraunces, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";
import { organizationSchema } from "@/config/seo";
import { JsonLd } from "@/components/features/json-ld";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Homepage (app/page.tsx) typography — added alongside Fraunces/Inter
// (never replacing them) since the (marketing) route group's pages still
// depend on --font-serif/--font-sans.
const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
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
      className={`${serif.variable} ${sans.variable} ${displaySerif.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationSchema} />
        {children}
      </body>
    </html>
  );
}
