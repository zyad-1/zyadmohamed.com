import { NextResponse } from 'next/server'
import { TrackAuditEventSchema } from '@/modules/audit/schemas'
import { trackAuditEvent } from '@/modules/audit/server/service'
import { resolveServerTelemetryGeo } from '@/lib/countries'

export async function POST(req: Request) {
  try {
    const raw = await req.text()
    if (!raw) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const parsedJson = JSON.parse(raw)
    const validated = TrackAuditEventSchema.safeParse(parsedJson)
    if (!validated.success) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const payload = { ...(validated.data.payload || {}) }
    const resolvedGeo = await resolveServerTelemetryGeo(
      req,
      payload.countryCode,
      payload.countryName
    )
    if (resolvedGeo) {
      payload.countryCode = resolvedGeo.countryCode
      payload.countryName = resolvedGeo.countryName
    }

    const result = await trackAuditEvent({
      ...validated.data,
      payload,
    })
    return NextResponse.json({ ok: result.recorded })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
