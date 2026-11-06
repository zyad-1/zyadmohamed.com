'use client'

import React, { useEffect, useState } from 'react'
import { Flame, Users, Clock } from 'lucide-react'
import { formatDigits, type DigitMode } from '@/modules/audit/i18n'

export interface FomoBannerProps {
  enabled?: boolean
  acceptingClients?: boolean
  seatsLeft?: number
  countdownMinutes?: number
  urgencyTextAr?: string
  urgencyTextEn?: string
  locale?: 'ar' | 'en'
  digits?: DigitMode
  compact?: boolean
  className?: string
  storageKey?: string
  secondsLeftOverride?: number
  formatSeatsNumber?: (n: number) => string
}

export interface UnifiedFomoSettings {
  fomoEnabled: boolean
  acceptingClients: boolean
  fomoSeatsLeft: number
  fomoCountdownMinutes: number
  fomoTextAr: string
  fomoTextEn: string
}

const UNIFIED_FOMO_KEY_PREFIX = 'apx_unified_fomo_deadline_v4'

// Module-level cache so multiple FomoBanner instances on the same page don't duplicate fetches
let cachedGlobalFomoSettings: UnifiedFomoSettings | null = null
let pendingGlobalFomoFetch: Promise<UnifiedFomoSettings | null> | null = null

export function invalidateGlobalFomoCache() {
  cachedGlobalFomoSettings = null
  pendingGlobalFomoFetch = null
}

export function syncSeatsCountInArabicText(
  text: string,
  seatsCount: number,
  formattedSeats: string
): string {
  if (!text) return text
  // Replace any number (Western or Eastern digits or words) after "متبقي" or before "مقاعد/مقعد"
  let updated = text.replace(
    /(متبقي\s+)(?:[0-9٠-٩]+|ثلاثة|ثلاث|تلاتة|تلات)(\s*(?:مقاعد|مقعد|أماكن|فرص)?)/g,
    (_match, prefix, suffix) => `${prefix}${formattedSeats}${suffix || ' مقاعد'}`
  )
  updated = updated.replace(
    /[0-9٠-٩]+(\s*(?:مقاعد|مقعد|أماكن))/g,
    `${formattedSeats}$1`
  )
  return updated
}

export function syncSeatsCountInEnglishText(
  text: string,
  seatsCount: number
): string {
  if (!text) return text
  return text
    .replace(
      /(Only\s+)\d+(\s*(?:onboarding\s+)?(?:spots|seats|places))/gi,
      `$1${seatsCount}$2`
    )
    .replace(
      /\d+(\s*(?:onboarding\s+)?(?:spots|seats)\s+left)/gi,
      `${seatsCount}$1`
    )
}

export function fetchGlobalFomoSettings(force = false): Promise<UnifiedFomoSettings | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (!force && cachedGlobalFomoSettings) return Promise.resolve(cachedGlobalFomoSettings)
  if (!force && pendingGlobalFomoFetch) return pendingGlobalFomoFetch

  pendingGlobalFomoFetch = fetch('/api/funnel/qualify', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const s = data?.siteSettings
      if (!s) return null
      const unified: UnifiedFomoSettings = {
        fomoEnabled: typeof s.fomoEnabled === 'boolean' ? s.fomoEnabled : true,
        acceptingClients: typeof s.acceptingClients === 'boolean' ? s.acceptingClients : true,
        fomoSeatsLeft: typeof s.fomoSeatsLeft === 'number' ? s.fomoSeatsLeft : 3,
        fomoCountdownMinutes:
          typeof s.fomoCountdownMinutes === 'number' ? s.fomoCountdownMinutes : 30,
        fomoTextAr: typeof s.fomoTextAr === 'string' ? s.fomoTextAr : '',
        fomoTextEn: typeof s.fomoTextEn === 'string' ? s.fomoTextEn : '',
      }
      cachedGlobalFomoSettings = unified
      return unified
    })
    .catch(() => null)
    .finally(() => {
      pendingGlobalFomoFetch = null
    })

  return pendingGlobalFomoFetch
}

export function useUnifiedFomoTimer(
  countdownMinutes = 30,
  _legacyStorageKey?: string
): {
  secondsLeft: number
  formattedTime: string
  liveSettings: UnifiedFomoSettings | null
} {
  const [liveSettings, setLiveSettings] = useState<UnifiedFomoSettings | null>(
    cachedGlobalFomoSettings
  )

  useEffect(() => {
    let mounted = true
    fetchGlobalFomoSettings().then((s) => {
      if (mounted && s) {
        setLiveSettings(s)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const effectiveMinutes = Math.max(
    1,
    Number(liveSettings?.fomoCountdownMinutes ?? countdownMinutes ?? 30)
  )
  // Unified key across Main Page (/), Audit Page (/a/[token]), and Lead Magnet Page (/d/[slug])
  const unifiedKey = `${UNIFIED_FOMO_KEY_PREFIX}_${effectiveMinutes}`

  const [secondsLeft, setSecondsLeft] = useState<number>(effectiveMinutes * 60)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const totalSec = effectiveMinutes * 60
    let endAt = 0

    try {
      const saved = Number(window.localStorage.getItem(unifiedKey))
      // Ensure saved deadline is in the future and not longer than totalSec
      if (saved && !Number.isNaN(saved) && saved > Date.now() && saved <= Date.now() + totalSec * 1000) {
        endAt = saved
      } else {
        endAt = Date.now() + totalSec * 1000
        window.localStorage.setItem(unifiedKey, String(endAt))
      }
    } catch {
      endAt = Date.now() + totalSec * 1000
    }

    const tick = () => {
      const rem = Math.max(0, Math.floor((endAt - Date.now()) / 1000))
      if (rem === 0) {
        endAt = Date.now() + totalSec * 1000
        try {
          window.localStorage.setItem(unifiedKey, String(endAt))
        } catch {}
        setSecondsLeft(totalSec)
      } else {
        setSecondsLeft(rem)
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [effectiveMinutes, unifiedKey])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return {
    secondsLeft,
    formattedTime: `${mm}:${ss}`,
    liveSettings,
  }
}

export default function FomoBanner({
  enabled = true,
  acceptingClients = true,
  seatsLeft = 3,
  countdownMinutes = 30,
  urgencyTextAr,
  urgencyTextEn,
  locale = 'ar',
  digits = 'western',
  compact = false,
  className = '',
  storageKey,
  secondsLeftOverride,
  formatSeatsNumber,
}: FomoBannerProps) {
  const { secondsLeft: timerSeconds, liveSettings } = useUnifiedFomoTimer(
    countdownMinutes,
    storageKey
  )

  // Always prefer live central settings from Dashboard Settings so Main Page & Audit Page are 100% identical
  const effectiveEnabled =
    liveSettings !== null ? liveSettings.fomoEnabled : enabled
  const effectiveAccepting =
    liveSettings !== null ? liveSettings.acceptingClients : acceptingClients
  const effectiveSeats =
    liveSettings !== null ? liveSettings.fomoSeatsLeft : seatsLeft
  const effectiveTextAr =
    (liveSettings?.fomoTextAr && liveSettings.fomoTextAr.trim()) || urgencyTextAr
  const effectiveTextEn =
    (liveSettings?.fomoTextEn && liveSettings.fomoTextEn.trim()) || urgencyTextEn

  // Use unified timer so Main Page and Audit Page share the exact same countdown
  const effectiveSeconds =
    liveSettings !== null
      ? timerSeconds
      : typeof secondsLeftOverride === 'number'
      ? secondsLeftOverride
      : timerSeconds

  const mm = String(Math.floor(effectiveSeconds / 60)).padStart(2, '0')
  const ss = String(effectiveSeconds % 60).padStart(2, '0')
  const formattedTime = `${mm}:${ss}`

  if (effectiveEnabled === false) return null

  const formattedSeats = formatSeatsNumber
    ? formatSeatsNumber(effectiveSeats)
    : formatDigits(effectiveSeats, digits)

  const defaultTextAr = `متبقي ${formattedSeats} مقاعد فقط لتطبيق الـ System هذا الشهر — احجز جلستك الاستراتيجية قبل اكتمال العدد`
  const defaultTextEn = `Only ${effectiveSeats} onboarding spots left this month — claim your strategy session before seats fill up`

  // Replace any hardcoded seat numbers inside custom Arabic/English text with the live seats count
  const rawAr = syncSeatsCountInArabicText(
    effectiveTextAr || defaultTextAr,
    effectiveSeats,
    formattedSeats
  )
  const rawEn = syncSeatsCountInEnglishText(
    effectiveTextEn || defaultTextEn,
    effectiveSeats
  )

  const displayUrgency =
    effectiveAccepting === false
      ? locale === 'ar'
        ? 'اكتملت مقاعد الدفعة الحالية بالكامل — التسجيل متاح لقائمة الانتظار فقط'
        : 'Current cohort is 100% full — Priority Waitlist is now open'
      : locale === 'ar'
      ? rawAr
      : rawEn

  if (compact) {
    return (
      <div
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className={`apx-fomo-banner inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#130D1E] border border-[#C95D63]/45 text-[11px] md:text-xs transition-all ${className}`}
      >
        <span className="apx-fomo-red-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C95D63]/20 border border-[#C95D63]/45 text-[#F87171] font-bold whitespace-nowrap">
          <Flame className="w-3 h-3 text-[#F87171] shrink-0" />
          <span>
            {effectiveAccepting
              ? locale === 'ar'
                ? `متبقي ${formattedSeats} مقاعد`
                : `${effectiveSeats} Seats Left`
              : locale === 'ar'
              ? 'قائمة الانتظار'
              : 'Waitlist'}
          </span>
        </span>
        <span
          dir="ltr"
          className="apx-fomo-timer-pill px-2.5 py-0.5 rounded-full bg-[#D49A3D]/20 border border-[#D49A3D]/45 text-[#FBBF24] font-mono font-extrabold tabular-nums flex items-center gap-1"
        >
          <Clock className="w-3 h-3 text-[#FBBF24]" />
          {formattedTime}
        </span>
      </div>
    )
  }

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`apx-fomo-banner w-full p-3.5 sm:p-4 rounded-2xl bg-[#120C1D] border border-[#C95D63]/45 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all ${className}`}
    >
      <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-white">
        <span className="apx-fomo-red-pill w-8 h-8 rounded-xl bg-[#C95D63]/20 border border-[#C95D63]/45 flex items-center justify-center text-[#F87171] shrink-0">
          <Flame className="w-4 h-4 text-[#F87171]" />
        </span>
        <span className="text-start leading-relaxed text-white">{displayUrgency}</span>
      </div>

      {effectiveAccepting !== false && (
        <div className="flex items-center gap-2 shrink-0">
          {/* Exact "غير مناسب" Red Badge Style (bg-[#C95D63]/20 border-[#C95D63]/45 text-[#F87171]) */}
          <span className="apx-fomo-red-pill px-3 py-1.5 rounded-xl bg-[#C95D63]/20 border border-[#C95D63]/45 text-[#F87171] text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-[#F87171]" />
            <span>
              {locale === 'ar'
                ? `متبقي ${formattedSeats} مقاعد`
                : `${effectiveSeats} Seats Left`}
            </span>
          </span>

          {/* Matching Amber Badge Style for Countdown Timer */}
          <span
            dir="ltr"
            className="apx-fomo-timer-pill px-3 py-1.5 rounded-xl bg-[#D49A3D]/20 border border-[#D49A3D]/45 font-en font-extrabold text-xs sm:text-sm text-[#FBBF24] tabular-nums flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>{formattedTime}</span>
          </span>
        </div>
      )}
    </div>
  )
}
