import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOST_SUFFIXES = [
  '.cdninstagram.com',
  '.fbcdn.net',
  'instagram.com',
  'unsplash.com',
]

function isAllowedImageHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => lower === suffix.replace(/^\./, '') || lower.endsWith(suffix)
  )
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url')
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 })
  }

  if (!isAllowedImageHost(parsed.hostname)) {
    return NextResponse.json({ error: 'Disallowed image host' }, { status: 403 })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: 'https://www.instagram.com/',
      },
      next: { revalidate: 86400 },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream image returned ${upstream.status}` },
        { status: upstream.status }
      )
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await upstream.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    })
  } catch (err) {
    console.error('Image proxy error:', err)
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 502 })
  }
}
