import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { setting } from "@/lib/engine/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// trade.avalonbroker.com serves Montserrat 400/500/600/700/900 from Google Fonts.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

/**
 * The platform's name, as the browser and a shared link see it.
 *
 * This was a static block carrying one brand's name, descriptions and
 * favicon — which made renaming the platform a code change in four places and
 * a deploy. It is a row now, like the logo and the accent beside it, so the
 * Brand screen is the only place a name lives.
 *
 * The cost is that the pages under this layout are rendered per request rather
 * than prerendered, because the title is no longer known at build time. Next
 * streams metadata, so it does not hold the page up; what it costs is one
 * indexed lookup, against a platform that reads its instrument catalogue from
 * the same database on every view.
 *
 * `title` stays "Log In" as a default: a route that sets its own replaces it,
 * and the ones that do not are the auth pages.
 */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await setting("brand");

  // What a link preview shows: the headline, then the name that is offering it.
  const card = brand.tagline ? `${brand.tagline} | ${brand.name}` : brand.name;

  return {
    title: "Log In",
    description: brand.description,
    applicationName: brand.name,
    appleWebApp: {
      capable: true,
      title: brand.name,
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false, address: false },
    /*
     * Served rather than linked to a file: an uploaded icon lands outside
     * `public`, and the route falls back to the build's own when nothing has
     * been uploaded, so this one URL is right either way.
     */
    icons: { icon: { url: "/api/brand/logo/icon", type: "image/png" } },
    // An address nobody has set would point a card at the wrong host.
    ...(brand.siteUrl ? { metadataBase: new URL(brand.siteUrl) } : {}),
    openGraph: {
      ...(brand.siteUrl ? { url: brand.siteUrl } : {}),
      type: "website",
      siteName: brand.name,
      title: card,
      description: brand.description,
    },
    twitter: {
      card: "summary_large_image",
      title: card,
      description: brand.description,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
