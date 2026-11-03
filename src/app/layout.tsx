import type { Metadata } from 'next'
import './globals.css'
import Cursor from '@/components/Cursor'

export const metadata: Metadata = {
  title: 'ZYAD — Your Content. Elevated.',
  description: 'Cinematic video editor and content creator based in Cairo, serving personal brands across the Gulf market.',
  openGraph: {
    title: 'ZYAD — Your Content. Elevated.',
    description: 'Cinematic video editor. Gulf market. 48H delivery.',
    url: 'https://zyadcreative.com',
    siteName: 'ZYAD',
    images: [{ url: '/og.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Liquid Chrome Background Blobs */}
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
