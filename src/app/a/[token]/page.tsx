import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicAuditByToken } from '@/modules/audit/server/service'
import AuditReportView from '@/modules/audit/components/report/AuditReportView'
import ApxMark from '@/modules/audit/components/brand/ApxMark'
import { apxFontVariables } from '@/modules/audit/theme/fonts'
import '@/modules/audit/theme/tokens.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'APX Private Instagram Audit Report',
  description: 'Confidential Outside-In Instagram Audit prepared by APX.',
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

export default async function PublicAuditReportPage({
  params,
  searchParams,
}: {
  params: { token: string }
  searchParams?: { preview?: string }
}) {
  const isAdminPreview = searchParams?.preview === '1'
  const result = await getPublicAuditByToken(params.token, {
    allowPreview: isAdminPreview,
  })

  if (result.status !== 'OK' || !result.data) {
    const isUnpublished = result.status === 'UNPUBLISHED'
    const isExpired = result.status === 'EXPIRED'

    return (
      <div
        dir="rtl"
        lang="ar"
        className={`apx-audit ${apxFontVariables} min-h-screen bg-[#080608] text-[#E2D9F3] flex items-center justify-center p-6 relative overflow-hidden`}
      >
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-[#8B5CF6]/15 blur-[130px]" />
        <div className="apx-glass max-w-lg w-full rounded-3xl p-8 sm:p-10 text-center space-y-6 border border-[#8B5CF6]/30 relative z-10 shadow-[0_25px_70px_-15px_rgba(139,92,246,0.3)]">
          <div className="flex justify-center">
            <div className="drop-shadow-[0_0_18px_rgba(139,92,246,0.65)] scale-90">
              <ApxMark size={36} showWordmark />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {isUnpublished
              ? 'الرابط غير متاح حالياً (Offline)'
              : isExpired
                ? 'انتهت صلاحية عرض التقرير'
                : 'الرابط غير موجود'}
          </div>

          <h1 className="apx-display-heading text-2xl sm:text-3xl font-bold text-white leading-snug">
            {isUnpublished
              ? 'هذا التقرير غير منشور أو تم إيقاف عرضه حالياً'
              : isExpired
                ? 'انتهت فترة إتاحة رابط التقرير التشخيصي'
                : 'رابط التقرير غير متاح أو غير صحيح'}
          </h1>

          <p className="text-sm text-[#E2D9F3]/75 leading-relaxed">
            {isUnpublished
              ? 'تم إيقاف هذا الرابط مؤقتاً من قِبل إدارة APX أو أنه قيد التحديث حالياً. يمكنك التواصل معنا مباشرة لإعادة تفعيل التقرير الخاص بك.'
              : isExpired
                ? 'تقارير الفحص الخاصة تكون متاحة لمدة محددة (7 أيام) لحفظ خصوصية بيانات الحساب. تواصل مع فريق APX لتجديد صلاحية الرابط.'
                : 'يرجى التأكد من نسخ الرابط الكامل الصحيح أو التواصل مع فريق APX للحصول على رابط التقرير المحدّث.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="apx-cta-primary px-6 py-3 rounded-2xl text-xs font-bold text-white transition-all"
            >
              العودة إلى الموقع الرئيسي
            </Link>
          </div>

          <p className="text-[11px] text-[#E2D9F3]/40 pt-2" dir="ltr">
            {isUnpublished
              ? 'Status: Link Offline / Unpublished by APX Studio'
              : isExpired
                ? 'Status: Report Link Expired'
                : 'Status: Invalid or Unknown Audit Share Token'}
          </p>
        </div>
      </div>
    )
  }

  return <AuditReportView report={result.data} isPreviewMode={isAdminPreview} />
}
