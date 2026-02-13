import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import Script from "next/script";
import Analytics from "@/components/analytics/Analytics";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cookies } from "next/headers";
import PageTransition from "@/components/ui/PageTransition";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import NebulaBackground from "@/components/ui/NebulaBackground";
import ScrollProgress from "@/components/ui/ScrollProgress";

const syne = Syne({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zyad Creative | Retention-First Video Editor",
  description: "High-ticket video editing for 7-figure entrepreneurs. I don't just edit. I build Money Machines.",
  keywords: ["video editing", "retention", "short-form content", "reels", "shorts", "high-ticket", "Zyad Creative"],
  authors: [{ name: "Zyad Creative" }],
  openGraph: {
    title: "Zyad Creative | Retention-First Video Editor",
    description: "High-ticket video editing for 7-figure entrepreneurs. I don't just edit. I build Money Machines.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  // Force LTR for stable layout strategy
  const dir = 'ltr';

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        {/* Google Fonts - IBM Plex Sans Arabic for RTL */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />



      </head>
      <body className={`${syne.variable} ${inter.variable} antialiased`}>
        <Analytics />
        <LanguageProvider initialLanguage={lang}>
          <ScrollProgress />
          <NebulaBackground />
          <Navigation />
          <main className="relative pt-20">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
