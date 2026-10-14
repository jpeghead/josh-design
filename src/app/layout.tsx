import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { identityLine } from "@/content/about";
import "./globals.css";

// One typeface. SF on Apple devices, Geist everywhere else.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://josh.design"),
  title: {
    default: "Josh Whitehead",
    template: "%s — Josh Whitehead",
  },
  description: identityLine,
  authors: [{ name: "Josh Whitehead" }],
  creator: "Josh Whitehead",
  openGraph: {
    type: "website",
    siteName: "Josh Whitehead",
    title: "Josh Whitehead",
    description: identityLine,
  },
  twitter: {
    card: "summary",
    title: "Josh Whitehead",
    description: identityLine,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
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
