import { NextResponse } from 'next/server'
import { getDatabase, saveDatabase, validateRealEmail, type LeadMagnet } from '@/lib/storage'
import { validatePhoneForCountry } from '@/lib/countries'

export const dynamic = 'force-dynamic'

function decodeFallbackMagnet(slug: string, encoded: string | null): LeadMagnet | null {
  if (!encoded) return null
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8')
    const data = JSON.parse(json)
    return {
      id: data.id || `mag_${slug}`,
      slug,
      title: data.t || slug,
      description: data.d || '',
      fileUrl: data.u || '',
      fileName: data.fn || data.t || 'file',
      fileSize: Number(data.fs || 0),
      fileType: data.ft || 'FILE',
      isExternal: true,
      requireLead: Boolean(data.rl),
      collectFields: {
        name: data.cf?.n !== false,
        phone: data.cf?.p !== false,
        email: data.cf?.e !== false,
      },
      buttonText: data.bt || 'تحميل الملف الآن',
      views: 1,
      downloads: 0,
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
    let magnet = db.magnets.find(m => m.slug === decodedSlug)

    if (!magnet && fallbackParam) {
      const fallback = decodeFallbackMagnet(decodedSlug, fallbackParam)
      if (fallback) {
        magnet = fallback
        db.magnets.unshift(fallback)
      }
    }

    if (!magnet) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
    }

    magnet.views = (magnet.views || 0) + 1
    await saveDatabase(db)

    return NextResponse.json({
      magnet: {
        id: magnet.id,
        slug: magnet.slug,
        title: magnet.title,
        description: magnet.description,
        fileName: magnet.fileName,
        fileSize: magnet.fileSize,
        fileType: magnet.fileType,
        requireLead: magnet.requireLead,
        collectFields: magnet.collectFields,
        buttonText: magnet.buttonText,
        // Only expose fileUrl immediately if direct download is enabled
        fileUrl: magnet.requireLead ? null : magnet.fileUrl,
      },
    })
  } catch (err) {
    console.error('Get public magnet error:', err)
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
    const db = await getDatabase()
    let magnet = db.magnets.find(m => m.slug === decodedSlug)

    if (!magnet && body.fallbackData) {
      const fallback = decodeFallbackMagnet(decodedSlug, String(body.fallbackData))
      if (fallback) {
        magnet = fallback
        db.magnets.unshift(fallback)
      }
    }

    if (!magnet) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
    }

    if (magnet.requireLead) {
      const name = String(body.name || '').trim()
      const phone = String(body.phone || '').trim()
      const email = String(body.email || '').trim()

      if (magnet.collectFields.name && !name) {
        return NextResponse.json({ error: 'يرجى إدخال الاسم بالكامل' }, { status: 400 })
      }
      if (magnet.collectFields.phone) {
        if (!phone) {
          return NextResponse.json({ error: 'يرجى إدخال رقم الواتساب أو الهاتف' }, { status: 400 })
        }
        const phoneCheck = validatePhoneForCountry(phone)
        if (!phoneCheck.valid) {
          return NextResponse.json(
            { error: phoneCheck.errorAr || 'يرجى إدخال رقم هاتف صحيح ومكتمل' },
            { status: 400 }
          )
        }
      }
      if (magnet.collectFields.email) {
        if (!email) {
          return NextResponse.json(
            { error: 'يرجى إدخال بريدك الإلكتروني الحقيقي لنرسل لك الفايل عليه' },
            { status: 400 }
          )
        }
        const emailCheck = validateRealEmail(email)
        if (!emailCheck.valid) {
          return NextResponse.json({ error: emailCheck.message }, { status: 400 })
        }
      }

      db.leads.unshift({
        id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        magnetId: magnet.id,
        magnetTitle: magnet.title,
        magnetSlug: magnet.slug,
        name: name || '—',
        phone: phone || '—',
        email: email || '—',
        createdAt: new Date().toISOString(),
      })
    }

    magnet.downloads = (magnet.downloads || 0) + 1
    await saveDatabase(db)

    return NextResponse.json({
      ok: true,
      fileUrl: magnet.fileUrl,
      fileName: magnet.fileName,
    })
  } catch (err) {
    console.error('Magnet action error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء التحميل' }, { status: 500 })
  }
}
