import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import {
  getDatabase,
  saveDatabase,
  deleteBlobFileIfNeeded,
  isBlobConfigured,
  generateEncryptedToken,
  type LeadMagnet,
} from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDatabase()
  const storageMode = isBlobConfigured()
    ? 'vercel-blob'
    : process.env.VERCEL
    ? 'vercel-tmp'
    : 'local'

  return NextResponse.json({
    magnets: db.magnets,
    leads: db.leads,
    forms: db.forms,
    formSubmissions: db.formSubmissions,
    siteSettings: db.siteSettings,
    storageMode,
  })
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const fileUrl = String(body.fileUrl || '').trim()
    const fileName = String(body.fileName || title || 'file').trim()
    const fileSize = Number(body.fileSize || 0)
    const fileType = String(body.fileType || 'FILE').trim().toUpperCase()
    const isExternal = Boolean(body.isExternal)
    const requireLead = Boolean(body.requireLead)
    const buttonText = String(body.buttonText || 'تحميل الملف الآن').trim()

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: 'يرجى إدخال عنوان الملف ورفع الملف أو وضع الرابط' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Always generate an encrypted random token for the link so it never matches the file name
    let encryptedSlug = generateEncryptedToken(10)
    while (db.magnets.some(m => m.slug === encryptedSlug)) {
      encryptedSlug = generateEncryptedToken(10)
    }

    const newMagnet: LeadMagnet = {
      id: `mag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      slug: encryptedSlug,
      title,
      description,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      isExternal,
      requireLead,
      collectFields: {
        name: body.collectFields?.name !== false,
        phone: body.collectFields?.phone !== false,
        email: body.collectFields?.email !== false,
      },
      buttonText,
      views: 0,
      downloads: 0,
      createdAt: new Date().toISOString(),
    }

    db.magnets.unshift(newMagnet)
    await saveDatabase(db)

    return NextResponse.json({ magnet: newMagnet })
  } catch (err) {
    console.error('Create magnet error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الملف' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const id = String(body.id || '')
    const db = await getDatabase()
    const idx = db.magnets.findIndex(m => m.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
    }

    const current = db.magnets[idx]

    if (typeof body.title === 'string' && body.title.trim()) {
      current.title = body.title.trim()
    }
    if (typeof body.description === 'string') {
      current.description = body.description.trim()
    }
    if (typeof body.buttonText === 'string' && body.buttonText.trim()) {
      current.buttonText = body.buttonText.trim()
    }
    if (typeof body.requireLead === 'boolean') {
      current.requireLead = body.requireLead
    }
    if (body.collectFields) {
      current.collectFields = {
        name: Boolean(body.collectFields.name),
        phone: Boolean(body.collectFields.phone),
        email: Boolean(body.collectFields.email),
      }
    }
    if (body.regenerateSlug) {
      current.slug = generateEncryptedToken(10)
    }

    db.magnets[idx] = current
    await saveDatabase(db)

    return NextResponse.json({ magnet: current })
  } catch (err) {
    console.error('Update magnet error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const leadId = searchParams.get('leadId')

    const db = await getDatabase()

    if (leadId) {
      db.leads = db.leads.filter(l => l.id !== leadId)
      await saveDatabase(db)
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json({ error: 'معرف الملف مطلوب' }, { status: 400 })
    }

    const target = db.magnets.find(m => m.id === id)
    if (target) {
      await deleteBlobFileIfNeeded(target.fileUrl)
      db.magnets = db.magnets.filter(m => m.id !== id)
      await saveDatabase(db)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete magnet error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 })
  }
}
