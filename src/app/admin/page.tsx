import type { Metadata } from 'next'
import { isAdminAuthenticated } from '@/lib/auth'
import AdminDashboard from '@/components/AdminDashboard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'لوحة التحكم — ZYAD',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  const authed = isAdminAuthenticated()
  return <AdminDashboard initialAuth={authed} />
}
