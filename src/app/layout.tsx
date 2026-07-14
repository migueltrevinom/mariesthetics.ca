import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  business,
  localBusinessJsonLd,
  seoKeywords,
  siteUrl,
} from "@/lib/seo";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${business.name} · Edmonton Esthetics Studio`,
    template: `%s · ${business.name}`,
  },
  description: business.description,
  keywords: seoKeywords,
  applicationName: business.name,
  authors: [{ name: business.name }],
  creator: business.name,
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: business.name,
    title: `${business.name} · Edmonton Esthetics Studio`,
    description: business.description,
    url: siteUrl,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: `${business.name} · Edmonton Esthetics Studio`,
    description: business.description,
  },
};

export const viewport = {
  themeColor: "#0b100d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <JsonLd data={localBusinessJsonLd()} />
      </body>
    </html>
  );
}
