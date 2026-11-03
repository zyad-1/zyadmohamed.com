import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { put } from '@vercel/blob'
import { isAdminAuthenticated } from '@/lib/auth'
import { isBlobConfigured, generateEncryptedToken } from '@/lib/storage'

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 })
    }

    const extRaw = path.extname(file.name).toLowerCase() || ''
    const extLabel = extRaw.replace('.', '').toUpperCase() || 'FILE'
    // Encrypted file name so URL never reveals original file name
    const encryptedFileName = `f_${generateEncryptedToken(12)}${extRaw}`

    if (isBlobConfigured()) {
      const blob = await put(`zyad-files/${encryptedFileName}`, file, {
        access: 'public',
        addRandomSuffix: false,
      })

      return NextResponse.json({
        url: blob.url,
        fileName: file.name,
        fileSize: file.size,
        fileType: extLabel,
      })
    }

    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          error:
            'لتفعيل رفع الملفات المباشر على Vercel، يرجى تفعيل Vercel Blob من تبويب Storage في لوحة تحكم Vercel (خطوة واحدة مجانية)، أو يمكنك وضع رابط الملف المباشر (مثل Google Drive) في خانة الرابط الخارجي.',
          needsBlob: true,
        },
        { status: 400 }
      )
    }

    // Local development upload to public/uploads with encrypted filename
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const filePath = path.join(uploadsDir, encryptedFileName)
    const arrayBuffer = await file.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer))

    return NextResponse.json({
      url: `/uploads/${encryptedFileName}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: extLabel,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الملف' },
      { status: 500 }
    )
  }
}
