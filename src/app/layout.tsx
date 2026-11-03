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

export const metadata: Metadata = {
  metadataBase: new URL('https://zyadmohamed.com'),
  applicationName: 'APX',
  title: {
    default: 'APX | منظومة البراند الشخصي وصناعة المحتوى للخبراء وأصحاب البيزنس',
    template: '%s | APX',
  },
  description:
    'في APX نحول خبرتك إلى براند شخصي قوي ومنظومة فيديوهات قصيرة (Reels · TikTok · Shorts) تجلب لك عملاء مؤهلين ومكالمات مبيعات خلال 90 يوماً. نكتب السكريبتات ونعطيك توجيهات التصوير ونتولى المونتاج وربط الـ Funnel بالكامل في السعودية والخليج ومصر.',
  keywords: [
    'APX',
    'بناء البراند الشخصي',
    'صناعة المحتوى',
    'تسويق بالمحتوى',
    'مونتاج ريلز احترافي',
    'كتابة سكريبتات ريلز',
    'وكالة براند شخصي في السعودية',
    'وكالة صناعة محتوى في الخليج',
    'تسويق للأطباء والاستشاريين',
    'Personal Branding Agency Saudi Arabia',
    'Personal Branding Dubai',
    'Short Form Video Agency MENA',
    'Done For You Content Marketing',
    'زياد سعدون',
    'Zyad Saadon',
  ],
  authors: [{ name: 'APX', url: 'https://zyadmohamed.com' }],
  creator: 'APX',
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
      'ar-SA': 'https://zyadmohamed.com',
      'ar-AE': 'https://zyadmohamed.com',
      'ar-KW': 'https://zyadmohamed.com',
      'ar-QA': 'https://zyadmohamed.com',
      'ar-EG': 'https://zyadmohamed.com',
      ar: 'https://zyadmohamed.com',
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
    title: 'APX | منظومة البراند الشخصي وصناعة المحتوى للخبراء وأصحاب البيزنس',
    description:
      'نكتب السكريبتات ونعطيك توجيهات التصوير لتصوّر من مكانك في جلسة واحدة — ثم نستلم الفيديوهات ونتولى المونتاج وربط الـ Funnel لجذب عملاء مؤهلين خلال 90 يوماً.',
    url: 'https://zyadmohamed.com',
    siteName: 'APX',
    locale: 'ar_SA',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'APX — Personal Branding & Short-Form Video Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APX | منظومة البراند الشخصي وصناعة المحتوى',
    description:
      'نحول خبرتك إلى براند شخصي قوي ومنظومة فيديوهات قصيرة تجلب لك عملاء مؤهلين خلال 90 يوماً في الخليج ومصر.',
    images: ['/og-image.png'],
  },
  other: {
    'geo.region': 'SA;AE;EG;KW;QA',
    'geo.placename': 'Riyadh, Dubai, Cairo',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SeoGeoSchema />
        <Analytics />
        {/* APX Atmospheric Background Blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />

        <Cursor />
        {children}
      </body>
    </html>
  )
}
