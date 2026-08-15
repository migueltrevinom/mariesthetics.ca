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

import { LanguageProvider } from "@/components/i18n/LanguageContext";

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
    <html lang="en-CA" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Block crypto wallet injections and access
                  try {
                    Object.defineProperty(window, 'ethereum', { value: undefined, writable: false, configurable: false });
                    Object.defineProperty(window, 'web3', { value: undefined, writable: false, configurable: false });
                    Object.defineProperty(window, 'solana', { value: undefined, writable: false, configurable: false });
                    Object.defineProperty(window, 'phantom', { value: undefined, writable: false, configurable: false });
                  } catch (e) {}

                  // Suppress unhandled third-party / crypto extension errors
                  window.addEventListener('error', function(e) {
                    if (e.filename && (e.filename.indexOf('chrome-extension:') !== -1 || e.filename.indexOf('moz-extension:') !== -1 || e.filename.indexOf('inpage.js') !== -1)) {
                      e.stopImmediatePropagation();
                      e.preventDefault();
                      return true;
                    }
                    if (e.message && (e.message.indexOf('MetaMask') !== -1 || e.message.indexOf('ethereum') !== -1 || e.message.indexOf('wallet') !== -1)) {
                      e.stopImmediatePropagation();
                      e.preventDefault();
                      return true;
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function(e) {
                    var reason = e.reason && (e.reason.message || e.reason.stack || String(e.reason));
                    if (typeof reason === 'string' && (reason.indexOf('MetaMask') !== -1 || reason.indexOf('chrome-extension:') !== -1 || reason.indexOf('ethereum') !== -1 || reason.indexOf('wallet') !== -1)) {
                      e.stopImmediatePropagation();
                      e.preventDefault();
                    }
                  }, true);

                  var theme = localStorage.getItem('theme') || 'auto';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    var hour = new Date().getHours();
                    var isNightTime = hour >= 19 || hour < 7;
                    var isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (isNightTime || isSystemDark) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.classList.remove('light');
                    } else {
                      document.documentElement.classList.add('light');
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <LanguageProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          {children}
          <JsonLd data={localBusinessJsonLd()} />
        </LanguageProvider>
      </body>
    </html>
  );
}
