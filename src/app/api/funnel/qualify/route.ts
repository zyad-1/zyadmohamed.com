import { NextResponse } from 'next/server'
import {
  getDatabase,
  saveDatabase,
  validateRealEmail,
  DEFAULT_MAIN_FUNNEL_FORM,
} from '@/lib/storage'
import { DEFAULT_SITE_SETTINGS, DEFAULT_UNQUALIFIED_MESSAGE } from '@/lib/constants'
import { validatePhoneForCountry } from '@/lib/countries'

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
    let isUnqualified = false
    let disqualifyReason = ''

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
      if (field.type === 'tel' && val) {
        const phoneCheck = validatePhoneForCountry(val, body.countryCode)
        if (!phoneCheck.valid) {
          return NextResponse.json(
            { error: phoneCheck.errorAr || 'يرجى إدخال رقم هاتف صحيح ومكتمل.' },
            { status: 400 }
          )
        }
      }
      cleanedAnswers[field.label] = val || '—'

      // Check per-option qualification flag
      if (field.type === 'select' && val && Array.isArray(field.optionItems)) {
        const matchedOption = field.optionItems.find(
          opt => opt.text.trim() === val.trim()
        )
        if (matchedOption && matchedOption.qualified === false) {
          isUnqualified = true
          disqualifyReason = matchedOption.text
        }
      }
    }

    // Legacy fallback if optionItems weren't matched
    if (!isUnqualified && funnelForm.disqualifyOption) {
      const target = funnelForm.disqualifyOption.trim()
      if (Object.values(cleanedAnswers).some(ans => ans.trim() === target)) {
        isUnqualified = true
        disqualifyReason = target
      }
    }

    cleanedAnswers['حالة التأهيل'] = isUnqualified
      ? `غير مؤهل (${disqualifyReason}) — تم تحويله للصفحة البديلة`
      : 'مؤهل — فُتح له تقويم Calendly'

    funnelForm.submissionsCount = (funnelForm.submissionsCount || 0) + 1

    const headerCountry =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-country-code')
    const submittedCountryCode = String(body.countryCode || headerCountry || '').trim().toUpperCase()
    const submittedCountryName = String(body.countryName || '').trim()

    db.formSubmissions.unshift({
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      formId: funnelForm.id,
      formTitle: funnelForm.title,
      formSlug: funnelForm.slug,
      answers: cleanedAnswers,
      qualified: !isUnqualified,
      countryCode: submittedCountryCode || undefined,
      countryName: submittedCountryName || undefined,
      createdAt: new Date().toISOString(),
    })

    const settings = db.siteSettings || DEFAULT_SITE_SETTINGS
    const unqualifiedMessage =
      settings.unqualifiedMessage || DEFAULT_UNQUALIFIED_MESSAGE

    // Determine redirect target for unqualified leads
    const defaultMagnetSlug = db.magnets[0]?.slug || '5d9b6c24bb6044'
    let redirectUrl = `/d/${encodeURIComponent(defaultMagnetSlug)}?from=funnel`

    const customTarget = (settings.unqualifiedRedirectTarget || '').trim()
    if (customTarget) {
      if (customTarget.startsWith('http://') || customTarget.startsWith('https://') || customTarget.startsWith('/')) {
        redirectUrl = customTarget.includes('?')
          ? `${customTarget}&from=funnel`
          : `${customTarget}?from=funnel`
      } else {
        // It's a magnet slug
        redirectUrl = `/d/${encodeURIComponent(customTarget)}?from=funnel`
      }
    }

    await saveDatabase(db)

    if (isUnqualified) {
      return NextResponse.json({
        qualified: false,
        unqualifiedMessage,
        redirectUrl,
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
