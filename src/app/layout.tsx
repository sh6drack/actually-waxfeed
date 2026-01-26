import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { CustomCursor } from "@/components/custom-cursor";
import { PolaritySystem } from "@/components/polarity-system";
import { FirstTimeWelcome } from "@/components/first-time-welcome";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "WAXFEED",
  description: "Discover music & friends tailored to you. Rate albums, reveal your TasteID, connect with your musical twins.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "any" },
      { url: "/logo/favicon-32.png?v=4", type: "image/png", sizes: "32x32" },
      { url: "/logo/favicon-16.png?v=4", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-touch-icon.png?v=4",
  },
  openGraph: {
    title: "WAXFEED",
    description: "Discover music & friends tailored to you. Rate albums, reveal your TasteID, connect with your musical twins.",
    type: "website",
    images: ["/logo/waxfeed-disc-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="antialiased min-h-screen transition-colors duration-200">
        <SessionProvider>
          <ThemeProvider>
            <CustomCursor />
            <Header />
            <FirstTimeWelcome />
            <main className="pt-16 pb-12">
              {children}
            </main>
            <PolaritySystem />
            <Analytics />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
