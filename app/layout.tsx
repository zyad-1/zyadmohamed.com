import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
<<<<<<< HEAD
import Script from "next/script";
=======
>>>>>>> f8c8befe691c1ecbc01da38ed43a9912fad826ca
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

        {/* Microsoft Clarity Analytics */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vdw3ceml6f");
          `}
        </Script>

        {/* Google Analytics 4 */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-8664952B33`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8664952B33');
          `}
        </Script>
      </head>
      <body className={`${syne.variable} ${inter.variable} antialiased`}>
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
