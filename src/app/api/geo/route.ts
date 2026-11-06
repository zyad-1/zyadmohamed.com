import { NextResponse } from 'next/server'
import { DEFAULT_COUNTRY_CODE, getCountryByCode } from '@/lib/countries'

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
      if (/^[A-Z]{2}$/.test(upper) && upper !== 'XX') {
        const c = getCountryByCode(upper)
        return NextResponse.json(
          {
            countryCode: c.code,
            countryName: c.nameAr,
            dialCode: c.dialCode,
            flag: c.flag,
          },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        )
      }
    }

    // 2. Fallback: Check visitor IP via ipwho.is & api.country.is
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ''
    const isLocalIp =
      !clientIp ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.')

    const ipWhoUrl = isLocalIp
      ? 'https://ipwho.is/'
      : `https://ipwho.is/${encodeURIComponent(clientIp)}`

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2200)
      const res = await fetch(ipWhoUrl, {
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        const detected = String(data?.country_code || '').trim().toUpperCase()
        if (/^[A-Z]{2}$/.test(detected)) {
          const dial = data?.calling_code ? `+${String(data.calling_code).replace(/^\+/, '')}` : undefined
          const c = getCountryByCode(detected, data?.country, dial)
          return NextResponse.json(
            {
              countryCode: c.code,
              countryName: c.nameAr,
              dialCode: c.dialCode,
              flag: c.flag,
            },
            { headers: { 'Cache-Control': 'no-store, max-age=0' } }
          )
        }
      }
    } catch {
      // Fallback to api.country.is
    }

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
      const detected = String(data?.country || '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(detected)) {
        const c = getCountryByCode(detected)
        return NextResponse.json(
          {
            countryCode: c.code,
            countryName: c.nameAr,
            dialCode: c.dialCode,
            flag: c.flag,
          },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        )
      }
    }
  } catch {
    // Ignore and return default country
  }

  const def = getCountryByCode(DEFAULT_COUNTRY_CODE)
  return NextResponse.json(
    {
      countryCode: def.code,
      countryName: def.nameAr,
      dialCode: def.dialCode,
      flag: def.flag,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
