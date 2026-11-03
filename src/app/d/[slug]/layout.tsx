import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تحميل الملف — APX',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function MagnetDownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
