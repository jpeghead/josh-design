import type { Metadata, Viewport } from "next";
import { Italiana, Inter_Tight, Geist_Mono } from "next/font/google";
import { SpotlightCursor } from "@/components/spotlight-cursor";
import { CommandPalette } from "@/components/command-palette";
import { MenuBar } from "@/components/menu-bar";
import { DevelopEasterEgg } from "@/components/develop-easter-egg";
import { BootSequence } from "@/components/boot-sequence";
import { Notification } from "@/components/notification";
import { WindowProvider } from "@/lib/window-store";
import { SettingsProvider } from "@/lib/settings-store";
import { AiProvider } from "@/lib/ai-bus";
import { SoundBridge } from "@/components/os/sound-bridge";
import { LockScreen } from "@/components/os/lock-screen";
import { DarkroomOS } from "@/components/os/darkroom-os";
import { CoPilot } from "@/components/os/co-pilot";
import "./globals.css";

const sans = Inter_Tight({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const display = Italiana({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://josh.design"),
  title: {
    default: "Josh Whitehead — Atelier",
    template: "%s · Josh Whitehead",
  },
  description:
    "Josh Whitehead — designer, maker, tinkerer. Fifteen years of product design rendered as a working desktop. From Spin, Hush, and Boneyard Collective.",
  authors: [{ name: "Josh Whitehead" }],
  creator: "Josh Whitehead",
  openGraph: {
    type: "website",
    siteName: "Josh Whitehead",
    title: "Josh Whitehead — Atelier",
    description:
      "Fifteen years of product design. Ten million users. Six times a founder.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Josh Whitehead — Atelier",
    description:
      "Fifteen years of product design. Ten million users. Six times a founder.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <body className="h-[100dvh] overflow-hidden antialiased">
        <SettingsProvider>
          <WindowProvider>
            <AiProvider>
              <SoundBridge />
              <BootSequence />
              <SpotlightCursor />
              <MenuBar />
              <Notification />
              {/* The OS shell — desktop + windows + dock */}
              <DarkroomOS />
              {/* Pages render thin shells that signal the WM to open windows. */}
              <div className="hidden">{children}</div>
              <CommandPalette />
              <CoPilot />
              <DevelopEasterEgg />
              <LockScreen />
            </AiProvider>
          </WindowProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
