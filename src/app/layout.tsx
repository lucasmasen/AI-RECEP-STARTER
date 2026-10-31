import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Without this, Next resolves the Open Graph image against localhost, and the
// link previews as a broken image everywhere it's shared. Vercel sets
// VERCEL_PROJECT_PRODUCTION_URL at build time (no protocol, hence the prefix).
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shutoff Call: an AI receptionist for plumbers",
    template: "%s · Shutoff Call",
  },
  description:
    "Godfrey answers the calls a plumber misses, walks the caller through shutting off their water, and sends the shop their details while they're still on the line.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1821" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
