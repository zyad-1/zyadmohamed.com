import React from 'react'
import { getSessionUser } from '@/modules/audit/server/auth'
import { AuditAdminAuthGate } from '@/modules/audit/components/admin/AuditAdminAuthGate'
import AuditWizard from '@/modules/audit/components/admin/AuditWizard'

export const dynamic = 'force-dynamic'

export default async function AdminAuditWizardPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getSessionUser()
  const isAuthenticated = Boolean(user && user.role === 'ADMIN')

  return (
    <AuditAdminAuthGate initialAuthenticated={isAuthenticated}>
      <AuditWizard auditId={params.id} />
    </AuditAdminAuthGate>
  )
}
