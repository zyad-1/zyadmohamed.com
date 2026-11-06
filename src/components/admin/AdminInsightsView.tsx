'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  LineChart,
  BarChart3,
  PieChart,
  Globe,
  RefreshCw,
  Users,
  Calendar,
  Eye,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react'
import type { AdminLocale } from '@/modules/audit/i18n/adminDict'

interface AdminInsightsViewProps {
  insightsData: any
  loading: boolean
  adminLang: AdminLocale
  onRefresh: () => void
}

function AnimatedCounter({
  value,
  suffix = '',
}: {
  value: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = Number(value || 0)
    const duration = 550
    const startTime = performance.now()
    let rafId = 0

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      setDisplay(Number.isInteger(target) ? Math.round(current) : Number(current.toFixed(1)))
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [value])

  return (
    <span>
      {display}
      {suffix}
    </span>
  )
}

/**
 * Animated SVG Multi-Series Daily Timeline Curve Chart (Date-Based)
 */
function DailyTimelineCurveChart({
  timeline,
  isRtl,
}: {
  timeline: Array<{
    date: string
    labelAr: string
    labelEn: string
    websiteViews: number
    auditOpens: number
    bookings: number
    totalViews: number
  }>
  isRtl: boolean
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [visibleSeries, setVisibleSeries] = useState<
    'all' | 'website' | 'audits' | 'bookings'
  >('all')
  const safeData = Array.isArray(timeline) && timeline.length >= 2 ? timeline : []

  if (safeData.length === 0) return null

  const width = 920
  const height = 220
  const padX = 48
  const padY = 26
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const maxVal = Math.max(
    5,
    ...safeData.map((d) =>
      Math.max(
        visibleSeries === 'all' || visibleSeries === 'website' ? d.websiteViews || 0 : 0,
        visibleSeries === 'all' || visibleSeries === 'audits' ? d.auditOpens || 0 : 0,
        visibleSeries === 'all' || visibleSeries === 'bookings' ? d.bookings || 0 : 0,
        1
      )
    )
  )

  const buildSmoothPath = (getter: (d: (typeof safeData)[0]) => number) => {
    const pts = safeData.map((d, idx) => {
      const ratioX = safeData.length > 1 ? idx / (safeData.length - 1) : 0.5
      const x = padX + ratioX * innerW
      const val = Math.max(0, Number(getter(d) || 0))
      const y = padY + innerH - (val / maxVal) * innerH
      return { x, y, val }
    })

    let path = ''
    pts.forEach((pt, i) => {
      if (i === 0) {
        path += `M ${pt.x} ${pt.y}`
      } else {
        const prev = pts[i - 1]
        const cx1 = prev.x + (pt.x - prev.x) * 0.45
        const cy1 = prev.y
        const cx2 = prev.x + (pt.x - prev.x) * 0.55
        const cy2 = pt.y
        path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`
      }
    })

    const firstX = pts[0]?.x ?? padX
    const lastX = pts[pts.length - 1]?.x ?? width - padX
    const bottomY = padY + innerH
    const area = `${path} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
    return { path, area, pts }
  }

  const viewsSeries = buildSmoothPath((d) => d.websiteViews)
  const auditsSeries = buildSmoothPath((d) => d.auditOpens)
  const bookingsSeries = buildSmoothPath((d) => d.bookings)
  const activeIdx = hoverIdx !== null ? hoverIdx : safeData.length - 1
  const activeDay = safeData[activeIdx]

  return (
    <div className="space-y-4">
      {/* Interactive Series Filter & Active Day Inspector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#090610] p-1 rounded-xl border border-[#8B5CF6]/25">
          {(
            [
              { id: 'all', ar: 'كل المنحنيات', en: 'All Curves', dot: 'bg-[#F5F2FF]' },
              {
                id: 'website',
                ar: 'زيارات الموقع',
                en: 'Website Views',
                dot: 'bg-[#9D7BFF]',
              },
              {
                id: 'audits',
                ar: 'فتح الأوديت',
                en: 'Audit Opens',
                dot: 'bg-[#D4AF6A]',
              },
              {
                id: 'bookings',
                ar: 'الحجوزات',
                en: 'Bookings',
                dot: 'bg-[#63B08D]',
              },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setVisibleSeries(s.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                visibleSeries === s.id
                  ? 'bg-[#8B5CF6]/25 text-white border border-[#8B5CF6]/50 shadow-sm'
                  : 'text-[#E2D9F3]/65 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span>{isRtl ? s.ar : s.en}</span>
            </button>
          ))}
        </div>

        {activeDay && (
          <motion.div
            key={activeDay.date}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3.5 py-1.5 rounded-xl bg-[#140B24] border border-[#8B5CF6]/40 text-xs font-en flex flex-wrap items-center gap-3 shadow-md"
          >
            <strong className="text-white">
              {isRtl ? activeDay.labelAr : activeDay.labelEn}
            </strong>
            <span className="text-[#B89CFF] font-bold">
              {isRtl ? 'الموقع:' : 'Site:'} {activeDay.websiteViews}
            </span>
            <span className="text-[#E0B973] font-bold">
              {isRtl ? 'الأوديت:' : 'Audits:'} {activeDay.auditOpens}
            </span>
            <span className="text-[#7BC4A0] font-bold">
              {isRtl ? 'حجز:' : 'Booked:'} {activeDay.bookings}
            </span>
          </motion.div>
        )}
      </div>

      <div className="w-full overflow-x-auto rounded-2xl bg-[#090611]/95 border border-[#8B5CF6]/20 px-4 py-3">
        <svg
          viewBox={`0 0 ${width} ${height + 24}`}
          className="w-full h-52 sm:h-56 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="dailyViewsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9D7BFF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#9D7BFF" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="dailyAuditsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF6A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#D4AF6A" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="dailyBookingsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#63B08D" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#63B08D" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
            const y = padY + innerH * step
            const val = Math.round(maxVal * (1 - step))
            return (
              <g key={idx}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="rgba(139, 92, 246, 0.14)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padX - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(226, 217, 243, 0.45)"
                  fontSize="10"
                  fontFamily="Chillax, sans-serif"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* Animated Hover Crosshair Line */}
          {viewsSeries.pts[activeIdx] && (
            <line
              x1={viewsSeries.pts[activeIdx].x}
              y1={padY}
              x2={viewsSeries.pts[activeIdx].x}
              y2={padY + innerH}
              stroke="rgba(167, 139, 250, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {(visibleSeries === 'all' || visibleSeries === 'website') && (
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              d={viewsSeries.area}
              fill="url(#dailyViewsArea)"
            />
          )}
          {(visibleSeries === 'all' || visibleSeries === 'audits') && (
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.65 }}
              d={auditsSeries.area}
              fill="url(#dailyAuditsArea)"
            />
          )}
          {(visibleSeries === 'all' || visibleSeries === 'bookings') && (
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              d={bookingsSeries.area}
              fill="url(#dailyBookingsArea)"
            />
          )}

          {(visibleSeries === 'all' || visibleSeries === 'website') && (
            <motion.path
              key={`w-${visibleSeries}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
              d={viewsSeries.path}
              fill="none"
              stroke="#9D7BFF"
              strokeWidth="2.75"
              strokeLinecap="round"
            />
          )}

          {(visibleSeries === 'all' || visibleSeries === 'audits') && (
            <motion.path
              key={`a-${visibleSeries}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
              d={auditsSeries.path}
              fill="none"
              stroke="#D4AF6A"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}

          {(visibleSeries === 'all' || visibleSeries === 'bookings') && (
            <motion.path
              key={`b-${visibleSeries}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              d={bookingsSeries.path}
              fill="none"
              stroke="#63B08D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}

          {viewsSeries.pts.map((pt, idx) => {
            const isHovered = activeIdx === idx
            const showDateLabel =
              safeData.length <= 10 || idx % 2 === 0 || idx === safeData.length - 1
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={pt.x - 16}
                  y={padY}
                  width="32"
                  height={innerH}
                  fill="transparent"
                />
                {(visibleSeries === 'all' || visibleSeries === 'website') && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? '#9D7BFF' : '#0D0816'}
                    stroke="#F5F2FF"
                    strokeWidth={isHovered ? '2.2' : '1.8'}
                  />
                )}
                {(visibleSeries === 'all' || visibleSeries === 'audits') && (
                  <circle
                    cx={auditsSeries.pts[idx].x}
                    cy={auditsSeries.pts[idx].y}
                    r={isHovered ? 5 : 3.2}
                    fill={isHovered ? '#D4AF6A' : '#0D0816'}
                    stroke="#D4AF6A"
                    strokeWidth="1.8"
                  />
                )}
                {(visibleSeries === 'all' || visibleSeries === 'bookings') && (
                  <circle
                    cx={bookingsSeries.pts[idx].x}
                    cy={bookingsSeries.pts[idx].y}
                    r={isHovered ? 5 : 3.2}
                    fill={isHovered ? '#63B08D' : '#0D0816'}
                    stroke="#63B08D"
                    strokeWidth="1.8"
                  />
                )}
                {showDateLabel && (
                  <text
                    x={pt.x}
                    y={padY + innerH + 18}
                    textAnchor="middle"
                    fill={isHovered ? '#FFFFFF' : 'rgba(226, 217, 243, 0.7)'}
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    fontSize="10"
                  >
                    {isRtl ? safeData[idx].labelAr : safeData[idx].labelEn}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/**
 * Pure SVG Smooth Bezier Curve Chart for Funnel Steps
 */
function VisualCurveChart({
  points,
  isRtl,
}: {
  points: Array<{ label: string; value: number; color?: string }>
  isRtl: boolean
}) {
  const safePoints =
    points && points.length >= 2
      ? points
      : [
          { label: isRtl ? 'الزيارات' : 'Views', value: 0 },
          { label: isRtl ? 'التفاعل' : 'Engaged', value: 0 },
          { label: isRtl ? 'الخطوات' : 'Steps', value: 0 },
          { label: isRtl ? 'الحجوزات' : 'Booked', value: 0 },
        ]

  const width = 760
  const height = 195
  const padX = 52
  const padY = 26
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const maxVal = Math.max(10, ...safePoints.map((p) => Number(p.value || 0)))

  const coords = safePoints.map((p, idx) => {
    const ratioX =
      safePoints.length > 1 ? idx / (safePoints.length - 1) : 0.5
    const x = padX + ratioX * innerW
    const val = Math.max(0, Number(p.value || 0))
    const y = padY + innerH - (val / maxVal) * innerH
    return { x, y, label: p.label, value: val }
  })

  let linePath = ''
  coords.forEach((pt, i) => {
    if (i === 0) {
      linePath += `M ${pt.x} ${pt.y}`
    } else {
      const prev = coords[i - 1]
      const cx1 = prev.x + (pt.x - prev.x) * 0.45
      const cy1 = prev.y
      const cx2 = prev.x + (pt.x - prev.x) * 0.55
      const cy2 = pt.y
      linePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`
    }
  })

  const firstX = coords[0]?.x ?? padX
  const lastX = coords[coords.length - 1]?.x ?? width - padX
  const bottomY = padY + innerH
  const areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height + 24}`}
        className="w-full h-48 sm:h-52 select-none overflow-visible"
      >
        <defs>
          <linearGradient id="apxCurveAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9D7BFF" stopOpacity="0.34" />
            <stop offset="65%" stopColor="#7C56D9" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#63B08D" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="apxCurveStrokeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#B89CFF" />
            <stop offset="55%" stopColor="#9D7BFF" />
            <stop offset="100%" stopColor="#63B08D" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
          const y = padY + innerH * step
          const val = Math.round(maxVal * (1 - step))
          return (
            <g key={idx}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="rgba(139, 92, 246, 0.14)"
                strokeDasharray="4 4"
              />
              <text
                x={padX - 10}
                y={y + 4}
                textAnchor="end"
                fill="rgba(226, 217, 243, 0.45)"
                fontSize="10"
                fontFamily="Chillax, sans-serif"
              >
                {val}
              </text>
            </g>
          )
        })}

        <path d={areaPath} fill="url(#apxCurveAreaGrad)" />

        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          d={linePath}
          fill="none"
          stroke="url(#apxCurveStrokeGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {coords.map((pt, idx) => (
          <g key={idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5.5"
              fill="#0D0816"
              stroke={idx === coords.length - 1 ? '#63B08D' : '#9D7BFF'}
              strokeWidth="2.5"
            />
            <rect
              x={pt.x - 22}
              y={pt.y - 26}
              width="44"
              height="17"
              rx="6"
              fill="#140E22"
              stroke="rgba(157,123,255,0.38)"
            />
            <text
              x={pt.x}
              y={pt.y - 14}
              textAnchor="middle"
              fill="#F5F2FF"
              fontSize="10"
              fontWeight="bold"
              fontFamily="Chillax, sans-serif"
            >
              {pt.value}
            </text>
            <text
              x={pt.x}
              y={bottomY + 19}
              textAnchor="middle"
              fill="rgba(226, 217, 243, 0.85)"
              fontSize="10.5"
              fontWeight="600"
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/**
 * Pure SVG Radial Gauge Ring for Percentages (Retention / Conversion)
 */
function VisualRingGauge({
  percentage,
  label,
  sublabel,
  color = '#8B5CF6',
}: {
  percentage: number
  label: string
  sublabel: string
  color?: string
}) {
  const safePct = Math.max(0, Math.min(100, Number(percentage || 0)))
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (safePct / 100) * circumference

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0B0713] border border-[#8B5CF6]/20">
      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="rgba(139, 92, 246, 0.15)"
            strokeWidth="8"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute font-en text-base font-bold text-white">
          <AnimatedCounter value={safePct} suffix="%" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-[#E2D9F3]/65 leading-relaxed">{sublabel}</p>
      </div>
    </div>
  )
}

export default function AdminInsightsView({
  insightsData,
  loading,
  adminLang,
  onRefresh,
}: AdminInsightsViewProps) {
  const isRtl = adminLang === 'ar'
  const [tier, setTier] = useState<'overall' | 'website' | 'audits'>('overall')

  // Dynamic Date-Based Filtering State
  const [dateRange, setDateRange] = useState<
    'today' | '7d' | '30d' | '90d' | 'all' | 'custom'
  >('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [filteredInsights, setFilteredInsights] = useState<any>(null)
  const [fetchingRange, setFetchingRange] = useState(false)

  useEffect(() => {
    if (dateRange === 'all' && !customFrom && !customTo && insightsData) {
      setFilteredInsights(insightsData)
    }
  }, [insightsData, dateRange, customFrom, customTo])

  const loadRangeInsights = async (
    nextRange = dateRange,
    fromVal = customFrom,
    toVal = customTo
  ) => {
    setFetchingRange(true)
    try {
      const qs = new URLSearchParams({ range: nextRange })
      if (nextRange === 'custom') {
        if (fromVal) qs.set('from', fromVal)
        if (toVal) qs.set('to', toVal)
      }
      const res = await fetch(`/api/insights?${qs.toString()}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const json = await res.json()
        setFilteredInsights(json)
      }
    } catch {
      // ignore
    } finally {
      setFetchingRange(false)
    }
  }

  const handleSelectPresetRange = (
    r: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom'
  ) => {
    setDateRange(r)
    if (r !== 'custom') {
      loadRangeInsights(r, customFrom, customTo)
    }
  }

  const activeData = filteredInsights || insightsData
  const overall = activeData?.overall
  const website = activeData?.website || activeData?.mainWebsite
  const audits = activeData?.audits
  const dailyTimeline = activeData?.dailyTimeline || []
  const periodComparison = activeData?.periodComparison
  const allRules = Array.isArray(activeData?.insightsRules)
    ? activeData.insightsRules
    : []
  const tierRules =
    tier === 'overall'
      ? allRules
      : allRules.filter(
          (r: any) => r.category === tier || r.category === 'overall'
        )

  return (
    <div className="space-y-6">
      {/* Header Bar + Date Range Filter */}
      <div className="apx-bento-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {isRtl ? 'إحصائيات' : 'Insights'}
              </h1>
              <p className="text-xs sm:text-sm text-[#E2D9F3]/65 mt-0.5">
                {isRtl
                  ? 'منحنيات الأداء الديناميكية حسب التاريخ، قواعد التحليل الذكي، والتوزيع الجغرافي'
                  : 'Dynamic date-based performance curves, intelligent benchmark rules, and geo telemetry'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onRefresh()
              loadRangeInsights(dateRange, customFrom, customTo)
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/35 px-4 py-2.5 text-xs font-bold text-white transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 text-[#A78BFA] ${
                loading || fetchingRange ? 'animate-spin' : ''
              }`}
            />
            <span>{isRtl ? 'تحديث الإحصائيات' : 'Refresh Insights'}</span>
          </button>
        </div>

        {/* Unified Tier Switcher + Dynamic Date Range Selector Bar */}
        <div className="pt-4 border-t border-[#8B5CF6]/20 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* 3-Tier Switcher */}
          <div className="flex flex-wrap gap-1.5 bg-[#090610] p-1.5 rounded-2xl border border-[#8B5CF6]/25">
            {(
              [
                {
                  id: 'overall',
                  label: isRtl ? 'الإحصائيات الشاملة' : 'Overall Insights',
                  icon: <LineChart className="w-3.5 h-3.5" />,
                },
                {
                  id: 'website',
                  label: isRtl ? 'الصفحة الرئيسية' : 'Main Website',
                  icon: <BarChart3 className="w-3.5 h-3.5" />,
                },
                {
                  id: 'audits',
                  label: isRtl ? 'تقارير الأوديت' : 'Audit Reports',
                  icon: <PieChart className="w-3.5 h-3.5" />,
                },
              ] as const
            ).map((tab) => {
              const active = tier === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTier(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white shadow-lg shadow-[#8B5CF6]/25'
                      : 'text-[#E2D9F3]/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#090610] p-1.5 rounded-2xl border border-[#8B5CF6]/25">
            {(
              [
                { id: 'today', ar: 'اليوم', en: 'Today' },
                { id: '7d', ar: '7 أيام', en: '7D' },
                { id: '30d', ar: '30 يوماً', en: '30D' },
                { id: '90d', ar: '90 يوماً', en: '90D' },
                { id: 'all', ar: 'الكل', en: 'All Time' },
                { id: 'custom', ar: 'تاريخ مخصص', en: 'Custom' },
              ] as const
            ).map((preset) => {
              const isSelected = dateRange === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPresetRange(preset.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#8B5CF6]/30 text-white border border-[#8B5CF6]/55 shadow-sm'
                      : 'text-[#E2D9F3]/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isRtl ? preset.ar : preset.en}
                </button>
              )
            })}
          </div>

          {dateRange === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 bg-[#090610] px-3 py-1.5 rounded-xl border border-[#8B5CF6]/30 text-[#E2D9F3]">
                <span>{isRtl ? 'من:' : 'From:'}</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-transparent text-white font-en focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-1.5 bg-[#090610] px-3 py-1.5 rounded-xl border border-[#8B5CF6]/30 text-[#E2D9F3]">
                <span>{isRtl ? 'إلى:' : 'To:'}</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-transparent text-white font-en focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => loadRangeInsights('custom', customFrom, customTo)}
                className="px-4 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all"
              >
                {isRtl ? 'تطبيق' : 'Apply'}
              </button>
            </div>
          )}
        </div>
      </div>

      {!activeData ? (
        <div className="apx-bento-card p-12 text-center text-sm text-[#E2D9F3]/60">
          {isRtl ? 'جاري تحميل الإحصائيات والرسوم البيانية...' : 'Loading visual insights...'}
        </div>
      ) : (
        <>
          {/* ==============================================================
              DAILY DATE-BASED TIMELINE CURVE (SHARED ACROSS TIERS)
             ============================================================== */}
          {dailyTimeline.length > 0 && (
            <div className="apx-bento-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-[#A78BFA]" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isRtl
                        ? 'المنحنى الزمني اليومي للزيارات وفتح التقارير والحجوزات'
                        : 'Daily Date-Based Traffic, Audit Opens & Bookings Curve'}
                    </h3>
                    <p className="text-xs text-[#E2D9F3]/60">
                      {isRtl
                        ? 'مرر المؤشر فوق أي يوم لعرض التفاصيل الدقيقة أو اختر المنحنى المطلوب'
                        : 'Hover over any date node or toggle individual series curves'}
                    </p>
                  </div>
                </div>
              </div>

              <DailyTimelineCurveChart timeline={dailyTimeline} isRtl={isRtl} />
            </div>
          )}

          {/* ==============================================================
              TIER 1: OVERALL INSIGHTS
             ============================================================== */}
          {tier === 'overall' && overall && (
            <div className="space-y-6">
              {/* Top KPI Cards with Animated Numbers & Growth Deltas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="apx-bento-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#E2D9F3]/65">
                    <span>{isRtl ? 'إجمالي المشاهدات' : 'Total Views'}</span>
                    <Eye className="w-4 h-4 text-[#A78BFA]" />
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-en text-2xl sm:text-3xl font-bold text-white">
                      <AnimatedCounter value={overall.totalViews || 0} />
                    </p>
                    {typeof periodComparison?.viewsGrowthPct === 'number' && (
                      <span className="text-[11px] font-en font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD]">
                        {periodComparison.viewsGrowthPct >= 0 ? '+' : ''}
                        {periodComparison.viewsGrowthPct}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="apx-bento-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#E2D9F3]/65">
                    <span>{isRtl ? 'الزوار الفريدون' : 'Unique Visitors'}</span>
                    <Users className="w-4 h-4 text-[#A78BFA]" />
                  </div>
                  <p className="font-en text-2xl sm:text-3xl font-bold text-[#A78BFA]">
                    <AnimatedCounter value={overall.uniqueVisitors || 0} />
                  </p>
                </div>

                <div className="apx-bento-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#E2D9F3]/65">
                    <span>{isRtl ? 'إجمالي الحجوزات' : 'Total Bookings'}</span>
                    <Calendar className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-en text-2xl sm:text-3xl font-bold text-[#10B981]">
                      <AnimatedCounter value={overall.totalBookings || 0} />
                    </p>
                    {typeof periodComparison?.bookingsGrowthPct === 'number' && (
                      <span className="text-[11px] font-en font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#6EE7B7]">
                        {periodComparison.bookingsGrowthPct >= 0 ? '+' : ''}
                        {periodComparison.bookingsGrowthPct}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="apx-bento-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#E2D9F3]/65">
                    <span>{isRtl ? 'نسبة التحويل للحجز' : 'Booking Rate'}</span>
                    <TrendingUp className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <p className="font-en text-2xl sm:text-3xl font-bold text-[#10B981]">
                    <AnimatedCounter
                      value={overall.conversionRatePct || 0}
                      suffix="%"
                    />
                  </p>
                </div>

                <div className="apx-bento-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#E2D9F3]/65">
                    <span>{isRtl ? 'متوسط الاحتفاظ' : 'Avg Retention'}</span>
                    <Activity className="w-4 h-4 text-[#38BDF8]" />
                  </div>
                  <p className="font-en text-2xl sm:text-3xl font-bold text-[#38BDF8]">
                    <AnimatedCounter
                      value={overall.avgRetentionPct || 0}
                      suffix="%"
                    />
                  </p>
                </div>
              </div>

              {/* Visual Curve Chart + Ring Gauges */}
              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 apx-bento-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <LineChart className="w-5 h-5 text-[#A78BFA]" />
                      <h3 className="text-base font-bold text-white">
                        {isRtl
                          ? 'منحنى تدفق الزيارات والتحويل الشامل'
                          : 'Overall Traffic & Conversion Curve'}
                      </h3>
                    </div>
                  </div>

                  <VisualCurveChart
                    isRtl={isRtl}
                    points={[
                      {
                        label: isRtl ? 'إجمالي المشاهدات' : 'Total Views',
                        value: overall.totalViews || 0,
                      },
                      {
                        label: isRtl ? 'الزوار الفريدون' : 'Unique Visitors',
                        value: overall.uniqueVisitors || 0,
                      },
                      {
                        label: isRtl ? 'التفاعل والفتح' : 'Engaged Opens',
                        value:
                          (website?.vslPlays || 0) + (audits?.totalOpens || 0),
                      },
                      {
                        label: isRtl ? 'إكمال الفورم' : 'Form Completed',
                        value: website?.formSubmissionsCount || 0,
                      },
                      {
                        label: isRtl ? 'حجز المكالمة' : 'Booked Calls',
                        value: overall.totalBookings || 0,
                      },
                    ]}
                  />
                </div>

                <div className="lg:col-span-4 apx-bento-card p-6 flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#A78BFA]" />
                    <h3 className="text-base font-bold text-white">
                      {isRtl
                        ? 'مؤشرات الكفاءة والاحتفاظ'
                        : 'Retention & Conversion Gauges'}
                    </h3>
                  </div>

                  <VisualRingGauge
                    percentage={overall.avgRetentionPct || 0}
                    label={isRtl ? 'معدل الاحتفاظ بالعميل' : 'Client Retention Rate'}
                    sublabel={
                      isRtl
                        ? 'متوسط عمق القراءة والتفاعل في الموقع والأوديت'
                        : 'Average scroll & reading depth across pages'
                    }
                    color="#38BDF8"
                  />

                  <VisualRingGauge
                    percentage={overall.conversionRatePct || 0}
                    label={isRtl ? 'معدل التحويل للحجز' : 'Booking Conversion Rate'}
                    sublabel={
                      isRtl
                        ? 'نسبة الزوار الذين قاموا بحجز مكالمة استراتيجية'
                        : 'Percentage of visitors booking a strategy call'
                    }
                    color="#10B981"
                  />
                </div>
              </div>

              {/* Visual Country Distribution Bars */}
              <div className="grid md:grid-cols-3 gap-5">
                <div className="apx-bento-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#A78BFA]" />
                    <h3 className="text-sm font-bold text-white">
                      {isRtl ? 'أكثر الدول زيارةً' : 'Top Countries by Views'}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {(overall.topCountriesByViews || []).length === 0 ? (
                      <p className="text-xs text-[#E2D9F3]/45">
                        {isRtl ? 'لا توجد زيارات مسجلة بعد' : 'No visits recorded yet'}
                      </p>
                    ) : (
                      (overall.topCountriesByViews || []).map((c: any) => {
                        const maxV = Math.max(
                          1,
                          overall.topCountriesByViews[0]?.views || 1
                        )
                        const pct = Math.min(100, Math.round((c.views / maxV) * 100))
                        return (
                          <div key={c.code} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 font-bold text-white">
                                <span className="text-base">{c.flag}</span>
                                <span>{isRtl ? c.nameAr : c.nameEn}</span>
                              </span>
                              <span className="font-en font-bold text-[#A78BFA]">
                                {c.views}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[#080608] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(8, pct)}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]"
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="apx-bento-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#10B981]" />
                    <h3 className="text-sm font-bold text-white">
                      {isRtl ? 'أكثر الدول حجزاً للمكالمات' : 'Top Countries by Bookings'}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {(overall.topCountriesByBookings || []).length === 0 ? (
                      <p className="text-xs text-[#E2D9F3]/45">
                        {isRtl ? 'لا توجد حجوزات مسجلة بعد' : 'No bookings recorded yet'}
                      </p>
                    ) : (
                      (overall.topCountriesByBookings || []).map((c: any) => {
                        const maxB = Math.max(
                          1,
                          overall.topCountriesByBookings[0]?.bookings || 1
                        )
                        const pct = Math.min(
                          100,
                          Math.round((c.bookings / maxB) * 100)
                        )
                        return (
                          <div key={c.code} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 font-bold text-white">
                                <span className="text-base">{c.flag}</span>
                                <span>{isRtl ? c.nameAr : c.nameEn}</span>
                              </span>
                              <span className="font-en font-bold text-[#10B981]">
                                {c.bookings} ({c.conversionPct}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[#080608] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(8, pct)}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-[#059669] to-[#10B981]"
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="apx-bento-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#38BDF8]" />
                    <h3 className="text-sm font-bold text-white">
                      {isRtl ? 'أكثر الدول احتفاظاً وقراءة' : 'Top Countries by Retention'}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {(overall.topCountriesByRetention || []).length === 0 ? (
                      <p className="text-xs text-[#E2D9F3]/45">
                        {isRtl ? 'لا توجد بيانات بعد' : 'No retention data yet'}
                      </p>
                    ) : (
                      (overall.topCountriesByRetention || []).map((c: any) => (
                        <div key={c.code} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 font-bold text-white">
                              <span className="text-base">{c.flag}</span>
                              <span>{isRtl ? c.nameAr : c.nameEn}</span>
                            </span>
                            <span className="font-en font-bold text-[#38BDF8]">
                              {c.avgRetentionPct}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[#080608] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.max(8, c.avgRetentionPct || 0)}%`,
                              }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="h-full rounded-full bg-gradient-to-r from-[#0284C7] to-[#38BDF8]"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              TIER 2: MAIN WEBSITE INSIGHTS
             ============================================================== */}
          {tier === 'website' && website && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'زيارات الصفحة الرئيسية' : 'Main Site Views'}
                  </p>
                  <p className="font-en text-2xl font-bold text-white">
                    <AnimatedCounter value={website.pageViews || 0} />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'تشغيل الفيديو التقديمي' : 'VSL Video Plays'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#A78BFA]">
                    <AnimatedCounter value={website.vslPlays || 0} />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'إرسال النموذج' : 'Form Submissions'}
                  </p>
                  <p className="font-en text-2xl font-bold text-white">
                    <AnimatedCounter value={website.formSubmissionsCount || 0} />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'المؤهلون للحجز' : 'Qualified Leads'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#10B981]">
                    <AnimatedCounter value={website.qualifiedBookings || 0} />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'نسبة الحجز من الموقع' : 'Site Conversion %'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#10B981]">
                    <AnimatedCounter
                      value={website.conversionRatePct || 0}
                      suffix="%"
                    />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'متوسط الاحتفاظ بالموقع' : 'Site Avg Retention'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#38BDF8]">
                    <AnimatedCounter
                      value={website.avgRetentionPct || 0}
                      suffix="%"
                    />
                  </p>
                </div>
              </div>

              {/* Website Funnel Visual Curve */}
              <div className="apx-bento-card p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <LineChart className="w-5 h-5 text-[#A78BFA]" />
                  <h3 className="text-base font-bold text-white">
                    {isRtl
                      ? 'منحنى الفانل في الصفحة الرئيسية (من الزيارة حتى حجز المكالمة)'
                      : 'Main Website Funnel Conversion Curve'}
                  </h3>
                </div>
                <VisualCurveChart
                  isRtl={isRtl}
                  points={[
                    {
                      label: isRtl ? 'زيارات الصفحة' : 'Page Views',
                      value: website.pageViews || 0,
                    },
                    {
                      label: isRtl ? 'تشغيل الفيديو' : 'VSL Plays',
                      value: website.vslPlays || 0,
                    },
                    {
                      label: isRtl ? 'بدء الفورم' : 'Form Starts',
                      value: website.stepCompletions?.step1 || 0,
                    },
                    {
                      label: isRtl ? 'إكمال الفورم' : 'Completed',
                      value: website.formSubmissionsCount || 0,
                    },
                    {
                      label: isRtl ? 'حجز مؤهل' : 'Qualified Booked',
                      value: website.qualifiedBookings || 0,
                    },
                  ]}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Budget Breakdown Visual Bars */}
                <div className="apx-bento-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#A78BFA]" />
                    <h3 className="text-sm font-bold text-white">
                      {isRtl
                        ? 'توزيع اختيارات الميزانية للعملاء'
                        : 'Selected Budget Breakdown'}
                    </h3>
                  </div>

                  {Object.entries(website.budgetSelections || {}).length === 0 ? (
                    <p className="text-xs text-[#E2D9F3]/45">
                      {isRtl
                        ? 'لم يتم اختيار ميزانيات بعد'
                        : 'No budget selections recorded yet'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(website.budgetSelections || {}).map(
                        ([opt, count]: [string, any]) => {
                          const total = Math.max(
                            1,
                            Object.values(website.budgetSelections || {}).reduce(
                              (a: number, b: any) => a + Number(b || 0),
                              0
                            )
                          )
                          const pct = Math.round((Number(count || 0) / total) * 100)
                          return (
                            <div key={opt} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white font-bold">{opt}</span>
                                <span className="font-en font-bold text-[#A78BFA]">
                                  {count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-[#080608] overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(8, pct)}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="h-full rounded-full bg-gradient-to-r from-[#6D28D9] to-[#A78BFA]"
                                />
                              </div>
                            </div>
                          )
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Website Top Countries */}
                <div className="apx-bento-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#A78BFA]" />
                    <h3 className="text-sm font-bold text-white">
                      {isRtl
                        ? 'توزيع زوار وحجوزات الصفحة الرئيسية حسب الدولة'
                        : 'Main Website Visitors & Bookings by Country'}
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {(website.topCountries || []).length === 0 ? (
                      <p className="text-xs text-[#E2D9F3]/45">
                        {isRtl ? 'لا توجد زيارات مسجلة بعد' : 'No visits recorded yet'}
                      </p>
                    ) : (
                      (website.topCountries || []).map((c: any) => (
                        <div
                          key={c.code}
                          className="flex items-center justify-between rounded-xl bg-[#080608]/75 border border-[#8B5CF6]/20 px-3.5 py-2.5 text-xs"
                        >
                          <span className="flex items-center gap-2 font-bold text-white">
                            <span className="text-base">{c.flag}</span>
                            <span>{isRtl ? c.nameAr : c.nameEn}</span>
                          </span>
                          <div className="flex items-center gap-3 font-en">
                            <span className="text-[#A78BFA] font-bold">
                              {c.views} {isRtl ? 'زيارة' : 'views'}
                            </span>
                            <span className="text-[#10B981] font-bold">
                              {c.bookings} {isRtl ? 'حجز' : 'booked'}
                            </span>
                            <span className="text-[#38BDF8] font-bold">
                              {c.avgRetentionPct}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              TIER 3: AUDIT INSIGHTS (OVERALL + PER AUDIT)
             ============================================================== */}
          {tier === 'audits' && audits && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'إجمالي تقارير الأوديت' : 'Total Audits'}
                  </p>
                  <p className="font-en text-2xl font-bold text-white">
                    <AnimatedCounter value={audits.totalAudits || 0} />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'تقارير تم فتحها' : 'Opened Audits'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#10B981]">
                    <AnimatedCounter value={audits.openedAuditsCount || 0} />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'متوسط الفتح لكل أوديت' : 'Avg Opens / Audit'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#A78BFA]">
                    <AnimatedCounter value={audits.avgOpensPerAudit || 0} />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'حجوزات من الأوديت' : 'Audit Bookings'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#10B981]">
                    <AnimatedCounter value={audits.totalBookings || 0} />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'نسبة التحويل للحجز' : 'Audit Booking %'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#10B981]">
                    <AnimatedCounter
                      value={audits.bookingConversionPct || 0}
                      suffix="%"
                    />
                  </p>
                </div>
                <div className="apx-bento-card p-4">
                  <p className="text-[11px] text-[#E2D9F3]/60 mb-1">
                    {isRtl ? 'متوسط الاحتفاظ بالأوديت' : 'Avg Audit Retention'}
                  </p>
                  <p className="font-en text-2xl font-bold text-[#38BDF8]">
                    <AnimatedCounter
                      value={audits.avgRetentionPct || 0}
                      suffix="%"
                    />
                  </p>
                </div>
              </div>

              {/* Visual Curve for Audits */}
              <div className="apx-bento-card p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <LineChart className="w-5 h-5 text-[#A78BFA]" />
                  <h3 className="text-base font-bold text-white">
                    {isRtl
                      ? 'منحنى تفاعل العملاء مع تقارير الأوديت'
                      : 'Audit Reports Engagement & Booking Curve'}
                  </h3>
                </div>
                <VisualCurveChart
                  isRtl={isRtl}
                  points={[
                    {
                      label: isRtl ? 'إجمالي التقارير' : 'Total Audits',
                      value: audits.totalAudits || 0,
                    },
                    {
                      label: isRtl ? 'تقارير فُتحت' : 'Opened Audits',
                      value: audits.openedAuditsCount || 0,
                    },
                    {
                      label: isRtl ? 'إجمالي مرات الفتح' : 'Total Opens',
                      value: audits.totalOpens || 0,
                    },
                    {
                      label: isRtl ? 'الزوار الفريدون' : 'Unique Visitors',
                      value: audits.uniqueVisitors || 0,
                    },
                    {
                      label: isRtl ? 'حجز المكالمة' : 'Booked Calls',
                      value: audits.totalBookings || 0,
                    },
                  ]}
                />
              </div>

              {/* Per-Audit Breakdown Table */}
              <div className="apx-bento-card p-6 space-y-4">
                <h3 className="text-base font-bold text-white">
                  {isRtl
                    ? 'تفصيل كل أوديت على حدة (حالة الفتح، عدد المرات، الدول بالعلم، نسبة الاحتفاظ، وحالة الحجز)'
                    : 'Per-Audit Granular Telemetry (Opened, Count, Countries, Retention %, Booked)'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="border-b border-[#8B5CF6]/20 text-xs text-[#E2D9F3]/60">
                        <th className="py-3 px-3 text-start">
                          {isRtl ? 'العميل' : 'Client'}
                        </th>
                        <th className="py-3 px-3 text-start">
                          {isRtl ? 'حالة الفتح' : 'Opened?'}
                        </th>
                        <th className="py-3 px-3 text-start">
                          {isRtl ? 'مرات الفتح' : 'Opens'}
                        </th>
                        <th className="py-3 px-3 text-start">
                          {isRtl ? 'الدول (بالعلم)' : 'Countries'}
                        </th>
                        <th className="py-3 px-3 text-start">
                          {isRtl ? 'الاحتفاظ' : 'Retention'}
                        </th>
                        <th className="py-3 px-3 text-start">
                          {isRtl ? 'حجز مكالمة؟' : 'Booked Call?'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8B5CF6]/10 text-xs sm:text-sm">
                      {(audits.perAudit || []).map((a: any) => (
                        <tr key={a.auditId} className="hover:bg-[#8B5CF6]/[0.04]">
                          <td className="py-3.5 px-3 font-bold text-white">
                            <div>{a.clientName}</div>
                            <div className="font-en text-xs text-[#A78BFA]">
                              @{a.instagramHandle}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            {a.opened ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] text-xs font-bold">
                                {isRtl ? 'تم الفتح' : 'Opened'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-[#E2D9F3]/50 text-xs font-bold">
                                {isRtl ? 'لم يُفتح بعد' : 'Not Opened'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-en font-bold text-white">
                            {a.totalOpens} ({a.uniqueVisitors}{' '}
                            {isRtl ? 'فريد' : 'uniq'})
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex flex-wrap gap-1.5">
                              {(a.countries || []).length === 0 ? (
                                <span className="text-xs text-[#E2D9F3]/40">—</span>
                              ) : (
                                (a.countries || []).map((c: any) => (
                                  <span
                                    key={c.code}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#080608] border border-[#8B5CF6]/25 text-xs"
                                  >
                                    <span>{c.flag}</span>
                                    <span>{isRtl ? c.nameAr || c.countryName : c.code}</span>
                                    <span className="font-en text-[#A78BFA]">
                                      ({c.count})
                                    </span>
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-en font-bold text-[#38BDF8]">
                            {a.retentionPct}%
                          </td>
                          <td className="py-3.5 px-3">
                            {a.bookedCall ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] text-xs font-bold">
                                ✓ {isRtl ? `حجز (${a.ctaClicks})` : `Booked (${a.ctaClicks})`}
                              </span>
                            ) : (
                              <span className="text-xs text-[#E2D9F3]/45">
                                {isRtl ? 'لم يحجز بعد' : 'Not yet'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              GENERAL INSIGHTS RULES & BENCHMARKS ENGINE (AT BOTTOM FOR CLEAN FLOW)
             ============================================================== */}
          {tierRules.length > 0 && (
            <div className="apx-bento-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-[#A78BFA]" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isRtl
                        ? 'قواعد الإحصائيات العامة والتشخيص الذكي'
                        : 'General Insights Rules & Diagnostic Benchmarks'}
                    </h3>
                    <p className="text-xs text-[#E2D9F3]/65">
                      {isRtl
                        ? 'تقييم تلقائي لأداء الفانل والتقارير بناءً على المعايير القياسية ومعدلات التحويل في الفترة المحددة'
                        : 'Automated funnel & audit evaluation against standard high-ticket conversion benchmarks'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tierRules.map((rule: any, idx: number) => {
                  const isOptimal = rule.status === 'optimal'
                  const isWarning = rule.status === 'warning'
                  return (
                    <motion.div
                      key={rule.id || idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: idx * 0.06 }}
                      className="p-4 rounded-2xl bg-[#090611] border border-[#8B5CF6]/25 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isOptimal
                                ? 'bg-[#5E9E7E]/15 border-[#5E9E7E]/40 text-[#7BC4A0]'
                                : isWarning
                                  ? 'bg-[#C89D54]/15 border-[#C89D54]/40 text-[#E0B973]'
                                  : 'bg-[#B86B77]/15 border-[#B86B77]/40 text-[#E598A4]'
                            }`}
                          >
                            {isOptimal ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : isWarning ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isOptimal
                                ? isRtl
                                  ? 'ممتاز / متوافق'
                                  : 'Optimal'
                                : isWarning
                                  ? isRtl
                                    ? 'يحتاج تحسين'
                                    : 'Needs Attention'
                                  : isRtl
                                    ? 'أولوية قصوى'
                                    : 'Action Required'}
                            </span>
                          </span>

                          <div className="text-end">
                            <span className="font-en text-base font-extrabold text-white block">
                              {rule.metricValue}
                            </span>
                            <span className="text-[10px] text-[#E2D9F3]/55 block">
                              {isRtl ? rule.benchmarkLabelAr : rule.benchmarkLabelEn}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                          {isRtl ? rule.titleAr : rule.titleEn}
                        </h4>

                        <p className="text-xs text-[#E2D9F3]/75 leading-relaxed">
                          {isRtl ? rule.descriptionAr : rule.descriptionEn}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-[#8B5CF6]/15 text-[11px] text-[#C4B5FD] flex items-start gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#A78BFA] shrink-0 mt-0.5" />
                        <span>{isRtl ? rule.actionAr : rule.actionEn}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
