import React from 'react'
import { getSessionUser } from '@/modules/audit/server/auth'
import { AuditAdminAuthGate } from '@/modules/audit/components/admin/AuditAdminAuthGate'
import AuditsDashboard from '@/modules/audit/components/admin/AuditsDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminAuditsPage() {
  const user = await getSessionUser()
  const isAuthenticated = Boolean(user && user.role === 'ADMIN')

  return (
    <AuditAdminAuthGate initialAuthenticated={isAuthenticated}>
      <AuditsDashboard />
    </AuditAdminAuthGate>
  )
}
