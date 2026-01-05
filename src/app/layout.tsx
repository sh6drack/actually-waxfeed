import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { Header } from "@/components/header";
import { CustomCursor } from "@/components/custom-cursor";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "WAXFEED",
  description: "A social music review platform - Letterboxd for music",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/logo/favicon-32.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/logo/favicon-16.png?v=2", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-touch-icon.png?v=2",
  },
  openGraph: {
    title: "WAXFEED",
    description: "A social music review platform - Letterboxd for music",
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
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#0a0a0a] text-[#ededed]">
        <SessionProvider>
          <CustomCursor />
          <Header />
          <main className="pt-16">
            {children}
          </main>
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
