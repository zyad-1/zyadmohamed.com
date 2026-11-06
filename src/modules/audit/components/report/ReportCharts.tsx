'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AuditLocale,
  DigitMode,
  formatAuditNumber,
  formatDigits,
  getDictionary,
} from '../../i18n'
import { AuditCategoryKey } from '../../schemas'
import { getScoreBandStatus, PerReelComputed } from '../../metrics'

export function useCountUp(target: number, durationMs = 950): number {
  const prefersReduced = useReducedMotion()
  const [current, setCurrent] = useState(prefersReduced ? target : 0)

  useEffect(() => {
    if (prefersReduced) {
      setCurrent(target)
      return
    }
    let rafId = 0
    const startTime = performance.now()
    const startVal = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(startVal + (target - startVal) * eased)
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, durationMs, prefersReduced])

  return current
}

export function AnimatedCountNumber({
  value,
  digits = 'western',
  decimals = 0,
  suffix = '',
  prefix = '',
  formatFn,
}: {
  value: number
  digits?: DigitMode
  decimals?: number
  suffix?: string
  prefix?: string
  formatFn?: (val: number) => string
}) {
  const animated = useCountUp(Number.isFinite(value) ? value : 0, 950)
  const rounded =
    decimals > 0 ? Number(animated.toFixed(decimals)) : Math.round(animated)
  const formatted = formatFn
    ? formatFn(rounded)
    : formatAuditNumber(rounded, {
        digits,
        maximumFractionDigits: decimals,
        compact: rounded >= 100_000,
      })
  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

export function AnimatedScoreRing({
  score,
  digits = 'western',
  outOfLabel,
}: {
  score: number
  digits?: DigitMode
  outOfLabel: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const animatedVal = Math.round(useCountUp(clamped, 1050))
  const size = 164
  const strokeWidth = 9
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  const band = getScoreBandStatus(Math.round(clamped / 10))
  const bandStroke =
    band === 'strong'
      ? '#10B981'
      : band === 'warning'
        ? '#8B5CF6'
        : '#F43F5E'

  return (
    <motion.div
      initial={{ scale: 0.94, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative inline-flex items-center justify-center"
    >
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${bandStroke} 0%, rgba(76,29,149,0) 72%)`,
        }}
      />
      <svg width={size} height={size} className="-rotate-90 transform overflow-visible">
        <defs>
          <linearGradient id="apxScoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="55%" stopColor={bandStroke} />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(226, 217, 243, 0.1)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#apxScoreRingGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="apx-serif-numeral text-4xl sm:text-5xl font-bold text-white leading-none">
          {formatDigits(animatedVal, digits)}
        </span>
        <span className="mt-1.5 text-xs font-medium text-[#E2D9F3]/65">
          {formatDigits(outOfLabel, digits)}
        </span>
      </div>
    </motion.div>
  )
}

export function ReelsMedianBarChart({
  reels,
  medianViews,
  locale,
  digits,
  selectedIndex: externalSelectedIdx,
  onSelectIndex,
}: {
  reels: PerReelComputed[]
  medianViews: number
  locale: AuditLocale
  digits: DigitMode
  selectedIndex?: number
  onSelectIndex?: (idx: number) => void
}) {
  const [internalSelectedIdx, setInternalSelectedIdx] = useState<number>(0)
  const selectedIdx = externalSelectedIdx ?? internalSelectedIdx

  const handleSelect = (idx: number) => {
    setInternalSelectedIdx(idx)
    if (onSelectIndex) {
      onSelectIndex(idx)
    }
  }

  if (!reels || reels.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[#E2D9F3]/60 border border-dashed border-[#8B5CF6]/25 rounded-2xl">
        {locale === 'ar' ? 'لم تتم إضافة بيانات الريلز بعد.' : 'No Reels data entered yet.'}
      </div>
    )
  }

  const maxViews = Math.max(...reels.map((r) => r.views), medianViews, 1)
  const medianPct = Math.min(88, Math.max(12, (medianViews / maxViews) * 100))
  const selectedReel =
    selectedIdx !== null && reels[selectedIdx] ? reels[selectedIdx] : reels[0]

  return (
    <div className="w-full space-y-4">
      {/* Legend & Average Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#E2D9F3]/80">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            {locale === 'ar' ? 'الأكثر انتشاراً (طفرة)' : 'Viral / Outperforming'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
            {locale === 'ar' ? 'فوق المتوسط' : 'Above Average'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            {locale === 'ar' ? 'ضمن المعدل' : 'Average'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]/70" />
            {locale === 'ar' ? 'أقل من المتوسط' : 'Below Average'}
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-xs text-white">
          <span className="w-3 border-t-2 border-dashed border-[#A78BFA]" />
          <span>
            {locale === 'ar' ? 'وسيط المشاهدات الفعلي: ' : 'Median Views: '}
            <strong className="font-en font-bold text-[#A78BFA]">
              {formatAuditNumber(medianViews, { digits, compact: true })}
            </strong>
          </span>
        </div>
      </div>

      {/* Modern Glass Bar Chart Canvas */}
      <div className="relative h-60 sm:h-64 w-full pt-10 pb-7 px-3 sm:px-6 rounded-3xl bg-[#110A1E]/90 border border-[#8B5CF6]/30 flex items-end gap-2 sm:gap-3 overflow-hidden shadow-inner">
        {/* Horizontal dashed AVERAGE line */}
        <div
          className="absolute inset-x-0 z-20 pointer-events-none flex items-center transition-all duration-500"
          style={{ bottom: `calc(${medianPct}% + 24px)` }}
        >
          <div className="w-full border-t-2 border-dashed border-[#A78BFA]/75" />
          <span className="absolute end-3 -top-6 px-2.5 py-0.5 rounded-lg bg-[#4C1D95] border border-[#8B5CF6]/50 text-[11px] font-bold text-white shadow-md">
            {locale === 'ar' ? 'الوسيط' : 'MEDIAN'}:{' '}
            {formatAuditNumber(medianViews, { digits, compact: true })}
          </span>
        </div>

        {reels.map((reel, idx) => {
          const heightPct = Math.max(8, (reel.views / maxViews) * 100)
          const tier = reel.performanceTier
          const isSelected = selectedIdx === idx
          const barGradient =
            tier === 'VIRAL'
              ? 'linear-gradient(180deg, #34D399 0%, #059669 100%)'
              : tier === 'ABOVE_AVERAGE'
                ? 'linear-gradient(180deg, #A78BFA 0%, #6D28D9 100%)'
                : tier === 'AVERAGE'
                  ? 'linear-gradient(180deg, #FBBF24 0%, #D97706 100%)'
                  : 'linear-gradient(180deg, rgba(244,63,94,0.55) 0%, rgba(159,18,57,0.32) 100%)'

          return (
            <button
              key={reel.id || idx}
              type="button"
              onMouseEnter={() => handleSelect(idx)}
              onClick={() => handleSelect(idx)}
              className="group relative flex-1 h-full flex flex-col justify-end items-center focus:outline-none"
              title={`${formatAuditNumber(reel.views, { digits, compact: true })} views (${reel.vsMedianMultiplier}x)`}
            >
              {/* Compact value pill above selected or hovered bar */}
              <span
                className={`mb-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-en font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#8B5CF6] text-white shadow-[0_0_12px_rgba(139,92,246,0.6)] scale-105'
                    : tier === 'VIRAL'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'opacity-0 group-hover:opacity-100 bg-[#1A0F2E] text-[#E2D9F3]'
                }`}
              >
                {formatAuditNumber(reel.views, { digits, compact: true })}
              </span>

              {/* Bar Track + Animated Fill */}
              <div className="w-full max-w-[38px] h-full bg-[#8B5CF6]/[0.07] rounded-xl flex items-end overflow-hidden p-0.5 border border-[#8B5CF6]/15">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${heightPct}%` }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.55,
                    delay: idx * 0.03,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ background: barGradient }}
                  className={`w-full rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-white shadow-[0_0_18px_rgba(139,92,246,0.65)]'
                      : 'opacity-85 group-hover:opacity-100'
                  }`}
                />
              </div>

              <span
                className={`mt-2 text-xs font-en transition-colors ${
                  isSelected ? 'text-white font-bold' : 'text-[#E2D9F3]/60'
                }`}
              >
                {String(reel.index).padStart(2, '0')}
              </span>
            </button>
          )
        })}
      </div>

      {/* APX Branded Slider for Reels */}
      {reels.length > 1 && (
        <div className="max-w-md mx-auto flex items-center gap-3 px-2">
          <span className="font-mono text-[10px] text-[#A78BFA] font-bold">01</span>
          <input
            type="range"
            min={0}
            max={reels.length - 1}
            value={selectedIdx}
            onChange={(e) => handleSelect(Number(e.target.value))}
            aria-label="التنقل بين الفيديوهات"
            className="w-full h-1.5 rounded-full accent-[#8B5CF6] bg-[#080608] cursor-pointer"
          />
          <span className="font-mono text-[10px] text-[#A78BFA] font-bold">
            {String(reels.length).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Selected Reel Summary Strip */}
      <AnimatePresence mode="wait">
        {selectedReel && (
          <motion.div
            key={selectedReel.index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-3xl bg-[#1A0F2E]/85 border border-[#8B5CF6]/40 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs sm:text-sm"
          >
            {selectedReel.thumbnailUrl && (
              <div className="relative w-16 h-24 rounded-2xl overflow-hidden bg-[#080608] border border-[#8B5CF6]/40 shrink-0">
                <img
                  src={selectedReel.thumbnailUrl}
                  alt={`Reel ${selectedReel.index}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded bg-[#4C1D95]/90 text-[10px] font-en font-bold text-white">
                  {String(selectedReel.index).padStart(2, '0')}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2.5 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#8B5CF6]/25 text-white font-bold">
                    {locale === 'ar'
                      ? `فيديو ${String(selectedReel.index).padStart(2, '0')}`
                      : `Reel ${String(selectedReel.index).padStart(2, '0')}`}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                      selectedReel.performanceTier === 'VIRAL'
                        ? 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/40'
                        : selectedReel.performanceTier === 'ABOVE_AVERAGE'
                          ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40'
                          : selectedReel.performanceTier === 'AVERAGE'
                            ? 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/40'
                            : 'bg-[#F43F5E]/20 text-[#FDA4AF] border-[#F43F5E]/40'
                    }`}
                  >
                    {selectedReel.performanceTier === 'VIRAL'
                      ? locale === 'ar'
                        ? `الأكثر انتشاراً (${formatDigits(selectedReel.vsMedianMultiplier, digits)}x)`
                        : `Viral Outlier (${selectedReel.vsMedianMultiplier}x)`
                      : selectedReel.performanceTier === 'ABOVE_AVERAGE'
                        ? locale === 'ar'
                          ? `فوق المتوسط (${formatDigits(selectedReel.vsMedianMultiplier, digits)}x)`
                          : `Above Average (${selectedReel.vsMedianMultiplier}x)`
                        : selectedReel.performanceTier === 'AVERAGE'
                          ? locale === 'ar'
                            ? `ضمن المعدل (${formatDigits(selectedReel.vsMedianMultiplier, digits)}x)`
                            : `Average (${selectedReel.vsMedianMultiplier}x)`
                          : locale === 'ar'
                            ? `أقل من المتوسط (${formatDigits(selectedReel.vsMedianMultiplier, digits)}x)`
                            : `Below Average (${selectedReel.vsMedianMultiplier}x)`}
                  </span>
                  <span className="text-[#E2D9F3]/70 font-en text-xs">
                    {selectedReel.postedAtIso.slice(0, 10)}
                  </span>
                </div>

                {selectedReel.url && (
                  <a
                    href={selectedReel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/35 border border-[#8B5CF6]/45 text-white font-bold text-xs transition-all"
                  >
                    <span>
                      {locale === 'ar' ? 'رابط الفيديو الأصلي ↗' : 'Original Reel ↗'}
                    </span>
                  </a>
                )}
              </div>

              {(selectedReel.caption || selectedReel.topic) && (
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2 leading-relaxed">
                  {selectedReel.caption || selectedReel.topic}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-xs">
                <div className="px-2.5 py-1.5 rounded-xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                  <span className="text-[10px] text-[#E2D9F3]/60 block">
                    {locale === 'ar' ? 'المشاهدات' : 'Views'}
                  </span>
                  <strong className="text-white font-en">
                    {formatAuditNumber(selectedReel.views, { digits, compact: true })}
                  </strong>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                  <span className="text-[10px] text-[#E2D9F3]/60 block">
                    {locale === 'ar' ? 'الإعجابات' : 'Likes'}
                  </span>
                  <strong className="text-white font-en">
                    {formatAuditNumber(selectedReel.likes, { digits, compact: true })}
                  </strong>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                  <span className="text-[10px] text-[#E2D9F3]/60 block">
                    {locale === 'ar' ? 'التعليقات' : 'Comments'}
                  </span>
                  <strong className="text-white font-en">
                    {formatAuditNumber(selectedReel.comments, { digits, compact: true })}
                  </strong>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                  <span className="text-[10px] text-[#E2D9F3]/60 block">
                    {locale === 'ar' ? 'المشاركات (Shares)' : 'Shares'}
                  </span>
                  <strong className="text-white font-en">
                    {formatAuditNumber(selectedReel.shares, { digits, compact: true })}
                  </strong>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                  <span className="text-[10px] text-[#E2D9F3]/60 block">
                    {locale === 'ar' ? 'الحفظ (Saves)' : 'Saves'}
                  </span>
                  <strong className="text-white font-en">
                    {formatAuditNumber(selectedReel.saves, { digits, compact: true })}
                  </strong>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                  <span className="text-[10px] text-[#E2D9F3]/60 block">
                    {locale === 'ar' ? 'إعادة النشر (Reposts)' : 'Reposts'}
                  </span>
                  <strong className="text-white font-en">
                    {formatAuditNumber(selectedReel.repostsCount, { digits, compact: true })}
                  </strong>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40">
                  <span className="text-[10px] text-[#C4B5FD] block">
                    {locale === 'ar' ? 'التفاعل الشامل' : 'Full Engagement'}
                  </span>
                  <strong className="text-[#A78BFA] font-en">
                    {formatDigits(selectedReel.fullEngagementRatePct, digits)}%
                  </strong>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Re-Engineered 9-Pillar Authority & Conversion Interactive Spectrum & Orbital Gauge
 * Replaces the old mechanical rotating cone with a fluid, multi-layered orbital gauge
 * + live interactive 9-pillar horizontal equalizer matrix with magnetic spring layout highlight.
 */
export function ScorecardRadarChart({
  categories,
  locale,
  digits,
  selectedIndex: externalSelectedIdx,
  onSelectIndex,
}: {
  categories: Array<{ categoryKey: AuditCategoryKey; score: number }>
  locale: AuditLocale
  digits: DigitMode
  selectedIndex?: number
  onSelectIndex?: (idx: number) => void
}) {
  const dict = getDictionary(locale)
  const [internalIdx, setInternalIdx] = useState<number>(0)
  const [autoPlay, setAutoPlay] = useState<boolean>(false)
  const activeIdx = externalSelectedIdx ?? internalIdx
  const count = categories.length || 9

  const handleSelect = (idx: number) => {
    setInternalIdx(idx)
    if (onSelectIndex) {
      onSelectIndex(idx)
    }
  }

  useEffect(() => {
    if (!autoPlay || count <= 1) return
    const timer = window.setInterval(() => {
      const next = ((externalSelectedIdx ?? internalIdx) + 1) % count
      setInternalIdx(next)
      if (onSelectIndex) onSelectIndex(next)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [autoPlay, count, externalSelectedIdx, internalIdx, onSelectIndex])

  const safeActiveIdx = Math.max(0, Math.min(categories.length - 1, activeIdx))
  const activeCategory = categories[safeActiveIdx]
  const activeScore = activeCategory?.score ?? 5
  const animatedActiveScore = Math.round(useCountUp(activeScore * 10, 480)) / 10
  const gapToTarget = Math.max(0, 10 - activeScore)

  const activeBand = getScoreBandStatus(activeScore)
  const activeAccent =
    activeBand === 'strong'
      ? '#5E9E7E'
      : activeBand === 'warning'
        ? '#C89D54'
        : '#B86B77'

  const gaugeSize = 152
  const strokeWidth = 10
  const radius = (gaugeSize - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (Math.max(0.5, activeScore) / 10) * circumference

  return (
    <div className="flex flex-col justify-between w-full h-full select-none space-y-4">
      {/* Top Interactive Orbital Score Reactor & Target Gap Header */}
      <div className="relative p-4 rounded-2xl bg-[#100B1A]/95 border border-[#8B5CF6]/25 overflow-hidden">
        <motion.div
          key={activeAccent}
          initial={{ opacity: 0.08, scale: 0.9 }}
          animate={{ opacity: 0.16, scale: 1.02 }}
          transition={{ duration: 0.6 }}
          className="absolute -top-10 -end-10 w-36 h-36 rounded-full blur-3xl pointer-events-none"
          style={{ background: activeAccent }}
        />

        <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: activeAccent }}
            />
            <span className="text-xs font-bold text-[#E2D9F3]/85">
              {locale === 'ar' ? 'مؤشر كفاءة المحور النشط' : 'Active Pillar Precision Gauge'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAutoPlay((p) => !p)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
              autoPlay
                ? 'bg-[#8B5CF6] text-white border-[#A78BFA] shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                : 'bg-[#0D0816] text-[#C4B5FD] border-[#8B5CF6]/35 hover:border-[#8B5CF6]'
            }`}
          >
            {autoPlay
              ? locale === 'ar'
                ? '⏸ إيقاف العرض التلقائي'
                : '⏸ Pause Auto-Tour'
              : locale === 'ar'
                ? '▶ استعراض تلقائي للمحاور'
                : '▶ Auto-Cycle Pillars'}
          </button>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
          {/* Animated Dual-Ring Orbital Gauge */}
          <div className="relative w-[136px] h-[136px] flex items-center justify-center shrink-0">
            <svg
              viewBox={`0 0 ${gaugeSize} ${gaugeSize}`}
              className="w-full h-full -rotate-90 transform overflow-visible"
            >
              <defs>
                <linearGradient id="apxPillarOrbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="55%" stopColor={activeAccent} />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
              </defs>

              {/* Outer subtle segmented tick ring */}
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius + 9}
                fill="none"
                stroke="rgba(167, 139, 250, 0.16)"
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />

              {/* Track circle */}
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                fill="rgba(13, 8, 22, 0.75)"
                stroke="rgba(226, 217, 243, 0.1)"
                strokeWidth={strokeWidth}
              />

              {/* Animated Spring Progress Arc */}
              <motion.circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                fill="transparent"
                stroke="url(#apxPillarOrbGrad)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[10px] font-bold text-[#A78BFA]">
                #{String(safeActiveIdx + 1).padStart(2, '0')}
              </span>
              <motion.span
                key={activeScore}
                initial={{ scale: 0.85, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="apx-serif-numeral text-3xl font-bold text-white leading-none mt-0.5"
              >
                {formatDigits(animatedActiveScore, digits)}
              </motion.span>
              <span className="text-[11px] font-en text-[#E2D9F3]/60 mt-0.5">/ 10</span>
            </div>
          </div>

          {/* Active Pillar Summary & Gap-to-Excellence Breakdown */}
          {activeCategory && (
            <div className="flex-1 min-w-0 space-y-2.5 w-full text-center sm:text-start">
              <div>
                <span className="text-[11px] font-bold text-[#A78BFA] block">
                  {locale === 'ar'
                    ? `المحور ${formatDigits(safeActiveIdx + 1, digits)} من 9`
                    : `Pillar ${safeActiveIdx + 1} of 9`}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-1">
                  {dict.categories[activeCategory.categoryKey] || activeCategory.categoryKey}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-[#090510]/90 border border-[#8B5CF6]/25">
                  <span className="text-[10px] text-[#E2D9F3]/60 block">
                    {locale === 'ar' ? 'التقييم الحالي' : 'Current Score'}
                  </span>
                  <strong className="font-en text-sm font-bold text-white">
                    {formatDigits(activeScore * 10, digits)}%
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-[#090510]/90 border border-[#8B5CF6]/25">
                  <span className="text-[10px] text-[#E2D9F3]/60 block">
                    {locale === 'ar' ? 'فجوة الاحتراف' : 'Gap to 10/10'}
                  </span>
                  <strong
                    className="font-en text-sm font-bold"
                    style={{ color: gapToTarget > 3 ? '#D48A94' : '#7BC4A0' }}
                  >
                    -{formatDigits(gapToTarget, digits)} {locale === 'ar' ? 'نقاط' : 'pts'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive 9-Pillar Animated Spectrum Bars (Click or Hover Any Pillar) */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        {categories.map((c, idx) => {
          const isSelected = safeActiveIdx === idx
          const band = getScoreBandStatus(c.score)
          const barColor =
            band === 'strong'
              ? 'from-[#4E8C6F] to-[#68AD8D]'
              : band === 'warning'
                ? 'from-[#B58942] to-[#CFA45D]'
                : 'from-[#A65B67] to-[#C2727E]'
          const label = (dict.categories[c.categoryKey] || c.categoryKey)
            .split('(')[0]
            .trim()

          return (
            <motion.button
              key={c.categoryKey}
              type="button"
              onClick={() => {
                setAutoPlay(false)
                handleSelect(idx)
              }}
              onMouseEnter={() => {
                if (!autoPlay) handleSelect(idx)
              }}
              whileHover={{ scale: 1.005 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className={`relative w-full px-3 py-2 rounded-xl text-start transition-colors overflow-hidden border ${
                isSelected
                  ? 'bg-[#171026]/95 border-[#8B5CF6]/45 shadow-[0_4px_16px_rgba(139,92,246,0.12)]'
                  : 'bg-[#0C0814]/85 border-[#8B5CF6]/12 hover:border-[#8B5CF6]/30'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activePillarSpectrumHighlight"
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/20 via-[#A78BFA]/10 to-transparent pointer-events-none"
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-2 text-xs mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-en text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                      isSelected
                        ? 'bg-[#8B5CF6] text-white'
                        : 'bg-[#1A0F2E] text-[#A78BFA]'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`truncate font-bold ${
                      isSelected ? 'text-white' : 'text-[#E2D9F3]/80'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                <span className="font-en font-bold text-xs text-white shrink-0">
                  {formatDigits(c.score, digits)}
                  <span className="text-[#E2D9F3]/45 text-[10px]">/10</span>
                </span>
              </div>

              {/* Animated Bar Fill */}
              <div className="relative z-10 w-full h-1.5 rounded-full bg-[#07040C] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, c.score * 10)}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 130,
                    damping: 22,
                    delay: idx * 0.03,
                  }}
                  className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                />
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
