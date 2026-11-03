import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import {
  getDatabase,
  saveDatabase,
  generateEncryptedToken,
  type CustomForm,
  type FormField,
} from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const buttonText = String(body.buttonText || 'إرسال البيانات').trim()
    const successMessage = String(
      body.successMessage || 'تم استلام بياناتك بنجاح! شكراً لك.'
    ).trim()
    const rawFields = Array.isArray(body.fields) ? body.fields : []

    if (!title) {
      return NextResponse.json({ error: 'يرجى كتابة عنوان الفورم' }, { status: 400 })
    }

    if (rawFields.length === 0) {
      return NextResponse.json(
        { error: 'يرجى إضافة حقل واحد على الأقل في الفورم' },
        { status: 400 }
      )
    }

    const fields: FormField[] = rawFields.map((f: Partial<FormField>, idx: number) => ({
      id: f.id || `fld_${idx}_${Date.now()}`,
      label: String(f.label || `حقل ${idx + 1}`).trim(),
      type: f.type || 'text',
      placeholder: String(f.placeholder || '').trim(),
      required: f.required !== false,
      options: Array.isArray(f.options) ? f.options.map(String) : [],
    }))

    const db = await getDatabase()

    let encryptedSlug = generateEncryptedToken(10)
    while (db.forms.some(f => f.slug === encryptedSlug)) {
      encryptedSlug = generateEncryptedToken(10)
    }

    const newForm: CustomForm = {
      id: `frm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      slug: encryptedSlug,
      title,
      description,
      fields,
      buttonText,
      successMessage,
      views: 0,
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
    }

    db.forms.unshift(newForm)
    await saveDatabase(db)

    return NextResponse.json({ form: newForm })
  } catch (err) {
    console.error('Create form error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الفورم' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const submissionId = searchParams.get('submissionId')

    const db = await getDatabase()

    if (submissionId) {
      db.formSubmissions = db.formSubmissions.filter(s => s.id !== submissionId)
      await saveDatabase(db)
      return NextResponse.json({ ok: true })
    }

    if (formId) {
      db.forms = db.forms.filter(f => f.id !== formId)
      db.formSubmissions = db.formSubmissions.filter(s => s.formId !== formId)
      await saveDatabase(db)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })
  } catch (err) {
    console.error('Delete form error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 })
  }
}
