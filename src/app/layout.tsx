import type { Metadata, Viewport } from "next";
import { Playfair_Display, Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CommandPalette } from "@/components/command-palette";
import { DevelopEasterEgg } from "@/components/develop-easter-egg";
import "./globals.css";

// High-contrast serif display + clean grotesque sans, self-hosted by next/font.
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});
const sans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://josh.design"),
  title: {
    default: "Josh Whitehead — The Archive",
    template: "%s · Josh Whitehead",
  },
  description:
    "Josh Whitehead — designer and builder. A continuous walk through a life's work, from a kid who drew all day to a Marine combat photographer to leading design and building his own studio, Boneyard.",
  authors: [{ name: "Josh Whitehead" }],
  creator: "Josh Whitehead",
  openGraph: {
    type: "website",
    siteName: "Josh Whitehead",
    title: "Josh Whitehead — The Archive",
    description:
      "Designer and builder. I make the interface, the system, and the thing that ships.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Josh Whitehead — The Archive",
    description:
      "Designer and builder. I make the interface, the system, and the thing that ships.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4eee2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-bone"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <CommandPalette />
        <DevelopEasterEgg />
      </body>
    </html>
  );
}
