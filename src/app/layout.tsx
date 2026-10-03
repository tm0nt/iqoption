import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Avalon login form. Also, you can use your Facebook or Google account to log in.",
  applicationName: "Avalon",
  appleWebApp: {
    capable: true,
    title: "Avalon",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, address: false },
  icons: {
    icon: {
      url: "/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/seo/favicon.png",
      sizes: "16x16",
      type: "image/png",
    },
  },
  openGraph: {
    url: "https://trade.avalonbroker.com",
    type: "website",
    title:
      "Forex, Stocks, ETFs & Options Trading | Avalon - online trading platform - Log in or Sign Up",
    description:
      "Trade on Futurex for stocks, ETFs, and forex with Avalon, a rapidly expanding online trading platform. Join Avalon today!",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Forex, Stocks, ETFs & Options Trading | Avalon - online trading platform - Log in or Sign Up",
    description:
      "Trade on Futurex for stocks, ETFs, and forex with Avalon, a rapidly expanding online trading platform. Join Avalon today!",
  },
};

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
