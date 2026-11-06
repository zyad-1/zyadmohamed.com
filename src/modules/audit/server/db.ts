import fs from 'fs'
import path from 'path'
import { put, list } from '@vercel/blob'
import { AuditStoreSchema, createInitialAuditStore } from './demoSeed'

const globalForPrisma = globalThis as unknown as {
  apxAuditMemoryStore?: AuditStoreSchema
  apxAuditLastWriteMs?: number
}

function getLocalAuditDbPath(): string {
  if (process.env.VERCEL) {
    const tmpDir = '/tmp/zyad-cms'
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }
    return path.join(tmpDir, 'audit-db.json')
  }
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return path.join(dataDir, 'audit-db.json')
}

const BLOB_AUDIT_DB_KEY = 'zyad-cms/audit-db.json'

export function isAuditBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

/**
 * Loads the Audit Store with instant in-memory + local file strong consistency,
 * and automatic Vercel Blob persistence in the cloud.
 */
export async function readAuditStore(): Promise<AuditStoreSchema> {
  // 1. If we already have the authoritative store in memory in this Node process, return immediately (0ms, zero stale CDN lag)
  if (
    globalForPrisma.apxAuditMemoryStore &&
    Array.isArray(globalForPrisma.apxAuditMemoryStore.audits)
  ) {
    return globalForPrisma.apxAuditMemoryStore
  }

  // 2. When running locally (or if /tmp has a warm snapshot), check local file first for instant consistency
  if (!process.env.VERCEL) {
    try {
      const localPath = getLocalAuditDbPath()
      if (fs.existsSync(localPath)) {
        const raw = fs.readFileSync(localPath, 'utf-8')
        const parsed = JSON.parse(raw) as AuditStoreSchema
        if (parsed && Array.isArray(parsed.audits)) {
          globalForPrisma.apxAuditMemoryStore = parsed
          return parsed
        }
      }
    } catch {
      // Fall through to Vercel Blob or seed
    }
  }

  // 3. On cold start (or Vercel serverless instance boot), load from Vercel Blob if configured
  if (isAuditBlobConfigured()) {
    try {
      const { blobs } = await list({ prefix: BLOB_AUDIT_DB_KEY, limit: 5 })
      const match = blobs.find((b) => b.pathname === BLOB_AUDIT_DB_KEY) || blobs[0]
      if (match?.url) {
        const res = await fetch(`${match.url}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        })
        if (res.ok) {
          const parsed = (await res.json()) as AuditStoreSchema
          if (parsed && Array.isArray(parsed.audits)) {
            globalForPrisma.apxAuditMemoryStore = parsed
            try {
              fs.writeFileSync(getLocalAuditDbPath(), JSON.stringify(parsed, null, 2), 'utf-8')
            } catch {
              // Ignore local write error
            }
            return parsed
          }
        }
      } else {
        const initial = createInitialAuditStore()
        await writeAuditStore(initial)
        return initial
      }
    } catch (err) {
      console.error('Error reading Audit Store from Vercel Blob:', err)
    }
  }

  // 4. Fallback to local file if present
  try {
    const localPath = getLocalAuditDbPath()
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf-8')
      const parsed = JSON.parse(raw) as AuditStoreSchema
      if (parsed && Array.isArray(parsed.audits)) {
        globalForPrisma.apxAuditMemoryStore = parsed
        return parsed
      }
    }
  } catch {
    // Fall through to initial seed
  }

  const initial = createInitialAuditStore()
  await writeAuditStore(initial)
  return initial
}

export async function writeAuditStore(store: AuditStoreSchema): Promise<void> {
  globalForPrisma.apxAuditMemoryStore = store
  globalForPrisma.apxAuditLastWriteMs = Date.now()

  const serialized = JSON.stringify(store, null, 2)

  // Always write synchronously to local file first for 0ms strong consistency
  try {
    const localPath = getLocalAuditDbPath()
    fs.writeFileSync(localPath, serialized, 'utf-8')
  } catch {
    // Ephemeral filesystem on serverless; rely on Vercel Blob
  }

  if (isAuditBlobConfigured()) {
    const syncToBlob = async () => {
      try {
        await put(BLOB_AUDIT_DB_KEY, serialized, {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 0,
        })
      } catch (err) {
        console.error('Error writing Audit Store to Vercel Blob:', err)
      }
    }

    if (process.env.VERCEL) {
      await syncToBlob()
    } else {
      // In local development, sync to Vercel Blob asynchronously in background so UI mutations complete in <15ms
      void syncToBlob()
    }
  }
}
