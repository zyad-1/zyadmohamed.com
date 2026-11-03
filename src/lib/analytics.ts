'use client'

export type FunnelEventName =
  | 'VSL_Play'
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
  }
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
}
