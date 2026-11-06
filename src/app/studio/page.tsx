'use client'

import React from 'react'
import '@/modules/audit/theme/tokens.css'
import { apxFontVariables } from '@/modules/audit/theme/fonts'
import AdminDocumentStudioView from '@/components/admin/AdminDocumentStudioView'

export default function DocumentStudioPublicPage() {
  return (
    <div className={`${apxFontVariables} min-h-screen bg-[#07060B] text-[#F5F2FF]`}>
      <AdminDocumentStudioView adminLang="ar" mode="contract" standalonePublicMode />
    </div>
  )
}
