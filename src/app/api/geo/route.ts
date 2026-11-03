import { NextResponse } from 'next/server'
import { COUNTRIES_LIST, DEFAULT_COUNTRY_CODE } from '@/lib/countries'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Check edge/CDN country headers (Vercel, Cloudflare)
    const headerCountry =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-country-code')

    if (headerCountry) {
      const upper = headerCountry.trim().toUpperCase()
      if (COUNTRIES_LIST.some(c => c.code === upper)) {
        return NextResponse.json({ countryCode: upper })
      }
    }

    // 2. Fallback: Check visitor IP via api.country.is
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ''
    const isLocalIp =
      !clientIp ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.')

    const lookupUrl = isLocalIp
      ? 'https://api.country.is/'
      : `https://api.country.is/${encodeURIComponent(clientIp)}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const res = await fetch(lookupUrl, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      const detected = String(data?.country || '').toUpperCase()
      if (COUNTRIES_LIST.some(c => c.code === detected)) {
        return NextResponse.json({ countryCode: detected })
      }
    }
  } catch {
    // Ignore and return default country (EG)
  }

  return NextResponse.json({ countryCode: DEFAULT_COUNTRY_CODE })
}
