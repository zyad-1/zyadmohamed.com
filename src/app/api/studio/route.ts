import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getDatabase, saveDatabase } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    return NextResponse.json({
      store: db.studioStore || {},
    })
  } catch (err) {
    console.error('Error loading studio store:', err)
    return NextResponse.json({ store: {} })
  }
}

export async function POST(req: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const db = await getDatabase()
    if (!db.studioStore || typeof db.studioStore !== 'object') {
      db.studioStore = {}
    }

    if (typeof body.key === 'string' && typeof body.value === 'string') {
      db.studioStore[body.key] = body.value
    } else if (body.store && typeof body.store === 'object') {
      db.studioStore = {
        ...db.studioStore,
        ...body.store,
      }
    }

    await saveDatabase(db)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error saving studio store:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
