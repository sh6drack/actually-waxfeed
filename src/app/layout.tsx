import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-technical",
  display: "swap",
});
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { CustomizationProvider } from "@/components/customization-provider";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { CustomCursor } from "@/components/custom-cursor";
import { PolaritySystem } from "@/components/polarity-system";
import { FirstTimeWelcome } from "@/components/first-time-welcome";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { ErrorBoundary } from "@/components/error-boundary";
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
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme by setting class before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('waxfeed-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen transition-colors duration-200" suppressHydrationWarning>
        <SessionProvider>
          <ThemeProvider>
            <CustomizationProvider>
              <CustomCursor />
              <Header />
              <OnboardingGuard />
              <FirstTimeWelcome />
              <ErrorBoundary>
                <main className="pt-16 pb-24 lg:pb-12">
                  {children}
                </main>
              </ErrorBoundary>
              <BottomNav />
              <PolaritySystem />
              <Analytics />
            </CustomizationProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
