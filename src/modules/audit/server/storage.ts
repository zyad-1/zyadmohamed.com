import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { put } from '@vercel/blob'

export interface AuditStorageResult {
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface AuditStorageAdapter {
  upload(params: {
    buffer: Buffer
    originalName: string
    mimeType: string
    folder?: string
  }): Promise<AuditStorageResult>
}

/**
 * Storage adapter supporting Vercel Blob (`BLOB_READ_WRITE_TOKEN`) in production
 * and local `public/uploads/audit` during local development.
 */
export const storageAdapter: AuditStorageAdapter = {
  async upload({ buffer, originalName, mimeType, folder = 'zyad-cms/audit-uploads' }) {
    const ext = path.extname(originalName || '').toLowerCase() || '.png'
    const safeToken = crypto.randomBytes(12).toString('hex')
    const storedFileName = `${safeToken}${ext}`

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`${folder}/${storedFileName}`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: mimeType,
      })
      return {
        fileUrl: blob.url,
        fileName: originalName,
        fileSize: buffer.byteLength,
        mimeType,
      }
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audit')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    const targetPath = path.join(uploadDir, storedFileName)
    fs.writeFileSync(targetPath, buffer)

    return {
      fileUrl: `/uploads/audit/${storedFileName}`,
      fileName: originalName,
      fileSize: buffer.byteLength,
      mimeType,
    }
  },
}
