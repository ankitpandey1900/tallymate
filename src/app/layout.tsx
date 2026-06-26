import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import Toaster from "@/components/ui/Toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tallymate.alltracker.online"),
  title: {
    default: "Tallymate - Personal Finance & Bill Splitting",
    template: "%s | Tallymate",
  },
  description: "Track your personal expenses, set monthly budgets, and split bills with friends seamlessly in one unified app.",
  keywords: ["personal finance", "expense tracker", "bill splitting", "budgeting app", "split expenses", "Splitwise alternative", "finance app India"],
  authors: [{ name: "Ankit Pandey" }],
  creator: "Ankit Pandey",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://tallymate.alltracker.online",
    title: "Tallymate - Master your money. Together.",
    description: "Track spending, split bills with friends, and stay on budget — all in one simple app.",
    siteName: "Tallymate",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tallymate Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tallymate - Master your money. Together.",
    description: "Track spending, split bills with friends, and stay on budget — all in one simple app.",
    images: ["/og-image.png"],
    creator: "@AnkitPande5641",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();
`;

import NextTopLoader from 'nextjs-toploader';

import { CSPostHogProvider } from "@/components/providers/PostHogProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <NextTopLoader color="#10B981" showSpinner={false} height={3} shadow="0 0 10px #10B981,0 0 5px #10B981" />
        <CSPostHogProvider>
          {children}
          <Toaster />
        </CSPostHogProvider>
      </body>
    </html>
  );
}
