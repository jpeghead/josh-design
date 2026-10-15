import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { identityLine } from "@/content/about";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

// Geist carries the interface and the body. Instrument Serif carries the story.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://josh.design"),
  title: {
    default: "Josh Whitehead — designer who builds AI products",
    template: "%s — Josh Whitehead",
  },
  description: identityLine,
  authors: [{ name: "Josh Whitehead" }],
  creator: "Josh Whitehead",
  openGraph: {
    type: "website",
    siteName: "Josh Whitehead",
    title: "Josh Whitehead — designer who builds AI products",
    description: identityLine,
    url: "https://josh.design",
  },
  twitter: {
    card: "summary_large_image",
    title: "Josh Whitehead — designer who builds AI products",
    description: identityLine,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* lets CSS gate reveal animations on JavaScript being present, before first paint */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <JsonLd />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
