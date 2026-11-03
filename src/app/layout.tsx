import type { Metadata } from 'next'
import './globals.css'
import Cursor from '@/components/Cursor'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  metadataBase: new URL('https://zyadmohamed.com'),
  title: 'APX — منظومة البراند الشخصي وصناعة المحتوى للخبراء وأصحاب البيزنس',
  description:
    'نحول خبرتك إلى سلطة في مجالك ومكالمات مبيعات مستمرة خلال 90 يوماً عبر منظومة محتوى فيديو قصير Done-For-You في الخليج ومصر.',
  openGraph: {
    title: 'APX — منظومة البراند الشخصي وصناعة المحتوى',
    description:
      'نحول خبرتك إلى سلطة في مجالك ومكالمات مبيعات مستمرة خلال 90 يوماً — بدون أن تضطر للكتابة أو التصوير كل يوم.',
    url: 'https://zyadmohamed.com',
    siteName: 'APX',
    locale: 'ar_SA',
    type: 'website',
    images: [
      {
        url: '/logo/logo-primary.png',
        width: 1200,
        height: 630,
        alt: 'APX Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APX — منظومة البراند الشخصي وصناعة المحتوى',
    description:
      'نحول خبرتك إلى سلطة في مجالك ومكالمات مبيعات مستمرة خلال 90 يوماً عبر منظومة محتوى فيديو قصير في الخليج ومصر.',
    images: ['/logo/logo-primary.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
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
