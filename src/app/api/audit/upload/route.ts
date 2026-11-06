import { NextResponse } from 'next/server'
import { storageAdapter } from '@/modules/audit/server/storage'
import { recordAuditUpload } from '@/modules/audit/server/service'
import { getSessionUser } from '@/modules/audit/server/auth'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const token = (formData.get('token') as string | null) || ''
    const notes = (formData.get('notes') as string | null) || ''
    const sessionId = (formData.get('sessionId') as string | null) || 'client-upload'
    const mode = (formData.get('mode') as string | null) || 'client' // 'client' | 'admin'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate image file type and 10MB cap
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only image or PDF files are allowed' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 })
    }

    if (mode === 'admin') {
      const user = await getSessionUser()
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else if (!token || token.length < 8) {
      return NextResponse.json({ error: 'Missing report share token' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const stored = await storageAdapter.upload({
      buffer,
      originalName: file.name,
      mimeType: file.type || 'image/png',
      folder: mode === 'admin' ? 'audit-evidence' : 'audit-insights',
    })

    if (mode !== 'admin' && token) {
      await recordAuditUpload({
        token,
        fileUrl: stored.fileUrl,
        fileName: stored.fileName,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        notes,
        sessionId,
      })
    }

    return NextResponse.json({
      ok: true,
      fileUrl: stored.fileUrl,
      fileName: stored.fileName,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
