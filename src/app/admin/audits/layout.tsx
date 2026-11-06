import React from 'react'
import type { Metadata } from 'next'
import { AuditTRPCProvider } from '@/modules/audit/client/trpc'

export const metadata: Metadata = {
  title: 'APX Audit Engine — Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuditAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuditTRPCProvider>{children}</AuditTRPCProvider>
}
