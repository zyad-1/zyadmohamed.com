import { NextResponse } from 'next/server'
import {
  getDatabase,
  saveDatabase,
  validateRealEmail,
  DEFAULT_MAIN_FUNNEL_FORM,
} from '@/lib/storage'
import { DEFAULT_SITE_SETTINGS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDatabase()
    const funnelForm =
      db.forms.find(f => f.id === 'frm_funnel_main' || f.slug === 'funnel-qualification') ||
      DEFAULT_MAIN_FUNNEL_FORM
    const siteSettings = db.siteSettings || DEFAULT_SITE_SETTINGS
    return NextResponse.json({ form: funnelForm, siteSettings })
  } catch {
    return NextResponse.json({
      form: DEFAULT_MAIN_FUNNEL_FORM,
      siteSettings: DEFAULT_SITE_SETTINGS,
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const db = await getDatabase()

    const funnelForm =
      db.forms.find(f => f.id === 'frm_funnel_main' || f.slug === 'funnel-qualification') ||
      DEFAULT_MAIN_FUNNEL_FORM

    const rawAnswers: Record<string, string> =
      body.answers && typeof body.answers === 'object' ? body.answers : {}

    const cleanedAnswers: Record<string, string> = {}
    for (const field of funnelForm.fields) {
      const val = String(rawAnswers[field.label] || rawAnswers[field.id] || '').trim()
      if (field.required && !val) {
        return NextResponse.json(
          { error: `يرجى إكمال الحقل المطلوب: ${field.label}` },
          { status: 400 }
        )
      }
      if (field.type === 'email' && val) {
        const emailCheck = validateRealEmail(val)
        if (!emailCheck.valid) {
          return NextResponse.json(
            { error: emailCheck.message || 'يرجى إدخال بريد إلكتروني حقيقي وصحيح.' },
            { status: 400 }
          )
        }
      }
      cleanedAnswers[field.label] = val || '—'
    }

    const disqualifyTarget = (funnelForm.disqualifyOption || 'أقل من $2,700').trim()
    const isUnqualified = Object.values(cleanedAnswers).some(
      ans => ans.trim() === disqualifyTarget
    )

    cleanedAnswers['حالة التأهيل'] = isUnqualified
      ? `غير مؤهل (${disqualifyTarget}) — تم تحويله للدليل المجاني`
      : 'مؤهل — فُتح له تقويم Calendly'

    funnelForm.submissionsCount = (funnelForm.submissionsCount || 0) + 1

    db.formSubmissions.unshift({
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      formId: funnelForm.id,
      formTitle: funnelForm.title,
      formSlug: funnelForm.slug,
      answers: cleanedAnswers,
      createdAt: new Date().toISOString(),
    })

    const defaultMagnetSlug = db.magnets[0]?.slug || '5d9b6c24bb6044'
    await saveDatabase(db)

    if (isUnqualified) {
      return NextResponse.json({
        qualified: false,
        redirectUrl: `/d/${encodeURIComponent(defaultMagnetSlug)}?from=funnel`,
      })
    }

    return NextResponse.json({
      qualified: true,
    })
  } catch (err) {
    console.error('Funnel qualification error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة البيانات، يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    )
  }
}
