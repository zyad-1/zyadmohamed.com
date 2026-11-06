'use client'

import { detectVisitorGeo, type DetectedGeoInfo } from './countries'

export type FunnelEventName =
  | 'PAGE_VIEW'
  | 'SCROLL_DEPTH'
  | 'VSL_Play'
  | 'BUDGET_SELECT'
  | 'FAQ_VIEW'
  | 'Form_Start'
  | 'Lead_Unqualified'
  | 'Lead_Qualified'
  | 'Schedule_Call'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void
    }
    gtag?: (...args: unknown[]) => void
    clarity?: (...args: unknown[]) => void
    __apxGeoCache?: DetectedGeoInfo
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    const key = 'apx_site_session_id'
    let sid = sessionStorage.getItem(key)
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      sessionStorage.setItem(key, sid)
    }
    return sid
  } catch {
    return `sess_${Date.now()}`
  }
}

async function resolveVisitorGeo(): Promise<DetectedGeoInfo> {
  if (typeof window !== 'undefined' && window.__apxGeoCache) {
    return window.__apxGeoCache
  }
  const geo = await detectVisitorGeo()
  if (typeof window !== 'undefined') {
    window.__apxGeoCache = geo
  }
  return geo
}

export function trackFunnelEvent(
  eventName: FunnelEventName,
  params: Record<string, unknown> = {}
) {
  if (typeof window === 'undefined') return

  try {
    // 1. Meta Pixel
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, params)
      if (eventName === 'Lead_Qualified') {
        window.fbq('track', 'Lead', params)
      } else if (eventName === 'Schedule_Call') {
        window.fbq('track', 'Schedule', params)
      }
    }

    // 2. TikTok Pixel
    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track(eventName, params)
    }

    // 3. Google Analytics 4 (GA4)
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params)
    }

    // 4. Microsoft Clarity
    if (typeof window.clarity === 'function') {
      window.clarity('event', eventName)
    }
  } catch (err) {
    console.warn('Analytics tracking warning:', err)
  }

  // 5. First-Party APX Insights Telemetry
  void (async () => {
    try {
      const sessionId = getOrCreateSessionId()
      const geo = await resolveVisitorGeo()
      const body = JSON.stringify({
        sessionId,
        event: eventName,
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        payload: params,
      })

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon('/api/insights', blob)
        return
      }

      await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      })
    } catch {
      // Ignore network errors on telemetry
    }
  })()
}
