import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تأكيد موعد المكالمة الاستراتيجية — APX',
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

export default function BookedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
