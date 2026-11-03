import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getDatabase, saveDatabase } from '@/lib/storage'
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  type TestimonialItem,
  type ProofCardItem,
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDatabase()
  return NextResponse.json({
    siteSettings: db.siteSettings || DEFAULT_SITE_SETTINGS,
  })
}

export async function PUT(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const db = await getDatabase()
    const current = db.siteSettings || DEFAULT_SITE_SETTINGS

    const updated: SiteSettings = {
      showTestimonialsSection:
        typeof body.showTestimonialsSection === 'boolean'
          ? body.showTestimonialsSection
          : current.showTestimonialsSection,
      showProofCards:
        typeof body.showProofCards === 'boolean'
          ? body.showProofCards
          : current.showProofCards,
      skipQualificationForm:
        typeof body.skipQualificationForm === 'boolean'
          ? body.skipQualificationForm
          : current.skipQualificationForm,
      calendlyUrl:
        typeof body.calendlyUrl === 'string' && body.calendlyUrl.trim()
          ? body.calendlyUrl.trim()
          : current.calendlyUrl,
      proofCards: Array.isArray(body.proofCards)
        ? body.proofCards.map((c: Partial<ProofCardItem>, i: number) => ({
            id: String(c.id || `proof-${Date.now()}-${i}`),
            metric: String(c.metric || '').trim(),
            unit: String(c.unit || '').trim(),
            desc: String(c.desc || '').trim(),
            visible: typeof c.visible === 'boolean' ? c.visible : true,
          }))
        : current.proofCards,
      testimonials: Array.isArray(body.testimonials)
        ? body.testimonials.map((t: Partial<TestimonialItem>, i: number) => ({
            id: String(t.id || `shot-${Date.now()}-${i}`),
            clientTag: String(t.clientTag || '').trim(),
            beforeAfter: String(t.beforeAfter || '').trim(),
            quotePreview: String(t.quotePreview || '').trim(),
            imageUrl: String(t.imageUrl || '').trim(),
            visible: typeof t.visible === 'boolean' ? t.visible : true,
          }))
        : current.testimonials,
    }

    db.siteSettings = updated
    await saveDatabase(db)

    return NextResponse.json({ siteSettings: updated })
  } catch (err) {
    console.error('Update siteSettings error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الإعدادات' },
      { status: 500 }
    )
  }
}
