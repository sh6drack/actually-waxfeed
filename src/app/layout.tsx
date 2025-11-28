import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { Header } from "@/components/header";
import { CustomCursor } from "@/components/custom-cursor";

export const metadata: Metadata = {
  title: "WAXFEED",
  description: "A social music review platform - Letterboxd for music",
  openGraph: {
    title: "WAXFEED",
    description: "A social music review platform - Letterboxd for music",
    type: "website",
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
        </SessionProvider>
      </body>
    </html>
  );
}
