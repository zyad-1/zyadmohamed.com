'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, ExternalLink, RefreshCw } from 'lucide-react'
import { CALENDLY_EMBED_URL } from '@/lib/constants'

export interface CalendlyInlineEmbedProps {
  url?: string
  bookingUrl?: string
  themeMode?: 'dark' | 'light'
  locale?: 'ar' | 'en'
  onScheduled?: () => void
  height?: number
  className?: string
}

export default function CalendlyInlineEmbed({
  url,
  bookingUrl,
  themeMode = 'dark',
  locale = 'ar',
  onScheduled,
  height = 700,
  className = '',
}: CalendlyInlineEmbedProps) {
  const effectiveUrl = bookingUrl || url || CALENDLY_EMBED_URL
  const [embedHost, setEmbedHost] = useState<string>('localhost')
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname) {
      setEmbedHost(window.location.hostname)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.event === 'calendly.event_scheduled') {
        onScheduled?.()
      }
    }
    window.addEventListener('message', handleMsg)
    return () => window.removeEventListener('message', handleMsg)
  }, [onScheduled])

  const cleanBaseUrl = (effectiveUrl || CALENDLY_EMBED_URL).trim().split('?')[0]
  const bgHex = themeMode === 'light' ? 'ffffff' : '0d0718'
  const textHex = themeMode === 'light' ? '160d2b' : 'ffffff'
  const primaryHex = themeMode === 'light' ? '7c3aed' : '8b5cf6'

  const finalIframeSrc = `${cleanBaseUrl}?embed_domain=${encodeURIComponent(
    embedHost
  )}&embed_type=Inline&hide_gdpr_banner=1&background_color=${bgHex}&text_color=${textHex}&primary_color=${primaryHex}`

  return (
    <div className={`w-full space-y-3 ${className}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          <Calendar className="w-4 h-4 text-authority shrink-0" />
          <span>
            {locale === 'ar'
              ? 'اختر اليوم والساعة المناسبة لك مباشرة من التقويم بالأسفل:'
              : 'Select your preferred date and time slot directly below:'}
          </span>
        </div>

        <a
          href={cleanBaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-authority hover:underline font-bold"
        >
          <span>
            {locale === 'ar'
              ? 'فتح التقويم في نافذة مستقلة'
              : 'Open calendar in new tab'}
          </span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div
        className={`relative w-full rounded-2xl overflow-hidden border transition-colors ${
          themeMode === 'light'
            ? 'bg-white border-purple-500/25 shadow-lg'
            : 'bg-[#0D0718] border-[#8B5CF6]/35 shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
        }`}
        style={{ minHeight: `${height}px`, height: `${height}px` }}
      >
        {!iframeLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0D0718]/90 text-center p-6">
            <RefreshCw className="w-7 h-7 text-[#8B5CF6] animate-spin" />
            <p className="text-xs sm:text-sm font-bold text-white">
              {locale === 'ar'
                ? 'جاري تحميل مواعيد تقويم Calendly المتاحة...'
                : 'Loading available Calendly time slots...'}
            </p>
          </div>
        )}

        <iframe
          key={`${finalIframeSrc}-${themeMode}`}
          src={finalIframeSrc}
          title="APX Strategy Session Booking Calendar"
          width="100%"
          height="100%"
          frameBorder="0"
          allow="payment; fullscreen"
          onLoad={() => setIframeLoaded(true)}
          style={{
            width: '100%',
            height: `${height}px`,
            minHeight: `${height}px`,
            border: '0',
            display: 'block',
          }}
        />
      </div>
    </div>
  )
}
