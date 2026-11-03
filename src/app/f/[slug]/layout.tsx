import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'نموذج التسجيل — APX',
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

export default function CustomFormLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
