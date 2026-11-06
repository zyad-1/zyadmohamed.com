'use client'

import React from 'react'
import { Calendar, Clock, Flame, Moon, Sun } from 'lucide-react'

interface HomeNavbarProps {
  headerCtaText: string
  themeMode: 'dark' | 'light'
  onToggleTheme: () => void
  fomoEnabled: boolean
  acceptingClients: boolean
  fomoSeatsLeft: number
  fomoSecondsLeft: number
}

export default function HomeNavbar({
  headerCtaText,
  themeMode,
  onToggleTheme,
  fomoEnabled,
  acceptingClients,
  fomoSeatsLeft,
  fomoSecondsLeft,
}: HomeNavbarProps) {
  const formatFomoTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleLogoRefresh = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.location.href = '/'
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-void/90 border-b border-authority/25 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 h-16 md:h-20 flex items-center justify-between gap-2">
        <a
          href="/"
          onClick={handleLogoRefresh}
          title="تحديث الصفحة الرئيسية — APX"
          className="flex items-center gap-2.5 group cursor-pointer shrink-0"
        >
          <img
            src="/logo/logo-white.png"
            alt="شعار وكالة APX لبناء البراند الشخصي وصناعة المحتوى — زياد سعدون (Zyad Saadon)"
            width={96}
            height={28}
            className="h-5 sm:h-6 md:h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </a>

        {/* Live FOMO & Availability Pill in Top Bar — Exact "غير مناسب" Red Badge Style */}
        {fomoEnabled && (
          <a
            href="#book"
            className="apx-fomo-banner hidden sm:inline-flex items-center gap-2 p-1 pe-2.5 rounded-full bg-[#120C1D] border border-[#C95D63]/45 text-[11px] md:text-xs text-white hover:border-[#C95D63] transition-all"
          >
            <span className="apx-fomo-red-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C95D63]/20 border border-[#C95D63]/45 text-[#F87171] font-extrabold whitespace-nowrap">
              <Flame className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
              <span>
                {acceptingClients
                  ? `متبقي ${fomoSeatsLeft} مقاعد فقط`
                  : 'اكتمل العدد — قائمة الانتظار'}
              </span>
            </span>
            <span
              className="apx-fomo-timer-pill px-2.5 py-1 rounded-full bg-[#D49A3D]/20 border border-[#D49A3D]/45 text-[#FBBF24] font-mono font-extrabold flex items-center gap-1 tabular-nums"
              dir="ltr"
            >
              <Clock className="w-3 h-3 text-[#FBBF24]" />
              <span>{formatFomoTime(fomoSecondsLeft)}</span>
            </span>
          </a>
        )}

        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={
              themeMode === 'dark'
                ? 'تفعيل الوضع الفاتح (Light Mode)'
                : 'تفعيل الوضع الداكن (Dark Mode)'
            }
            aria-label="تبديل وضع الإضاءة"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl apx-liquid-glass border border-authority/35 flex items-center justify-center text-authority hover:border-authority transition-all"
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-authority" />
            )}
          </button>

          {/* Compact Mobile FOMO Timer Badge — Exact "غير مناسب" Red Badge Style */}
          {fomoEnabled && (
            <a
              href="#book"
              className="apx-fomo-banner sm:hidden inline-flex items-center gap-1 p-1 rounded-xl bg-[#120C1D] border border-[#C95D63]/45 text-[10px] font-bold text-white"
            >
              <span className="apx-fomo-red-pill px-2 py-0.5 rounded-lg bg-[#C95D63]/20 border border-[#C95D63]/45 text-[#F87171] inline-flex items-center gap-1 font-extrabold">
                <Flame className="w-3 h-3 text-[#F87171]" />
                <span>{acceptingClients ? `${fomoSeatsLeft} مقاعد` : 'انتظار'}</span>
              </span>
              <span
                className="apx-fomo-timer-pill px-1.5 py-0.5 rounded-lg bg-[#D49A3D]/20 border border-[#D49A3D]/45 text-[#FBBF24] font-mono font-extrabold tabular-nums"
                dir="ltr"
              >
                {formatFomoTime(fomoSecondsLeft)}
              </span>
            </a>
          )}

          <a
            href="#book"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-authority hover:bg-crown text-white font-bold text-xs md:text-sm px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all duration-300 apx-btn-glow shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{headerCtaText}</span>
          </a>
        </div>
      </div>
    </header>
  )
}
