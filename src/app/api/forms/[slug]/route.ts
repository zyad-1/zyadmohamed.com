import { NextResponse } from 'next/server'
import {
  getDatabase,
  saveDatabase,
  validateRealEmail,
  type CustomForm,
} from '@/lib/storage'

export const dynamic = 'force-dynamic'

function decodeFallbackForm(slug: string, encoded: string | null): CustomForm | null {
  if (!encoded) return null
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8')
    const data = JSON.parse(json)
    return {
      id: data.id || `frm_${slug}`,
      slug,
      title: data.t || 'فورم التسجيل',
      description: data.d || '',
      fields: Array.isArray(data.f) ? data.f : [],
      buttonText: data.bt || 'إرسال البيانات',
      successMessage: data.sm || 'تم استلام بياناتك بنجاح! شكراً لك.',
      views: 1,
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const decodedSlug = decodeURIComponent(params.slug)
    const { searchParams } = new URL(request.url)
    const fallbackParam = searchParams.get('d')

    const db = await getDatabase()
    let form = db.forms.find(f => f.slug === decodedSlug)

    if (!form && fallbackParam) {
      const fallback = decodeFallbackForm(decodedSlug, fallbackParam)
      if (fallback) {
        form = fallback
        db.forms.unshift(fallback)
      }
    }

    if (!form) {
      return NextResponse.json({ error: 'الفورم غير موجود' }, { status: 404 })
    }

    form.views = (form.views || 0) + 1
    await saveDatabase(db)

    return NextResponse.json({ form })
  } catch (err) {
    console.error('Get public form error:', err)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const decodedSlug = decodeURIComponent(params.slug)
    const body = await request.json()
    const answers = (body.answers || {}) as Record<string, string>

    const db = await getDatabase()
    let form = db.forms.find(f => f.slug === decodedSlug)

    if (!form && body.fallbackData) {
      const fallback = decodeFallbackForm(decodedSlug, String(body.fallbackData))
      if (fallback) {
        form = fallback
        db.forms.unshift(fallback)
      }
    }

    if (!form) {
      return NextResponse.json({ error: 'الفورم غير موجود' }, { status: 404 })
    }

    // Validate required fields and email fields
    for (const field of form.fields) {
      const val = String(answers[field.label] || '').trim()
      if (field.required && !val) {
        return NextResponse.json(
          { error: `يرجى ملء حقل: ${field.label}` },
          { status: 400 }
        )
      }
      if (val && field.type === 'email') {
        const emailCheck = validateRealEmail(val)
        if (!emailCheck.valid) {
          return NextResponse.json({ error: emailCheck.message }, { status: 400 })
        }
      }
    }

    db.formSubmissions.unshift({
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      formId: form.id,
      formTitle: form.title,
      formSlug: form.slug,
      answers,
      createdAt: new Date().toISOString(),
    })

    form.submissionsCount = (form.submissionsCount || 0) + 1
    await saveDatabase(db)

    return NextResponse.json({
      ok: true,
      successMessage: form.successMessage,
    })
  } catch (err) {
    console.error('Submit form error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال الفورم' }, { status: 500 })
  }
}
