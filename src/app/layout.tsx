import type { Metadata, Viewport } from 'next'
import './globals.css'
import Cursor from '@/components/Cursor'
import Analytics from '@/components/Analytics'
import SeoGeoSchema from '@/components/SeoGeoSchema'

export const viewport: Viewport = {
  themeColor: '#080608',
  width: 'device-width',
  initialScale: 1,
}

const SEO_TITLE =
  'زياد سعدون | Zyad Saadon — APX: منظومة البراند الشخصي والمحتوى السينمائي للخبراء'
// 149 characters (strictly <= 155 chars), includes name, 90-day promise, and الخليج ومصر
const SEO_DESC =
  'زياد سعدون (Zyad Saadon - APX): منظومة Done-For-You لبناء البراند الشخصي والفيديوهات القصيرة للخبراء لجذب عملاء مؤهلين خلال 90 يوماً في الخليج ومصر.'

export const metadata: Metadata = {
  metadataBase: new URL('https://zyadmohamed.com'),
  applicationName: 'APX — زياد سعدون | Zyad Saadon',
  title: SEO_TITLE,
  description: SEO_DESC,
  keywords: [
    'زياد سعدون',
    'Zyad Saadon',
    'زياد محمد',
    'Zyad Mohamed',
    'Zyad Mohamed APX',
    'APX',
    'بناء البراند الشخصي',
    'صناعة المحتوى للخبراء',
    'تسويق بالمحتوى في السعودية والخليج ومصر',
    'Personal Branding Saudi Arabia',
    'Personal Branding UAE',
    'Personal Branding Egypt',
  ],
  authors: [{ name: 'زياد سعدون | Zyad Saadon (APX)', url: 'https://zyadmohamed.com' }],
  creator: 'زياد سعدون (Zyad Saadon)',
  publisher: 'APX',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  alternates: {
    canonical: 'https://zyadmohamed.com',
    languages: {
      ar: 'https://zyadmohamed.com',
      'x-default': 'https://zyadmohamed.com',
      'ar-SA': 'https://zyadmohamed.com',
      'ar-AE': 'https://zyadmohamed.com',
      'ar-EG': 'https://zyadmohamed.com',
    },
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
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESC,
    url: 'https://zyadmohamed.com',
    siteName: 'زياد سعدون | Zyad Saadon — APX',
    locale: 'ar_AR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'زياد سعدون | Zyad Saadon — APX: منظومة البراند الشخصي للخبراء وأصحاب البيزنس',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESC,
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=sessionStorage.getItem('apx_theme_session_override');var isLight=s?s==='light':(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches);if(isLight){document.documentElement.classList.add('apx-light-mode');document.documentElement.style.colorScheme='light';}else{document.documentElement.classList.remove('apx-light-mode');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased selection:bg-[#8B5CF6]/30 selection:text-white">
        <SeoGeoSchema />
        <Analytics />
        {/* APX Atmospheric Background — strictly fixed & clipped so it never affects scroll height/width */}
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        >
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <Cursor />
        {children}
      </body>
    </html>
  )
}
