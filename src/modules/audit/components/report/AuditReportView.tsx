'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  FileDown,
  Flame,
  Globe,
  HelpCircle,
  Lock,
  MessageCircle,
  Moon,
  Play,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from 'lucide-react'
import { detectVisitorGeo } from '@/lib/countries'
import FomoBanner, { useUnifiedFomoTimer } from '@/components/FomoBanner'
import { useSystemTheme } from '@/lib/useSystemTheme'
import CalendlyInlineEmbed from '@/components/CalendlyInlineEmbed'
import '../../theme/tokens.css'
import ApxMark from '../brand/ApxMark'
import {
  AuditLocale,
  DigitMode,
  formatAuditNumber,
  formatDigits,
  getDictionary,
} from '../../i18n'
import {
  AuditCategoryKey,
  AuditCheckStatus,
  AuditProfileCheckKey,
  AuditSettingsData,
} from '../../schemas'
import { AuditMetricsReport, getScoreBandStatus } from '../../metrics'
import {
  AnimatedCountNumber,
  AnimatedScoreRing,
  ReelsMedianBarChart,
  ScorecardRadarChart,
} from './ReportCharts'

export interface PublicAuditReportData {
  id: string
  shareToken: string
  language: AuditLocale
  overallScore: number
  summaryOpening: string
  verdictLine?: string
  publishedAt?: string | null
  prospect: {
    handle: string
    displayName: string
    niche: string
    followers: number
    followingCount?: number | null
    postsCount?: number | null
    profileUrl: string
    linkInBioUrl?: string | null
    avatarUrl?: string | null
    bio?: string | null
    bioLinks?: Array<{ title: string; url: string }>
  }
  profileChecks: Array<{
    key: AuditProfileCheckKey
    status: AuditCheckStatus
    evidence: string
    screenshotUrl?: string | null
  }>
  categoryScores: Array<{
    categoryKey: AuditCategoryKey
    score: number
    autoSuggestedScore?: number | null
    isAutoSuggested: boolean
    isOverridden?: boolean
    evidence: string
    recommendation: string
    weight: number
  }>
  findings: Array<{
    rank: number
    title: string
    evidence: string
    businessImpact: string
    apxFix: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  }>
  competitors: Array<{
    handle: string
    displayName: string
    followers: number
    medianViews: number
    notes: string
  }>
  unmeasuredItems: Array<{
    label: string
    whyItMatters: string
    position: number
  }>
  metrics: AuditMetricsReport
  settings: AuditSettingsData
}

interface AuditReportViewProps {
  report: PublicAuditReportData
  isPreviewMode?: boolean
}

function sendBeaconEvent(
  token: string,
  sessionId: string,
  type:
    | 'OPEN'
    | 'SECTION_VIEW'
    | 'SCROLL_DEPTH'
    | 'CTA_CLICK'
    | 'LANGUAGE_TOGGLE'
    | 'UNLOCK_UPLOAD',
  payload: Record<string, unknown>,
  disabled?: boolean
) {
  if (disabled || typeof window === 'undefined') return
  if (
    navigator.doNotTrack === '1' ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === '1'
  ) {
    return
  }

  const cachedGeo =
    typeof window !== 'undefined'
      ? (window as unknown as { __apxGeoCache?: { countryCode?: string; countryName?: string } })
          .__apxGeoCache
      : undefined

  const body = JSON.stringify({
    token,
    sessionId,
    type,
    payload: {
      ...payload,
      ...(cachedGeo?.countryCode ? { countryCode: cachedGeo.countryCode } : {}),
      ...(cachedGeo?.countryName ? { countryName: cachedGeo.countryName } : {}),
    },
  })

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/audit/events', blob)
      return
    }
  } catch {
    // Fallback to fetch
  }

  fetch('/api/audit/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
}

export function AuditReportView({ report, isPreviewMode = false }: AuditReportViewProps) {
  const [locale, setLocale] = useState<AuditLocale>(report.language || 'ar')
  const [digits, setDigits] = useState<DigitMode>(
    report.settings?.defaultDigits || 'western'
  )
  const [activeSection, setActiveSection] = useState<string>('overview')
  const [expandedCalc, setExpandedCalc] = useState<Record<string, boolean>>({})

  // Interactive Slider & Carousel states (eliminates cluttered multi-card grids)
  const [selectedPillarKey, setSelectedPillarKey] = useState<AuditCategoryKey>(
    report.categoryScores[0]?.categoryKey || 'positioning'
  )
  const [pillarFilter, setPillarFilter] = useState<'all' | 'weak' | 'strong'>('all')
  const [selectedProblemIdx, setSelectedProblemIdx] = useState<number>(0)
  const [selectedCompetitorIdx, setSelectedCompetitorIdx] = useState<number>(0)
  const [selectedFunnelStageId, setSelectedFunnelStageId] = useState<string>('profile')
  const [selectedHookReelIdx, setSelectedHookReelIdx] = useState<number>(0)
  const [playingReelInline, setPlayingReelInline] = useState<boolean>(false)
  const [selectedTimestampFilter, setSelectedTimestampFilter] = useState<string | null>(null)
  const [reelTierFilter, setReelTierFilter] = useState<
    'ALL' | 'VIRAL' | 'ABOVE_AVERAGE' | 'UNDERPERFORMING'
  >('ALL')
  const [showEmbeddedCalendar, setShowEmbeddedCalendar] = useState<boolean>(false)
  const { themeMode, toggleThemeMode } = useSystemTheme()
  const { secondsLeft: fomoSecondsLeft } = useUnifiedFomoTimer(
    report.settings?.fomoCountdownMinutes ?? 30
  )

  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedTimestampFilter(null)
  }, [selectedHookReelIdx])

  const dict = getDictionary(locale)
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  const sessionStartRef = useRef<number>(Date.now())
  const sessionIdRef = useRef<string>('preview-session')
  const firedDepthsRef = useRef<Set<number>>(new Set())
  const firedOpenRef = useRef<boolean>(false)

  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    restDelta: 0.001,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const sectionEls = document.querySelectorAll('[data-audit-section]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const secId = entry.target.getAttribute('data-audit-section') || 'overview'
            setActiveSection(secId)
            if (!isPreviewMode) {
              const elapsedSec = Math.round((Date.now() - sessionStartRef.current) / 1000)
              sendBeaconEvent(
                report.shareToken,
                sessionIdRef.current,
                'SECTION_VIEW',
                { section: secId, elapsedSec, dwellSec: 10 },
                isPreviewMode
              )
            }
          }
        })
      },
      { threshold: 0.3 }
    )

    sectionEls.forEach((el) => observer.observe(el))

    if (isPreviewMode) {
      return () => observer.disconnect()
    }

    const storageKey = `apx_audit_sid_${report.shareToken}`
    let sid = window.localStorage.getItem(storageKey)
    if (!sid || sid.length < 8) {
      sid = `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
      window.localStorage.setItem(storageKey, sid)
    }
    sessionIdRef.current = sid
    sessionStartRef.current = Date.now()

    if (!firedOpenRef.current) {
      firedOpenRef.current = true
      detectVisitorGeo()
        .then((geo) => {
          sendBeaconEvent(
            report.shareToken,
            sid,
            'OPEN',
            {
              elapsedSec: 1,
              locale,
              ...(geo?.countryCode
                ? { countryCode: geo.countryCode, countryName: geo.countryName }
                : {}),
            },
            isPreviewMode
          )
        })
        .catch(() => {
          sendBeaconEvent(
            report.shareToken,
            sid,
            'OPEN',
            { elapsedSec: 1, locale },
            isPreviewMode
          )
        })
    }

    const onScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight
      if (docHeight <= 0) return
      const pct = Math.round((window.scrollY / docHeight) * 100)
      const elapsedSec = Math.round((Date.now() - sessionStartRef.current) / 1000)

      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !firedDepthsRef.current.has(milestone)) {
          firedDepthsRef.current.add(milestone)
          sendBeaconEvent(
            report.shareToken,
            sid,
            'SCROLL_DEPTH',
            { depth: milestone, elapsedSec },
            isPreviewMode
          )
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [isPreviewMode, report.shareToken, locale])

  const handleToggleLocale = () => {
    const next: AuditLocale = locale === 'ar' ? 'en' : 'ar'
    setLocale(next)
    const elapsedSec = Math.round((Date.now() - sessionStartRef.current) / 1000)
    sendBeaconEvent(
      report.shareToken,
      sessionIdRef.current,
      'LANGUAGE_TOGGLE',
      { to: next, elapsedSec },
      isPreviewMode
    )
  }

  const handleToggleDigits = () => {
    setDigits((prev) => (prev === 'western' ? 'arabic-indic' : 'western'))
  }

  const toggleCalc = (key: string) => {
    setExpandedCalc((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isDemo =
    report.prospect.handle.toLowerCase().includes('demo') ||
    report.prospect.displayName.toUpperCase().includes('DEMO') ||
    report.summaryOpening.toUpperCase().includes('DEMO')

  const verdictText = useMemo(() => {
    if (report.verdictLine && report.verdictLine.trim().length > 0) {
      return report.verdictLine
    }
    const band = getScoreBandStatus(Math.round(report.overallScore / 10))
    if (band === 'strong') return dict.verdictStrong
    if (band === 'warning') return dict.verdictWarning
    return dict.verdictWeak
  }, [report.verdictLine, report.overallScore, dict])

  const funnelStages = useMemo(() => {
    const findStatus = (keys: AuditProfileCheckKey[]): AuditCheckStatus => {
      const matches = report.profileChecks.filter((c) => keys.includes(c.key))
      if (matches.some((m) => m.status === 'MISSING')) return 'MISSING'
      if (matches.some((m) => m.status === 'WEAK')) return 'WEAK'
      return 'OK'
    }
    return [
      {
        id: 'profile',
        keys: ['nameKeyword', 'pinnedPosts', 'highlights'] as AuditProfileCheckKey[],
        titleAr: '١. البروفايل والتموضع',
        titleEn: '1. Profile & Positioning',
        descAr: 'حقل الاسم + المنشورات المثبتة + الأقسام التعريفية',
        descEn: 'Searchable Name + Pinned Reels + Highlights',
        status: findStatus(['nameKeyword', 'pinnedPosts', 'highlights']),
      },
      {
        id: 'bio',
        keys: ['bioPromise', 'singleCta', 'socialProofVisible'] as AuditProfileCheckKey[],
        titleAr: '٢. وعد البايو ووضوح التخصص',
        titleEn: '2. Bio Promise & Single CTA',
        descAr: 'الوعد المباشر + الإثبات الاجتماعي + التوجيه',
        descEn: 'Outcome Promise + Social Proof + Clear CTA',
        status: findStatus(['bioPromise', 'singleCta', 'socialProofVisible']),
      },
      {
        id: 'link',
        keys: ['linkSpeed', 'leadMagnetOrDmKeyword'] as AuditProfileCheckKey[],
        titleAr: '٣. نقطة العبور واستقطاب المهتمين',
        titleEn: '3. Link-in-Bio / DM Capture',
        descAr: 'سرعة الرابط + عدم التشتيت + الكلمة المفتاحية',
        descEn: 'Frictionless Link + DM Keyword Capture',
        status: findStatus(['linkSpeed', 'leadMagnetOrDmKeyword']),
      },
      {
        id: 'offer',
        keys: ['offerClarity', 'contactButton'] as AuditProfileCheckKey[],
        titleAr: '٤. العرض الأساسي وحجز المكالمة',
        titleEn: '4. High-Ticket Offer & Booking',
        descAr: 'وضوح العرض الأساسي + خطوة حجز مباشرة',
        descEn: 'Offer Clarity + Direct Calendar / WhatsApp',
        status: findStatus(['offerClarity', 'contactButton']),
      },
    ]
  }, [report.profileChecks])

  const activeStage =
    funnelStages.find((s) => s.id === selectedFunnelStageId) || funnelStages[0]
  const activeStageChecks = report.profileChecks.filter((c) =>
    activeStage.keys.includes(c.key)
  )

  const filteredPillars = useMemo(() => {
    const base =
      pillarFilter === 'weak'
        ? report.categoryScores.filter((c) => c.score < 7)
        : pillarFilter === 'strong'
        ? report.categoryScores.filter((c) => c.score >= 7)
        : report.categoryScores
    return base.length > 0 ? base : report.categoryScores
  }, [report.categoryScores, pillarFilter])

  const activePillarInFilteredIdx = useMemo(() => {
    const idx = filteredPillars.findIndex((c) => c.categoryKey === selectedPillarKey)
    return idx >= 0 ? idx : 0
  }, [filteredPillars, selectedPillarKey])

  const activePillar =
    filteredPillars[activePillarInFilteredIdx] ||
    report.categoryScores[0]

  const activePillarGlobalIdx = useMemo(() => {
    const idx = report.categoryScores.findIndex(
      (c) => c.categoryKey === activePillar?.categoryKey
    )
    return idx >= 0 ? idx : 0
  }, [report.categoryScores, activePillar])

  const handleStepPillar = (delta: number) => {
    if (!filteredPillars.length) return
    const nextIdx =
      (activePillarInFilteredIdx + delta + filteredPillars.length) %
      filteredPillars.length
    const nextCat = filteredPillars[nextIdx]
    if (nextCat) {
      setSelectedPillarKey(nextCat.categoryKey)
    }
  }

  const rawReelsComputed = useMemo(
    () => report.metrics.reelsComputed || [],
    [report.metrics.reelsComputed]
  )

  const configuredReelsMode = report.settings?.reelsDisplayMode || 'TOP_5'

  const defaultModeReels = useMemo(() => {
    const byRank = [...rawReelsComputed].sort(
      (a, b) => (a.performanceRank || a.index) - (b.performanceRank || b.index)
    )
    if (configuredReelsMode === 'TOP_3') {
      return byRank.slice(0, 3)
    }
    if (configuredReelsMode === 'TOP_4') {
      return byRank.slice(0, 4)
    }
    if (configuredReelsMode === 'TOP_5') {
      return byRank.slice(0, 5)
    }
    if (configuredReelsMode === 'LAST_10') {
      return rawReelsComputed.slice(-10)
    }
    return byRank
  }, [rawReelsComputed, configuredReelsMode])

  const allReelsForInspector = useMemo(() => {
    if (reelTierFilter === 'ALL') {
      return defaultModeReels
    }
    if (reelTierFilter === 'VIRAL') {
      const viral = rawReelsComputed
        .filter((r) => r.performanceTier === 'VIRAL')
        .sort((a, b) => (a.performanceRank || a.index) - (b.performanceRank || b.index))
      return viral.length > 0
        ? viral
        : [...rawReelsComputed]
            .sort((a, b) => (a.performanceRank || a.index) - (b.performanceRank || b.index))
            .slice(0, 3)
    }
    if (reelTierFilter === 'ABOVE_AVERAGE') {
      const above = rawReelsComputed
        .filter(
          (r) => r.performanceTier === 'VIRAL' || r.performanceTier === 'ABOVE_AVERAGE'
        )
        .sort((a, b) => (a.performanceRank || a.index) - (b.performanceRank || b.index))
      return above.length > 0 ? above : defaultModeReels
    }
    if (reelTierFilter === 'UNDERPERFORMING') {
      const under = rawReelsComputed.filter(
        (r) => r.performanceTier === 'UNDERPERFORMING' || r.performanceTier === 'AVERAGE'
      )
      return under.length > 0 ? under : defaultModeReels
    }
    return defaultModeReels
  }, [rawReelsComputed, defaultModeReels, reelTierFilter])

  const activeHookReel =
    allReelsForInspector[selectedHookReelIdx] || allReelsForInspector[0]

  const handleInsightsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingFiles(true)
    setUploadError(null)
    try {
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        formData.append('token', report.shareToken)
        formData.append('sessionId', sessionIdRef.current)
        formData.append('mode', 'client')
        const res = await fetch('/api/audit/upload', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Upload failed')
        }
      }
      setUploadSuccessMsg(true)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingFiles(false)
    }
  }

  const primaryCtaConfig = useMemo(() => {
    const s = report.settings
    const cleanWa = (s?.whatsappNumber || '+966500000000').replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(
      locale === 'ar'
        ? s?.whatsappMessageAr ||
            'مرحباً فريق APX، اطلعت على تقرير تشخيص حسابي وأود حجز جلسة استراتيجية.'
        : s?.whatsappMessageEn ||
            'Hi APX team, I reviewed my audit report and would like to book a strategy session.'
    )
    const waHref = `https://wa.me/${cleanWa}?text=${msg}`
    const bookHref = s?.bookingUrl || 'https://calendly.com/zyaddonga/30min'
    const dmHref = `https://instagram.com/${(s?.instagramHandle || 'zyadcreative').replace(
      /^@/,
      ''
    )}`

    if (s?.acceptingClients === false) {
      const waitMsg = encodeURIComponent(
        locale === 'ar'
          ? 'مرحباً فريق APX، اطلعت على تقرير حسابي وأود الانضمام لقائمة الانتظار للدفعة القادمة.'
          : 'Hi APX team, I reviewed my audit report and would like to join the priority waitlist.'
      )
      return {
        primaryHref: `https://wa.me/${cleanWa}?text=${waitMsg}`,
        primaryLabel:
          locale === 'ar'
            ? 'سجّل في قائمة الانتظار للدفعة القادمة (Waitlist)'
            : 'Join the Priority Waitlist for Next Cohort',
        secondaryHref: bookHref,
        secondaryLabel:
          locale === 'ar'
            ? 'أو استفسر عبر واتساب السريع'
            : 'Or Inquire via WhatsApp',
      }
    }
    if (s?.ctaType === 'WHATSAPP') {
      return {
        primaryHref: waHref,
        primaryLabel:
          locale === 'ar'
            ? 'تواصل عبر واتساب لمناقشة خطة الـ 90 يوماً'
            : 'Message APX on WhatsApp to Discuss Your 90-Day Plan',
        secondaryHref: bookHref,
        secondaryLabel:
          locale === 'ar'
            ? 'أو احجز مكالمة مباشرة في التقويم'
            : 'Or Book Directly on Calendar',
      }
    }
    if (s?.ctaType === 'DM_KEYWORD') {
      return {
        primaryHref: dmHref,
        primaryLabel:
          locale === 'ar'
            ? `أرسل كلمة "${s.dmKeyword || 'AUDIT'}" في رسائل إنستغرام @${
                s.instagramHandle || 'zyadcreative'
              }`
            : `DM "${s.dmKeyword || 'AUDIT'}" on Instagram @${
                s.instagramHandle || 'zyadcreative'
              }`,
        secondaryHref: bookHref,
        secondaryLabel:
          locale === 'ar'
            ? 'أو احجز مكالمة تشخيصية مباشرة'
            : 'Or Book a Strategy Call Directly',
      }
    }
    return {
      primaryHref: bookHref,
      primaryLabel:
        locale === 'ar'
          ? 'احجز مكالمة استراتيجية لتطبيق الـ System الخاص بـ APX (30 دقيقة)'
          : 'Book Your 30-Minute APX Strategy Call',
      secondaryHref: waHref,
      secondaryLabel: locale === 'ar' ? 'تواصل عبر واتساب السريع' : 'Chat on WhatsApp',
    }
  }, [report.settings, locale])

  const handleCtaClick = (ctaLabel: string) => {
    const elapsedSec = Math.round((Date.now() - sessionStartRef.current) / 1000)
    sendBeaconEvent(
      report.shareToken,
      sessionIdRef.current,
      'CTA_CLICK',
      { ctaLabel, elapsedSec },
      isPreviewMode
    )
  }

  const m = report.metrics

  const navItems = [
    { id: 'overview', href: '#sec-overview', label: dict.nav.overview },
    { id: 'reels', href: '#sec-reels', label: dict.nav.reels },
    { id: 'scorecard', href: '#sec-scorecard', label: dict.nav.scorecard },
    { id: 'problems', href: '#sec-problems', label: dict.nav.problems },
    { id: 'competitors', href: '#sec-competitors', label: dict.nav.competitors },
    { id: 'funnel', href: '#sec-funnel', label: dict.nav.funnel },
    { id: 'cta', href: '#sec-cta', label: dict.nav.cta },
  ]

  const statusTextForCheck = (st: AuditCheckStatus) => {
    if (locale === 'ar') {
      return st === 'OK' ? 'ممتاز' : st === 'WEAK' ? 'ضعيف' : 'مفقود'
    }
    return st === 'OK' ? 'Strong' : st === 'WEAK' ? 'Weak' : 'Missing'
  }

  return (
    <div
      dir={dir}
      lang={locale}
      className={`apx-audit min-h-screen bg-[#080608] text-[#E2D9F3] selection:bg-[#8B5CF6]/30 selection:text-white relative overflow-x-hidden ${
        themeMode === 'light' ? 'apx-audit-light' : ''
      }`}
    >
      {/* Top Scroll Progress Bar */}
      <motion.div
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-[#4C1D95] via-[#8B5CF6] to-[#A78BFA] origin-left z-50 no-print"
      />

      {/* Calm Ambient Radial Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none no-print"
      >
        <div
          className="absolute -top-36 start-1/2 -translate-x-1/2 w-[560px] h-[340px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(76,29,149,0.2) 50%, transparent 75%)',
          }}
        />
      </div>

      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#080608]/90 border-b border-[#8B5CF6]/20 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <a
              href="/"
              title={locale === 'ar' ? 'الصفحة الرئيسية — APX' : 'APX Homepage'}
              className="inline-flex items-center hover:scale-105 transition-transform"
            >
              <ApxMark size={26} />
            </a>
            {isDemo && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D49A3D]/20 text-[#FBBF24] border border-[#D49A3D]/40">
                {locale === 'ar' ? 'نموذج استعراضي' : 'DEMO'}
              </span>
            )}
          </div>

          {/* Animated Active Section Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-[#110B1B] p-1 rounded-xl border border-[#8B5CF6]/20 text-xs">
            {navItems.map((item) => {
              const isActive = activeSection === item.id
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`relative px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    isActive ? 'text-white' : 'text-[#E2D9F3]/65 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="reportActiveNavPill"
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      className="absolute inset-0 rounded-lg bg-[#8B5CF6] -z-10 shadow-sm shadow-[#8B5CF6]/40"
                    />
                  )}
                  {item.label}
                </a>
              )
            })}
          </nav>

          {/* Controls: Light/Dark Theme toggle, Digits toggle, Language toggle, Print PDF */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleThemeMode}
              className="p-2 rounded-xl bg-[#110B1B] hover:bg-[#1A0F2E] border border-[#8B5CF6]/30 text-[#A78BFA] hover:text-white transition-colors"
              title={
                themeMode === 'dark'
                  ? locale === 'ar'
                    ? 'تفعيل الوضع الفاتح (Light Mode)'
                    : 'Switch to Light Mode'
                  : locale === 'ar'
                  ? 'تفعيل الوضع الداكن (Dark Mode)'
                  : 'Switch to Dark Mode'
              }
            >
              {themeMode === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#8B5CF6]" />
              )}
            </button>
            <button
              type="button"
              onClick={handleToggleDigits}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#110B1B] hover:bg-[#1A0F2E] border border-[#8B5CF6]/25 text-[#E2D9F3]/85 transition-colors"
              title="Toggle numerals"
            >
              {digits === 'western' ? '١٢٣' : '123'}
            </button>
            <button
              type="button"
              onClick={handleToggleLocale}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#110B1B] hover:bg-[#1A0F2E] border border-[#8B5CF6]/30 text-white transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            {!isPreviewMode && (
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#110B1B] hover:bg-[#1A0F2E] border border-[#8B5CF6]/25 text-[#E2D9F3]/80 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>PDF</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
        {/* ================================================================
            SECTION 1: EXECUTIVE BENTO GRID HERO
           ================================================================ */}
        <motion.section
          id="sec-overview"
          data-audit-section="overview"
          {...sectionMotion}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
        >
          {/* Main Prospect Identity Card (8 cols) */}
          <div className="lg:col-span-8 apx-glass rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-white">
                  {dict.badge}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {report.prospect.avatarUrl && (
                  <img
                    src={report.prospect.avatarUrl}
                    alt={report.prospect.displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-[#8B5CF6]/60 shadow-lg shadow-[#8B5CF6]/20 bg-[#080608] shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#A78BFA] mb-1">
                    {dict.preparedFor}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                    {report.prospect.displayName}
                  </h1>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#E2D9F3]/80">
                    <a
                      href={
                        report.prospect.profileUrl ||
                        `https://instagram.com/${report.prospect.handle}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1A0F2E] border border-[#8B5CF6]/30 text-[#A78BFA] hover:text-white font-en font-semibold transition-colors"
                      dir="ltr"
                    >
                      @{report.prospect.handle}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <span className="px-2.5 py-1 rounded-lg bg-[#110B1B] border border-[#8B5CF6]/15">
                      {report.prospect.niche}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#110B1B] border border-[#8B5CF6]/15">
                      <strong className="text-white font-en">
                        <AnimatedCountNumber
                          value={report.prospect.followers}
                          formatFn={(v) => formatAuditNumber(Math.round(v), { digits, compact: true })}
                        />
                      </strong>{' '}
                      {dict.sections.followers}
                    </span>
                    {report.prospect.followingCount !== null &&
                      report.prospect.followingCount !== undefined && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#110B1B] border border-[#8B5CF6]/15">
                          <strong className="text-white font-en">
                            <AnimatedCountNumber
                              value={report.prospect.followingCount}
                              formatFn={(v) => formatAuditNumber(Math.round(v), { digits })}
                            />
                          </strong>{' '}
                          {dict.sections.profileFollowing}
                        </span>
                      )}
                    {report.prospect.postsCount !== null &&
                      report.prospect.postsCount !== undefined && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#110B1B] border border-[#8B5CF6]/15">
                          <strong className="text-white font-en">
                            <AnimatedCountNumber
                              value={report.prospect.postsCount}
                              formatFn={(v) => formatAuditNumber(Math.round(v), { digits })}
                            />
                          </strong>{' '}
                          {dict.sections.profilePosts}
                        </span>
                      )}
                  </div>
                </div>
              </div>

              {/* Bio & Bio Links Snapshot */}
              {(report.prospect.bio ||
                report.prospect.linkInBioUrl ||
                (report.prospect.bioLinks && report.prospect.bioLinks.length > 0)) && (
                <div className="p-3.5 rounded-2xl bg-[#110B1B]/90 border border-[#8B5CF6]/20 space-y-2 text-xs sm:text-sm">
                  {report.prospect.bio && (
                    <div>
                      <span className="text-[11px] font-bold text-[#E2D9F3]/60 block mb-0.5">
                        {dict.sections.profileBioLabel}
                      </span>
                      <div className="apx-scroll-box">
                        <p className="text-[#E2D9F3]/90 whitespace-pre-line leading-relaxed">
                          {report.prospect.bio}
                        </p>
                      </div>
                    </div>
                  )}
                  {((report.prospect.bioLinks && report.prospect.bioLinks.length > 0) ||
                    report.prospect.linkInBioUrl) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-[#E2D9F3]/60">
                        {dict.sections.profileLinksLabel}:
                      </span>
                      {report.prospect.bioLinks && report.prospect.bioLinks.length > 0 ? (
                        report.prospect.bioLinks.map((lnk, lIdx) => (
                          <a
                            key={lIdx}
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            dir="ltr"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#080608] border border-[#8B5CF6]/30 text-[#A78BFA] hover:text-white font-en text-xs"
                          >
                            <span>{lnk.title || lnk.url}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ))
                      ) : report.prospect.linkInBioUrl ? (
                        <a
                          href={report.prospect.linkInBioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#080608] border border-[#8B5CF6]/30 text-[#A78BFA] hover:text-white font-en text-xs"
                        >
                          <span>{report.prospect.linkInBioUrl}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Executive Verdict Callout */}
            <div className="p-4 rounded-2xl bg-[#080608]/85 border border-[#8B5CF6]/30">
              <span className="text-xs font-bold text-[#A78BFA] block mb-1">
                {locale === 'ar' ? 'الخلاصة التنفيذية للتشخيص' : 'Executive Diagnostic Verdict'}
              </span>
              <div className="apx-scroll-box">
                <p className="text-sm sm:text-[15px] text-white leading-relaxed font-medium">
                  {formatDigits(verdictText, digits)}
                </p>
              </div>
            </div>
          </div>

          {/* Score Ring & Quick Telemetry Card (4 cols) */}
          <div className="lg:col-span-4 apx-glass apx-prism-card rounded-3xl p-6 flex flex-col items-center justify-between text-center">
            <div className="w-full flex items-center justify-between text-xs text-[#E2D9F3]/70 mb-1">
              <span className="font-bold">{dict.overallScore}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] font-bold">
                9 {locale === 'ar' ? 'محاور' : 'Pillars'}
              </span>
            </div>

            <div className="my-2">
              <AnimatedScoreRing
                score={report.overallScore}
                digits={digits}
                outOfLabel={dict.outOf100}
              />
            </div>

            <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-[#8B5CF6]/15 text-xs">
              <div className="p-2.5 rounded-xl bg-[#080608]/75 border border-[#8B5CF6]/15">
                <span className="text-[#E2D9F3]/60 block">
                  {dict.sections.medianViewsShort}
                </span>
                <strong className="apx-serif-numeral text-base font-bold text-white">
                  <AnimatedCountNumber
                    value={m.medianViews.value}
                    formatFn={(v) => formatAuditNumber(Math.round(v), { digits })}
                  />
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080608]/75 border border-[#8B5CF6]/15">
                <span className="text-[#E2D9F3]/60 block">
                  {dict.sections.efficiencyShort}
                </span>
                <strong className="apx-serif-numeral text-base font-bold text-[#A78BFA]">
                  <AnimatedCountNumber
                    value={m.reachEfficiency.value.percent}
                    formatFn={(v) => `${formatDigits(Number(v.toFixed(1)), digits)}%`}
                  />
                </strong>
              </div>
            </div>
          </div>

          {/* Full-width Natural Liquid Glass "What's Already Working" Card (12 cols) */}
          <div className="lg:col-span-12 p-5 sm:p-6 rounded-3xl apx-liquid-glass apx-prism-card flex flex-col sm:flex-row items-start gap-4">
            <span className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/45 flex items-center justify-center text-[#A78BFA] shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.28)]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {dict.sections.workingTitle}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 text-[#A78BFA]">
                  {locale === 'ar' ? 'نقاط القوة الحالية' : 'Current Foundation'}
                </span>
              </div>
              <div className="apx-scroll-box">
                <p className="text-sm sm:text-[15px] text-[#E2D9F3]/90 leading-relaxed">
                  {formatDigits(report.summaryOpening, digits)}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION 2: REELS TELEMETRY BENTO GRID
           ================================================================ */}
        <motion.section
          id="sec-reels"
          data-audit-section="reels"
          {...sectionMotion}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 font-en font-bold text-xs text-[#A78BFA]">
              01
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {dict.sections.reelsTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#E2D9F3]/65">
                {dict.sections.reelsSubtitle}
              </p>
            </div>
          </div>

          <div className="apx-glass rounded-3xl p-5 sm:p-6">
            <ReelsMedianBarChart
              reels={m.reelsComputed}
              medianViews={m.medianViews.value}
              locale={locale}
              digits={digits}
              selectedIndex={selectedHookReelIdx}
              onSelectIndex={(idx) => {
                setReelTierFilter('ALL')
                setSelectedHookReelIdx(idx)
              }}
            />
          </div>

          {/* Comprehensive Account Reels Engagement & Performance Tier Matrix */}
          <div className="apx-liquid-glass apx-prism-card rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5CF6]/20 pb-3.5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {locale === 'ar'
                    ? `تحليل وتصنيف شامل لجميع ريلز الحساب (${formatDigits(m.reelCount, digits)} فيديو)`
                    : `Full Account Reels Telemetry & Classification (${m.reelCount} Reels)`}
                </h3>
                <p className="text-xs text-[#E2D9F3]/65 mt-0.5">
                  {locale === 'ar'
                    ? 'إجمالي ومتوسط المشاهدات، الإعجابات، التعليقات، المشاركات (Shares)، الحفظ (Saves)، إعادة النشر (Reposts)، وتصنيف انتشار الفيديوهات.'
                    : 'Total and average Views, Likes, Comments, Shares, Saves, Reposts, and viral tier classification across all analyzed Reels.'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#8B5CF6]/20 border border-[#8B5CF6]/45 text-[#C4B5FD]">
                {locale === 'ar'
                  ? `التفاعل الشامل: ${formatDigits(m.accountTotals.overallEngagementPct, digits)}%`
                  : `Overall Engagement: ${m.accountTotals.overallEngagementPct}%`}
              </span>
            </div>

            {/* 6 Full-Account Telemetry Aggregates (Views, Likes, Comments, Shares, Saves, Reposts) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                <span className="text-[11px] text-[#E2D9F3]/65 block">
                  {locale === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                </span>
                <strong className="apx-serif-numeral text-lg sm:text-xl font-bold text-white block mt-0.5">
                  {formatAuditNumber(m.accountTotals.totalViews, { digits, compact: true })}
                </strong>
                <span className="text-[10px] text-[#A78BFA] font-en">
                  {locale === 'ar' ? 'المتوسط: ' : 'Avg: '}
                  {formatAuditNumber(m.accountTotals.averageViews, { digits, compact: true })}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                <span className="text-[11px] text-[#E2D9F3]/65 block">
                  {locale === 'ar' ? 'إجمالي الإعجابات (Likes)' : 'Total Likes'}
                </span>
                <strong className="apx-serif-numeral text-lg sm:text-xl font-bold text-white block mt-0.5">
                  {formatAuditNumber(m.accountTotals.totalLikes, { digits, compact: true })}
                </strong>
                <span className="text-[10px] text-[#A78BFA] font-en">
                  {locale === 'ar' ? 'المتوسط: ' : 'Avg: '}
                  {formatAuditNumber(m.accountTotals.averageLikes, { digits, compact: true })}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                <span className="text-[11px] text-[#E2D9F3]/65 block">
                  {locale === 'ar' ? 'إجمالي التعليقات (Comments)' : 'Total Comments'}
                </span>
                <strong className="apx-serif-numeral text-lg sm:text-xl font-bold text-white block mt-0.5">
                  {formatAuditNumber(m.accountTotals.totalComments, { digits, compact: true })}
                </strong>
                <span className="text-[10px] text-[#A78BFA] font-en">
                  {locale === 'ar' ? 'المتوسط: ' : 'Avg: '}
                  {formatAuditNumber(m.accountTotals.averageComments, { digits, compact: true })}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                <span className="text-[11px] text-[#E2D9F3]/65 block">
                  {locale === 'ar' ? 'المشاركات (Shares)' : 'Total Shares'}
                </span>
                <strong className="apx-serif-numeral text-lg sm:text-xl font-bold text-white block mt-0.5">
                  {formatAuditNumber(m.accountTotals.totalShares, { digits, compact: true })}
                </strong>
                <span className="text-[10px] text-[#A78BFA] font-en">
                  {locale === 'ar' ? 'المتوسط: ' : 'Avg: '}
                  {formatAuditNumber(m.accountTotals.averageShares, { digits, compact: true })}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                <span className="text-[11px] text-[#E2D9F3]/65 block">
                  {locale === 'ar' ? 'عمليات الحفظ (Saves)' : 'Total Saves'}
                </span>
                <strong className="apx-serif-numeral text-lg sm:text-xl font-bold text-white block mt-0.5">
                  {formatAuditNumber(m.accountTotals.totalSaves, { digits, compact: true })}
                </strong>
                <span className="text-[10px] text-[#A78BFA] font-en">
                  {locale === 'ar' ? 'المتوسط: ' : 'Avg: '}
                  {formatAuditNumber(m.accountTotals.averageSaves, { digits, compact: true })}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0D0816]/90 border border-[#8B5CF6]/25">
                <span className="text-[11px] text-[#E2D9F3]/65 block">
                  {locale === 'ar' ? 'إعادة النشر (Reposts)' : 'Total Reposts'}
                </span>
                <strong className="apx-serif-numeral text-lg sm:text-xl font-bold text-white block mt-0.5">
                  {formatAuditNumber(m.accountTotals.totalReposts, { digits, compact: true })}
                </strong>
                <span className="text-[10px] text-[#A78BFA] font-en">
                  {locale === 'ar' ? 'إجمالي التفاعلات: ' : 'Interactions: '}
                  {formatAuditNumber(m.accountTotals.totalInteractions, {
                    digits,
                    compact: true,
                  })}
                </span>
              </div>
            </div>

            {/* 4-Tier Reels Performance Classification Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                {
                  tier: 'VIRAL' as const,
                  titleAr: 'الأكثر انتشاراً (طفرة ≥1.6x)',
                  titleEn: 'Viral / Outperforming (≥1.6x)',
                  count: m.accountTotals.viralCount,
                  badgeClass:
                    'bg-[#10B981]/15 border-[#10B981]/40 text-[#34D399]',
                  reels: m.reelsComputed.filter((r) => r.performanceTier === 'VIRAL'),
                },
                {
                  tier: 'ABOVE_AVERAGE' as const,
                  titleAr: 'فوق المتوسط (1.05x – 1.59x)',
                  titleEn: 'Above Average (1.05x – 1.59x)',
                  count: m.accountTotals.aboveAverageCount,
                  badgeClass:
                    'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#C4B5FD]',
                  reels: m.reelsComputed.filter((r) => r.performanceTier === 'ABOVE_AVERAGE'),
                },
                {
                  tier: 'AVERAGE' as const,
                  titleAr: 'ضمن المعدل الطبيعي (0.80x – 1.04x)',
                  titleEn: 'Average Baseline (0.80x – 1.04x)',
                  count: m.accountTotals.averageCount,
                  badgeClass:
                    'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#FBBF24]',
                  reels: m.reelsComputed.filter((r) => r.performanceTier === 'AVERAGE'),
                },
                {
                  tier: 'UNDERPERFORMING' as const,
                  titleAr: 'أقل من المتوسط (<0.80x)',
                  titleEn: 'Underperforming (<0.80x)',
                  count: m.accountTotals.underperformingCount,
                  badgeClass:
                    'bg-[#F43F5E]/15 border-[#F43F5E]/40 text-[#FDA4AF]',
                  reels: m.reelsComputed.filter(
                    (r) => r.performanceTier === 'UNDERPERFORMING'
                  ),
                },
              ].map((group) => (
                <div
                  key={group.tier}
                  className="p-3.5 rounded-2xl bg-[#0E0818]/90 border border-[#8B5CF6]/20 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">
                      {locale === 'ar' ? group.titleAr : group.titleEn}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg font-en font-bold border ${group.badgeClass}`}
                    >
                      {formatDigits(group.count, digits)}
                    </span>
                  </div>

                  {group.reels.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {group.reels.map((r) => (
                        <button
                          key={r.index}
                          type="button"
                          onClick={() => {
                            setReelTierFilter('ALL')
                            setSelectedHookReelIdx(r.index - 1)
                            document
                              .getElementById('sec-hooks')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }}
                          className="px-2 py-1 rounded-lg bg-[#1A0F2E] hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/35 text-[11px] font-en font-bold text-white transition-all"
                          title={`${formatAuditNumber(r.views, { digits })} views`}
                        >
                          #{String(r.index).padStart(2, '0')} (
                          {formatAuditNumber(r.views, { digits, compact: true })})
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#E2D9F3]/45">
                      {locale === 'ar' ? 'لا توجد فيديوهات في هذه الفئة' : 'No Reels in this tier'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6 Bento KPI Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              {
                key: 'medianViews',
                label: dict.sections.medianViews,
                displayNode: (
                  <AnimatedCountNumber
                    value={m.medianViews.value}
                    formatFn={(v) => formatAuditNumber(Math.round(v), { digits })}
                  />
                ),
                sub: locale === 'ar' ? 'مشاهدة لكل فيديو كمتوسط فعلي' : 'average views per Reel',
                explanation: m.medianViews.explanation[locale],
              },
              {
                key: 'reachEfficiency',
                label: dict.sections.reachEfficiency,
                displayNode: (
                  <AnimatedCountNumber
                    value={m.reachEfficiency.value.percent}
                    formatFn={(v) => `${formatDigits(Number(v.toFixed(1)), digits)}%`}
                  />
                ),
                sub:
                  locale === 'ar'
                    ? 'من المتابعين يصلهم الفيديو'
                    : 'of followers reached per Reel',
                explanation: m.reachEfficiency.explanation[locale],
              },
              {
                key: 'outlierRatio',
                label: dict.sections.outlierRatio,
                displayNode: (
                  <AnimatedCountNumber
                    value={m.outlierRatio.value}
                    formatFn={(v) => `${formatDigits(Number(v.toFixed(1)), digits)}x`}
                  />
                ),
                sub:
                  m.outlierRatio.value > 3.5
                    ? locale === 'ar'
                      ? 'تذبذب عالٍ واعتماد على الطفرات'
                      : 'High volatility (spike dependency)'
                    : locale === 'ar'
                    ? 'إيقاع مشاهدات متوازن'
                    : 'Consistent view distribution',
                explanation: m.outlierRatio.explanation[locale],
              },
              {
                key: 'engagementRate',
                label: dict.sections.engagementRate,
                displayNode: (
                  <AnimatedCountNumber
                    value={m.engagementRateOnViews.value.medianPct}
                    formatFn={(v) => `${formatDigits(Number(v.toFixed(1)), digits)}%`}
                  />
                ),
                sub:
                  locale === 'ar'
                    ? 'الإعجابات والتعليقات إلى المشاهدات'
                    : 'Likes & comments divided by views',
                explanation: m.engagementRateOnViews.explanation[locale],
              },
              {
                key: 'postingConsistency',
                label: dict.sections.postingConsistency,
                displayNode: (
                  <AnimatedCountNumber
                    value={m.postingConsistency.value.postsPerMonth}
                    formatFn={(v) =>
                      `${formatDigits(Number(v.toFixed(1)), digits)}/${
                        locale === 'ar' ? 'شهر' : 'mo'
                      }`
                    }
                  />
                ),
                sub:
                  locale === 'ar'
                    ? `أطول انقطاع: ${formatDigits(
                        m.postingConsistency.value.longestGapDays,
                        digits
                      )} يوم`
                    : `Longest gap: ${m.postingConsistency.value.longestGapDays} days`,
                explanation: m.postingConsistency.explanation[locale],
              },
              {
                key: 'demandSignals',
                label: dict.sections.demandSignals,
                displayNode: (
                  <AnimatedCountNumber
                    value={m.commentDemandSignals.value.totalSignals}
                    formatFn={(v) => formatDigits(Math.round(v), digits)}
                  />
                ),
                sub:
                  locale === 'ar'
                    ? `تعليق شرائي في ${formatDigits(
                        m.commentDemandSignals.value.reelsWithSignals,
                        digits
                      )} فيديوهات`
                    : `buyer comments across ${m.commentDemandSignals.value.reelsWithSignals} Reels`,
                explanation: m.commentDemandSignals.explanation[locale],
              },
            ].map((stat) => {
              const isOpen = Boolean(expandedCalc[stat.key])
              return (
                <motion.div
                  key={stat.key}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="apx-bento-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-[#E2D9F3]/75 block">
                      {stat.label}
                    </span>
                    <div className="mt-1.5 apx-serif-numeral text-2xl sm:text-3xl font-bold text-white">
                      {stat.displayNode}
                    </div>
                    <p className="mt-1 text-xs text-[#E2D9F3]/60">{stat.sub}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#8B5CF6]/15">
                    <button
                      type="button"
                      onClick={() => toggleCalc(stat.key)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA] hover:text-white transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{isOpen ? dict.hideCalculation : dict.howCalculated}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2 text-xs text-[#E2D9F3]/85 leading-relaxed bg-[#080608]/85 p-3 rounded-xl border border-[#8B5CF6]/20">
                            {formatDigits(stat.explanation, digits)}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Opportunity Estimator Liquid Glass Card */}
          <div className="rounded-3xl p-5 sm:p-6 apx-liquid-glass apx-prism-card">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#A78BFA]" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {dict.sections.opportunityTitle}
                </h3>
              </div>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/45">
                {dict.estimateTag}
              </span>
            </div>

            <div className="apx-scroll-box">
              <p className="text-sm text-[#E2D9F3]/90 leading-relaxed">
                {formatDigits(m.opportunityEstimator.explanation[locale], digits)}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 border-t border-[#8B5CF6]/20">
              <div className="p-3 rounded-xl bg-[#080608]/80 border border-[#8B5CF6]/20">
                <span className="text-xs text-[#E2D9F3]/65 block">
                  {locale === 'ar' ? 'متوسطك الحالي' : 'Current Average'}
                </span>
                <strong className="apx-serif-numeral text-xl font-bold text-white mt-0.5 block">
                  <AnimatedCountNumber
                    value={m.opportunityEstimator.value.currentMedianViews}
                    formatFn={(v) => formatAuditNumber(Math.round(v), { digits })}
                  />
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#080608]/80 border border-[#8B5CF6]/20">
                <span className="text-xs text-[#E2D9F3]/65 block">
                  {locale === 'ar' ? 'الربع الأعلى لفيديوهاتك' : 'Your Own Top-Quartile'}
                </span>
                <strong className="apx-serif-numeral text-xl font-bold text-[#A78BFA] mt-0.5 block">
                  <AnimatedCountNumber
                    value={m.opportunityEstimator.value.topQuartileViews}
                    formatFn={(v) => formatAuditNumber(Math.round(v), { digits })}
                  />
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40">
                <span className="text-xs text-[#E2D9F3]/85 block">
                  {locale === 'ar'
                    ? 'مشاهدات إضافية شهرياً (12 فيديو) — تقديري'
                    : 'Est. Extra Views / Month (at 12 Reels)'}
                </span>
                <strong className="apx-serif-numeral text-xl font-bold text-white mt-0.5 block">
                  +
                  <AnimatedCountNumber
                    value={m.opportunityEstimator.value.extraViewsPerMonthAt12Posts}
                    formatFn={(v) => formatAuditNumber(Math.round(v), { digits })}
                  />
                </strong>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION 3: INTERACTIVE 9-PILLAR SINGLE-CARD SLIDER & DYNAMIC GEOMETRIC RADAR
           ================================================================ */}
        <motion.section
          id="sec-scorecard"
          data-audit-section="scorecard"
          {...sectionMotion}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 font-en font-bold text-xs text-[#A78BFA]">
                02
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {dict.sections.scorecardTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#E2D9F3]/65">
                  {dict.sections.scorecardSubtitle}
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-[#110B1B] p-1 rounded-xl border border-[#8B5CF6]/20 text-xs">
              {[
                { id: 'all', label: locale === 'ar' ? 'كل المحاور (9)' : 'All Pillars (9)' },
                { id: 'weak', label: locale === 'ar' ? 'نقاط تحتاج تطوير' : 'Needs Work' },
                { id: 'strong', label: locale === 'ar' ? 'نقاط القوة' : 'Strengths' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPillarFilter(f.id as typeof pillarFilter)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    pillarFilter === f.id
                      ? 'bg-[#8B5CF6] text-white'
                      : 'text-[#E2D9F3]/65 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Dynamic Interactive Geometric Radar Chart Card (5 cols) */}
            <div className="lg:col-span-5 apx-liquid-glass apx-prism-card rounded-3xl p-5 flex flex-col items-center justify-between">
              <ScorecardRadarChart
                categories={report.categoryScores}
                locale={locale}
                digits={digits}
                selectedIndex={activePillarGlobalIdx}
                onSelectIndex={(idx) => {
                  const chosen = report.categoryScores[idx]
                  if (chosen) {
                    setPillarFilter('all')
                    setSelectedPillarKey(chosen.categoryKey)
                  }
                }}
              />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[#E2D9F3]/75">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4BA37A]" />
                  {dict.statusStrong} (7–10)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D49A3D]" />
                  {dict.statusWarning} (4–6)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C95D63]" />
                  {dict.statusWeak} (0–3)
                </span>
              </div>
            </div>

            {/* Single-Card Interactive Slider / Carousel (7 cols — shows 1 card at a time!) */}
            <div className="lg:col-span-7 apx-liquid-glass apx-prism-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4">
              {/* Top Slider Navigation Bar: Pill Tabs + Prev/Next Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#A78BFA]">
                    {locale === 'ar'
                      ? `استعراض المحور ${formatDigits(
                          activePillarInFilteredIdx + 1,
                          digits
                        )} من ${formatDigits(filteredPillars.length, digits)}`
                      : `Pillar Slide ${activePillarInFilteredIdx + 1} of ${
                          filteredPillars.length
                        }`}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepPillar(-1)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#080608]/90 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/35 text-xs font-bold text-white transition-all"
                    >
                      {locale === 'ar' ? (
                        <ChevronRight className="w-4 h-4 text-[#A78BFA]" />
                      ) : (
                        <ChevronLeft className="w-4 h-4 text-[#A78BFA]" />
                      )}
                      <span>{locale === 'ar' ? 'السابق' : 'Prev'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStepPillar(1)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white shadow-md shadow-[#8B5CF6]/30 transition-all"
                    >
                      <span>{locale === 'ar' ? 'التالي' : 'Next'}</span>
                      {locale === 'ar' ? (
                        <ChevronLeft className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrollable Pill Strip to jump directly to any Pillar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
                  {filteredPillars.map((cat, idx) => {
                    const isSelected = activePillar?.categoryKey === cat.categoryKey
                    const band = getScoreBandStatus(cat.score)
                    const dotColor =
                      band === 'strong'
                        ? 'bg-[#4BA37A]'
                        : band === 'warning'
                        ? 'bg-[#D49A3D]'
                        : 'bg-[#C95D63]'
                    return (
                      <button
                        key={cat.categoryKey}
                        type="button"
                        onClick={() => setSelectedPillarKey(cat.categoryKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border shrink-0 ${
                          isSelected
                            ? 'bg-[#8B5CF6] text-white border-[#A78BFA] shadow-md shadow-[#8B5CF6]/30'
                            : 'bg-[#080608]/80 text-[#E2D9F3]/70 border-[#8B5CF6]/20 hover:border-[#8B5CF6]/45 hover:text-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span>
                          {formatDigits(idx + 1, digits)}.{' '}
                          {(dict.categories[cat.categoryKey] || cat.categoryKey)
                            .split('(')[0]
                            .trim()}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Single Active Pillar Slide Card */}
              {activePillar && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePillar.categoryKey}
                    initial={{
                      opacity: 0,
                      y: 14,
                      scale: 0.97,
                      filter: 'blur(6px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    exit={{
                      opacity: 0,
                      y: -12,
                      scale: 0.98,
                      filter: 'blur(6px)',
                    }}
                    transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                    className="rounded-2xl p-5 bg-[#110C1D]/95 border border-[#8B5CF6]/25 shadow-[0_8px_28px_rgba(0,0,0,0.35)] space-y-4 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-3 border-b border-[#8B5CF6]/15 pb-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <motion.span
                            key={`badge-${activePillar.categoryKey}`}
                            initial={{ rotate: -12, scale: 0.85 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                            className="apx-serif-numeral w-9 h-9 rounded-xl bg-[#1A122B] border border-[#8B5CF6]/35 flex items-center justify-center text-xs font-bold text-[#C4B5FD]"
                          >
                            0{formatDigits(activePillarGlobalIdx + 1, digits)}
                          </motion.span>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">
                              {dict.categories[activePillar.categoryKey] ||
                                activePillar.categoryKey}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                  getScoreBandStatus(activePillar.score) === 'strong'
                                    ? 'bg-[#5E9E7E]/15 text-[#7BC4A0] border-[#5E9E7E]/30'
                                    : getScoreBandStatus(activePillar.score) === 'warning'
                                      ? 'bg-[#C89D54]/15 text-[#E0B872] border-[#C89D54]/30'
                                      : 'bg-[#B86B77]/15 text-[#D8949E] border-[#B86B77]/30'
                                }`}
                              >
                                {getScoreBandStatus(activePillar.score) === 'strong'
                                  ? dict.statusStrong
                                  : getScoreBandStatus(activePillar.score) === 'warning'
                                    ? dict.statusWarning
                                    : dict.statusWeak}
                              </span>
                              {activePillar.isAutoSuggested && (
                                <span className="text-[11px] text-[#A78BFA]/80">
                                  {dict.sections.autoSuggestedLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="apx-serif-numeral px-3.5 py-1.5 rounded-xl bg-[#1A122B] border border-[#8B5CF6]/35 text-lg font-bold text-white">
                            {formatDigits(activePillar.score, digits)}/10
                          </span>
                        </div>
                      </div>

                      {/* Segmented 10-Block Animated Precision Meter */}
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-10 gap-1.5">
                          {Array.from({ length: 10 }).map((_, segIdx) => {
                            const active = segIdx < activePillar.score
                            const band = getScoreBandStatus(activePillar.score)
                            const fillClass =
                              band === 'strong'
                                ? 'bg-gradient-to-r from-[#4E8C6F] to-[#68AD8D]'
                                : band === 'warning'
                                  ? 'bg-gradient-to-r from-[#B58942] to-[#CFA45D]'
                                  : 'bg-gradient-to-r from-[#A65B67] to-[#C2727E]'
                            return (
                              <motion.div
                                key={segIdx}
                                initial={{ scaleX: 0, opacity: 0.3 }}
                                animate={{
                                  scaleX: 1,
                                  opacity: active ? 1 : 0.2,
                                }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 260,
                                  damping: 22,
                                  delay: segIdx * 0.035,
                                }}
                                className={`h-2 rounded-full origin-left ${
                                  active ? fillClass : 'bg-[#0C0814] border border-[#8B5CF6]/15'
                                }`}
                              />
                            )
                          })}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#E2D9F3]/65">
                          <span>
                            {locale === 'ar'
                              ? `مستوى الأداء الحالي: ${formatDigits(activePillar.score * 10, digits)}%`
                              : `Current Performance: ${activePillar.score * 10}%`}
                          </span>
                          <span className="text-[#C4B5FD] font-bold">
                            {locale === 'ar'
                              ? `فرصة التحسين المباشرة: +${formatDigits(
                                  Math.max(0, (10 - activePillar.score) * 10),
                                  digits
                                )}%`
                              : `Direct Upside Potential: +${Math.max(
                                  0,
                                  (10 - activePillar.score) * 10
                                )}%`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Standard Fixed-Height Scrollable Evidence & Recommendation Boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06, duration: 0.25 }}
                        className="p-4 rounded-xl bg-[#0D0917]/95 border border-[#8B5CF6]/20 flex flex-col"
                      >
                        <span className="text-xs font-bold text-[#C4B5FD]/90 block mb-1.5">
                          {dict.sections.evidenceLabel}
                        </span>
                        <div className="apx-scroll-box h-28">
                          <p className="text-[#E2D9F3]/90 leading-relaxed">
                            {formatDigits(activePillar.evidence || '—', digits)}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.25 }}
                        className="p-4 rounded-xl bg-[#130D21]/95 border border-[#8B5CF6]/28 flex flex-col"
                      >
                        <span className="text-xs font-bold text-[#A78BFA] block mb-1.5">
                          {dict.sections.recommendationLabel}
                        </span>
                        <div className="apx-scroll-box h-28">
                          <p className="text-white/95 leading-relaxed">
                            {formatDigits(activePillar.recommendation || '—', digits)}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Bottom Slider Indicator Dots */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {filteredPillars.map((cat) => {
                  const isSelected = activePillar?.categoryKey === cat.categoryKey
                  return (
                    <button
                      key={cat.categoryKey}
                      type="button"
                      onClick={() => setSelectedPillarKey(cat.categoryKey)}
                      aria-label={cat.categoryKey}
                      className={`h-2 rounded-full transition-all ${
                        isSelected
                          ? 'w-7 bg-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.8)]'
                          : 'w-2 bg-[#E2D9F3]/25 hover:bg-[#E2D9F3]/55'
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION 4: TOP 3 BOTTLENECKS (Single-Card Interactive Slider)
           ================================================================ */}
        <motion.section
          id="sec-problems"
          data-audit-section="problems"
          {...sectionMotion}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 font-en font-bold text-xs text-[#A78BFA]">
                03
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {dict.sections.problemsTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#E2D9F3]/65">
                  {dict.sections.problemsSubtitle}
                </p>
              </div>
            </div>

            {/* Bottleneck Slider Controls */}
            {report.findings.length > 1 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#110B1B] p-1 rounded-xl border border-[#8B5CF6]/25 overflow-x-auto max-w-[260px] sm:max-w-none">
                  {report.findings.map((f, idx) => (
                    <button
                      key={f.rank || idx}
                      type="button"
                      onClick={() => setSelectedProblemIdx(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-en font-bold transition-all shrink-0 ${
                        selectedProblemIdx === idx
                          ? 'bg-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/40'
                          : 'text-[#E2D9F3]/65 hover:text-white'
                      }`}
                    >
                      {formatDigits(
                        String(f.rank || idx + 1).padStart(2, '0'),
                        digits
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedProblemIdx(
                      (prev) =>
                        (prev - 1 + report.findings.length) % report.findings.length
                    )
                  }
                  className="p-2 rounded-xl bg-[#110B1B] hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-white transition-all"
                  title="Previous"
                >
                  {locale === 'ar' ? (
                    <ChevronRight className="w-4 h-4 text-[#A78BFA]" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-[#A78BFA]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProblemIdx(
                      (prev) => (prev + 1) % report.findings.length
                    )
                  }
                  className="p-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30 transition-all"
                  title="Next"
                >
                  {locale === 'ar' ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {(() => {
            const safeProblemIdx = Math.max(
              0,
              Math.min(report.findings.length - 1, selectedProblemIdx)
            )
            const finding = report.findings[safeProblemIdx]
            if (!finding) return null
            return (
              <AnimatePresence mode="wait">
                <motion.div
                  key={finding.rank || safeProblemIdx}
                  initial={{ opacity: 0, x: locale === 'ar' ? -18 : 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: locale === 'ar' ? 18 : -18 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="apx-liquid-glass apx-prism-card rounded-3xl p-5 sm:p-6 print-break-inside-avoid space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="apx-serif-numeral w-10 h-10 rounded-xl bg-[#8B5CF6]/25 border border-[#8B5CF6]/50 flex items-center justify-center text-base font-bold text-white">
                        {formatDigits(
                          String(finding.rank || safeProblemIdx + 1).padStart(2, '0'),
                          digits
                        )}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-[#A78BFA] block">
                          {locale === 'ar'
                            ? `العائق رقم ${formatDigits(
                                safeProblemIdx + 1,
                                digits
                              )} من ${formatDigits(report.findings.length, digits)}`
                            : `Bottleneck ${safeProblemIdx + 1} of ${
                                report.findings.length
                              }`}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {formatDigits(finding.title, digits)}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        finding.severity === 'CRITICAL'
                          ? 'bg-[#B86B77]/15 text-[#D8949E] border-[#B86B77]/35'
                          : 'bg-[#C89D54]/15 text-[#E0B872] border-[#C89D54]/35'
                      }`}
                    >
                      {finding.severity === 'CRITICAL'
                        ? locale === 'ar'
                          ? 'أولوية قصوى'
                          : 'Critical'
                        : locale === 'ar'
                        ? 'تأثير مرتفع'
                        : 'High Impact'}
                    </span>
                  </div>

                  {/* Harmonious Luxury-Toned Diagnostic Cards: Soft Violet (Evidence) | Muted Rosewood (Business Cost) | Muted Sage (APX Fix) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-sm">
                    {/* 1. SOFT VIOLET — Observed Evidence */}
                    <div className="relative overflow-hidden p-4 rounded-2xl bg-[#100B1B]/95 border border-[#8B5CF6]/25 flex flex-col">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#8B5CF6]/70 to-[#A78BFA]/40" />
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-xs font-bold text-[#C4B5FD]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                          {dict.sections.problemEvidence}
                        </span>
                      </div>
                      <div className="apx-scroll-box h-28">
                        <p className="text-[#E2D9F3]/90 leading-relaxed">
                          {formatDigits(finding.evidence, digits)}
                        </p>
                      </div>
                    </div>

                    {/* 2. MUTED ROSEWOOD — Business Impact / Cost */}
                    <div className="relative overflow-hidden p-4 rounded-2xl bg-[#120C1A]/95 border border-[#B86B77]/28 flex flex-col">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#B86B77]/70 to-[#D8949E]/40" />
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#B86B77]/15 border border-[#B86B77]/30 text-xs font-bold text-[#E2A8B0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C97A86]" />
                          {dict.sections.problemCost}
                        </span>
                      </div>
                      <div className="apx-scroll-box h-28">
                        <p className="text-[#E2D9F3]/90 leading-relaxed">
                          {formatDigits(finding.businessImpact, digits)}
                        </p>
                      </div>
                    </div>

                    {/* 3. MUTED SAGE — APX Solution / Fix in Your Hands */}
                    <div className="relative overflow-hidden p-4 rounded-2xl bg-[#0E121A]/95 border border-[#5E9E7E]/30 flex flex-col">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#5E9E7E]/75 to-[#7BC4A0]/45" />
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#5E9E7E]/15 border border-[#5E9E7E]/32 text-xs font-bold text-[#8ED1B0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#68AD8D]" />
                          {dict.sections.problemFix}
                        </span>
                      </div>
                      <div className="apx-scroll-box h-28">
                        <p className="text-white/95 leading-relaxed font-medium">
                          {formatDigits(finding.apxFix, digits)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )
          })()}
        </motion.section>

        {/* ================================================================
            SECTION 5: INTERACTIVE VISUAL REEL-BY-REEL BREAKDOWN & INSPECTOR
           ================================================================ */}
        {allReelsForInspector.length > 0 && (
          <motion.section
            id="sec-hooks"
            data-audit-section="hooks"
            {...sectionMotion}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 font-en font-bold text-xs text-[#A78BFA]">
                  04
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {dict.sections.hooksTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#E2D9F3]/65">
                    {dict.sections.hooksSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Interactive Performance Tier Filter Tabs */}
                <div className="flex items-center gap-1 bg-[#110B1B] p-1 rounded-xl border border-[#8B5CF6]/25">
                  {(
                    [
                      {
                        id: 'ALL' as const,
                        labelAr:
                          configuredReelsMode === 'TOP_3'
                            ? `أفضل 3 فيديوهات (${defaultModeReels.length})`
                            : configuredReelsMode === 'TOP_4'
                              ? `أفضل 4 فيديوهات (${defaultModeReels.length})`
                              : configuredReelsMode === 'TOP_5'
                                ? `أفضل 5 فيديوهات (${defaultModeReels.length})`
                                : configuredReelsMode === 'LAST_10'
                                  ? `آخر 10 فيديوهات (${defaultModeReels.length})`
                                  : `كل الفيديوهات (${defaultModeReels.length})`,
                        labelEn:
                          configuredReelsMode === 'TOP_3'
                            ? `Top 3 Reels (${defaultModeReels.length})`
                            : configuredReelsMode === 'TOP_4'
                              ? `Top 4 Reels (${defaultModeReels.length})`
                              : configuredReelsMode === 'TOP_5'
                                ? `Top 5 Reels (${defaultModeReels.length})`
                                : configuredReelsMode === 'LAST_10'
                                  ? `Last 10 Reels (${defaultModeReels.length})`
                                  : `All Reels (${defaultModeReels.length})`,
                      },
                      {
                        id: 'VIRAL' as const,
                        labelAr: `الأكثر انتشاراً (${m.accountTotals.viralCount})`,
                        labelEn: `Viral (${m.accountTotals.viralCount})`,
                      },
                      {
                        id: 'ABOVE_AVERAGE' as const,
                        labelAr: `فوق المتوسط (${
                          m.accountTotals.viralCount + m.accountTotals.aboveAverageCount
                        })`,
                        labelEn: `Above Avg (${
                          m.accountTotals.viralCount + m.accountTotals.aboveAverageCount
                        })`,
                      },
                      {
                        id: 'UNDERPERFORMING' as const,
                        labelAr: `أقل من المتوسط (${m.accountTotals.underperformingCount})`,
                        labelEn: `Below Avg (${m.accountTotals.underperformingCount})`,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setReelTierFilter(tab.id)
                        setSelectedHookReelIdx(0)
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        reelTierFilter === tab.id
                          ? 'bg-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/40'
                          : 'text-[#E2D9F3]/65 hover:text-white'
                      }`}
                    >
                      {locale === 'ar' ? tab.labelAr : tab.labelEn}
                    </button>
                  ))}
                </div>

                <span className="px-3 py-1.5 rounded-xl bg-[#110B1B] border border-[#8B5CF6]/25">
                  {dict.sections.strongHookShare}:{' '}
                  <strong className="text-[#A78BFA] font-en">
                    {formatDigits(m.hookQualityShare.value.strongHookSharePct, digits)}%
                  </strong>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#110B1B] border border-[#8B5CF6]/25">
                  {dict.sections.subtitlesShare}:{' '}
                  <strong className="text-white font-en">
                    {formatDigits(m.hookQualityShare.value.subtitlesSharePct, digits)}%
                  </strong>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#110B1B] border border-[#8B5CF6]/25">
                  {dict.sections.ctaShare}:{' '}
                  <strong className="text-white font-en">
                    {formatDigits(m.hookQualityShare.value.ctaSharePct, digits)}%
                  </strong>
                </span>
              </div>
            </div>

            <div className="apx-liquid-glass apx-prism-card rounded-3xl p-5 sm:p-6 space-y-5">
              {/* Visual Thumbnail Reel Slider Strip + Prev/Next Buttons */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#A78BFA]">
                      {locale === 'ar'
                        ? `فيديو ${formatDigits(selectedHookReelIdx + 1, digits)} من ${formatDigits(
                            allReelsForInspector.length,
                            digits
                          )}`
                        : `Reel ${selectedHookReelIdx + 1} of ${allReelsForInspector.length}`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-[#C4B5FD]">
                      {reelTierFilter === 'ALL'
                        ? locale === 'ar'
                          ? 'تحليل جميع فيديوهات الحساب'
                          : 'Full Account Reels Analysis'
                        : reelTierFilter === 'VIRAL'
                          ? locale === 'ar'
                            ? 'الفيديوهات الأكثر انتشاراً'
                            : 'Viral Outliers'
                          : reelTierFilter === 'ABOVE_AVERAGE'
                            ? locale === 'ar'
                              ? 'الفيديوهات فوق المتوسط'
                              : 'Above-Average Reels'
                            : locale === 'ar'
                              ? 'الفيديوهات تحت المتوسط'
                              : 'Underperforming Reels'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedHookReelIdx(
                          (prev) =>
                            (prev - 1 + allReelsForInspector.length) %
                            allReelsForInspector.length
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#080608]/90 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/35 text-xs font-bold text-white transition-all"
                    >
                      {locale === 'ar' ? (
                        <ChevronRight className="w-4 h-4 text-[#A78BFA]" />
                      ) : (
                        <ChevronLeft className="w-4 h-4 text-[#A78BFA]" />
                      )}
                      <span>{locale === 'ar' ? 'السابق' : 'Prev'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedHookReelIdx(
                          (prev) => (prev + 1) % allReelsForInspector.length
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white shadow-md shadow-[#8B5CF6]/30 transition-all"
                    >
                      <span>{locale === 'ar' ? 'التالي' : 'Next'}</span>
                      {locale === 'ar' ? (
                        <ChevronLeft className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                  {allReelsForInspector.map((reel, rIdx) => {
                    const isActive = selectedHookReelIdx === rIdx
                    return (
                      <button
                        key={reel.id || reel.index}
                        type="button"
                        onClick={() => setSelectedHookReelIdx(rIdx)}
                        className={`p-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2.5 border shrink-0 ${
                          isActive
                            ? 'bg-[#8B5CF6]/25 text-white border-[#8B5CF6] ring-2 ring-[#8B5CF6]/40 shadow-lg shadow-[#8B5CF6]/20'
                            : 'bg-[#110B1B] text-[#E2D9F3]/75 border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 hover:text-white'
                        }`}
                      >
                        {reel.thumbnailUrl && (
                          <img
                            src={reel.thumbnailUrl}
                            alt={`Reel ${reel.index}`}
                            className="w-9 h-12 rounded-lg object-cover border border-[#8B5CF6]/35 shrink-0"
                          />
                        )}
                        <div className="text-start pe-1">
                          <span className="block font-bold">
                            {locale === 'ar'
                              ? `المركز #${formatDigits(
                                  reel.performanceRank || rIdx + 1,
                                  digits
                                )} (فيديو ${formatDigits(
                                  String(reel.index).padStart(2, '0'),
                                  digits
                                )})`
                              : `Rank #${reel.performanceRank || rIdx + 1} (Reel ${String(
                                  reel.index
                                ).padStart(2, '0')})`}
                          </span>
                          <span className="text-[11px] opacity-80 font-en block">
                            {formatAuditNumber(reel.views, { digits, compact: true })}{' '}
                            {locale === 'ar' ? 'مشاهدة' : 'views'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Active Reel Visual Spotlight (In-Page Reel Player + Caption + Watch Link + Pros/Cons + Interactive Timeline) */}
              {activeHookReel && (() => {
                const reelShortcode =
                  activeHookReel.url?.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i)?.[1] ||
                  null
                const embedUrl = reelShortcode
                  ? `https://www.instagram.com/reel/${reelShortcode}/embed/`
                  : null
                const filteredNotes = selectedTimestampFilter
                  ? activeHookReel.parsedNotes.filter(
                      (n) => n.timestamp === selectedTimestampFilter
                    )
                  : activeHookReel.parsedNotes

                return (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeHookReel.index}
                      initial={{ opacity: 0, x: locale === 'ar' ? -16 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: locale === 'ar' ? 16 : -16 }}
                      transition={{ duration: 0.22 }}
                      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1C1033]/90 via-[#120A22]/92 to-[#0B0615]/95 border border-[#8B5CF6]/35"
                    >
                      <div className="flex flex-col md:flex-row gap-5">
                        {/* 9:16 Reel Thumbnail / In-Page Player Column */}
                        <div
                          className={`w-full ${
                            playingReelInline && embedUrl ? 'md:w-64' : 'md:w-48'
                          } shrink-0 flex flex-col gap-2.5 transition-all`}
                        >
                          <div className="relative aspect-[9/16] w-full max-w-[260px] mx-auto rounded-2xl overflow-hidden bg-[#120B1E] border border-[#8B5CF6]/45 flex items-center justify-center shadow-lg">
                            {playingReelInline && embedUrl ? (
                              <iframe
                                src={embedUrl}
                                title={`Instagram Reel #${activeHookReel.index}`}
                                className="w-full h-full border-0 bg-black"
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            ) : activeHookReel.thumbnailUrl ? (
                              <div
                                onClick={() => {
                                  if (embedUrl) setPlayingReelInline(true)
                                }}
                                className={`relative w-full h-full ${
                                  embedUrl ? 'cursor-pointer group' : ''
                                }`}
                              >
                                <img
                                  src={activeHookReel.thumbnailUrl}
                                  alt={`Reel #${activeHookReel.index}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {embedUrl && (
                                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                    <span className="w-12 h-12 rounded-full bg-[#8B5CF6]/90 border border-white/40 flex items-center justify-center text-white shadow-[0_0_24px_rgba(139,92,246,0.8)] group-hover:scale-110 transition-transform">
                                      <Play className="w-5 h-5 fill-current ms-0.5" />
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 p-4 text-center">
                                <Play className="w-8 h-8 text-[#A78BFA]/60" />
                                <span className="text-xs font-bold text-[#E2D9F3]/65">
                                  {locale === 'ar'
                                    ? `فيديو #${formatDigits(activeHookReel.index, digits)}`
                                    : `Reel #${activeHookReel.index}`}
                                </span>
                              </div>
                            )}
                            <span className="absolute top-2.5 start-2.5 px-2.5 py-0.5 rounded-lg bg-black/80 border border-[#8B5CF6]/45 text-xs font-en font-bold text-white pointer-events-none">
                              #{activeHookReel.index}
                            </span>
                            {activeHookReel.durationSec && !playingReelInline ? (
                              <span className="absolute bottom-2.5 end-2.5 px-2 py-0.5 rounded-md bg-black/80 text-xs font-en text-[#E2D9F3] pointer-events-none">
                                {formatDigits(activeHookReel.durationSec, digits)}s
                              </span>
                            ) : null}
                          </div>

                          {/* Dual Action Buttons: Play Inside Page + Watch Original on Instagram */}
                          <div className="flex flex-col gap-2">
                            {embedUrl && (
                              <button
                                type="button"
                                onClick={() => setPlayingReelInline((prev) => !prev)}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  playingReelInline
                                    ? 'bg-[#1A0F2E] text-[#A78BFA] border-[#8B5CF6]/50'
                                    : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-[#A78BFA]/40 shadow-md shadow-[#8B5CF6]/25'
                                }`}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>
                                  {playingReelInline
                                    ? locale === 'ar'
                                      ? 'إغلاق المشغل الداخلي'
                                      : 'Close Inline Player'
                                    : locale === 'ar'
                                    ? 'تشغيل الفيديو داخل الموقع'
                                    : 'Play Video Here'}
                                </span>
                              </button>
                            )}

                            {activeHookReel.url && (
                              <a
                                href={activeHookReel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#110B1B] hover:bg-[#1A0F2E] border border-[#8B5CF6]/35 text-[#E2D9F3] hover:text-white text-xs font-bold transition-all"
                              >
                                <span>{dict.sections.watchReelOnIg}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#A78BFA]" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Reel Diagnostic Details Column */}
                        <div className="flex-1 min-w-0 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5CF6]/20 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-[#8B5CF6]/20 text-[#A78BFA] font-bold text-xs sm:text-sm">
                                {locale === 'ar'
                                  ? `تشريح فيديو #${formatDigits(activeHookReel.index, digits)}`
                                  : `Reel #${activeHookReel.index} Breakdown`}
                              </span>
                              <span className="text-xs text-[#E2D9F3]/65 font-en">
                                {activeHookReel.postedAtIso.slice(0, 10)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  activeHookReel.performanceTier === 'VIRAL'
                                    ? 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/40'
                                    : activeHookReel.performanceTier === 'ABOVE_AVERAGE'
                                      ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40'
                                      : activeHookReel.performanceTier === 'AVERAGE'
                                        ? 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/40'
                                        : 'bg-[#F43F5E]/20 text-[#FDA4AF] border-[#F43F5E]/40'
                                }`}
                              >
                                {activeHookReel.performanceTier === 'VIRAL'
                                  ? locale === 'ar'
                                    ? `الأكثر انتشاراً (${formatDigits(
                                        activeHookReel.vsMedianMultiplier,
                                        digits
                                      )}x ضعف المتوسط)`
                                    : `Viral Outlier (${activeHookReel.vsMedianMultiplier}x Median)`
                                  : activeHookReel.performanceTier === 'ABOVE_AVERAGE'
                                    ? locale === 'ar'
                                      ? `فوق المتوسط (${formatDigits(
                                          activeHookReel.vsMedianMultiplier,
                                          digits
                                        )}x)`
                                      : `Above Average (${activeHookReel.vsMedianMultiplier}x)`
                                    : activeHookReel.performanceTier === 'AVERAGE'
                                      ? locale === 'ar'
                                        ? `ضمن المعدل (${formatDigits(
                                            activeHookReel.vsMedianMultiplier,
                                            digits
                                          )}x)`
                                        : `Average (${activeHookReel.vsMedianMultiplier}x)`
                                      : locale === 'ar'
                                        ? `أقل من المتوسط (${formatDigits(
                                            activeHookReel.vsMedianMultiplier,
                                            digits
                                          )}x)`
                                        : `Underperforming (${activeHookReel.vsMedianMultiplier}x)`}
                              </span>
                              {activeHookReel.hookType && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                    activeHookReel.hookType === 'WEAK'
                                      ? 'bg-[#C95D63]/15 text-[#C95D63] border-[#C95D63]/35'
                                      : 'bg-[#4BA37A]/15 text-[#4BA37A] border-[#4BA37A]/35'
                                  }`}
                                >
                                  {dict.hookTypes[activeHookReel.hookType] ||
                                    activeHookReel.hookType}
                                </span>
                              )}
                            </div>
                          </div>

                          {(activeHookReel.caption || activeHookReel.topic) && (
                            <div className="p-3.5 rounded-xl bg-[#140B24] border border-[#8B5CF6]/25">
                              <div className="apx-scroll-box">
                                <p className="text-xs sm:text-sm text-white/95 leading-relaxed whitespace-pre-line">
                                  {activeHookReel.caption || activeHookReel.topic}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Full 7-Metric Engagement Grid (Views, Likes, Comments, Shares, Saves, Reposts, Engagement Rate) */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
                            <div className="p-2.5 rounded-xl bg-[#140B24] border border-[#8B5CF6]/25">
                              <span className="text-[#E2D9F3]/60 block text-[11px]">
                                {dict.sections.reelViewsLabel}
                              </span>
                              <strong className="apx-serif-numeral text-base font-bold text-white">
                                {formatAuditNumber(activeHookReel.views, { digits })}
                              </strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#140B24] border border-[#8B5CF6]/25">
                              <span className="text-[#E2D9F3]/60 block text-[11px]">
                                {dict.sections.reelLikesLabel}
                              </span>
                              <strong className="apx-serif-numeral text-base font-bold text-white">
                                {formatAuditNumber(activeHookReel.likes, { digits })}
                              </strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#140B24] border border-[#8B5CF6]/25">
                              <span className="text-[#E2D9F3]/60 block text-[11px]">
                                {dict.sections.reelCommentsLabel}
                              </span>
                              <strong className="apx-serif-numeral text-base font-bold text-white">
                                {formatAuditNumber(activeHookReel.comments, { digits })}
                              </strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#140B24] border border-[#8B5CF6]/25">
                              <span className="text-[#E2D9F3]/60 block text-[11px]">
                                {locale === 'ar' ? 'المشاركات (Shares)' : 'Shares'}
                              </span>
                              <strong className="apx-serif-numeral text-base font-bold text-white">
                                {formatAuditNumber(activeHookReel.shares, { digits })}
                              </strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#140B24] border border-[#8B5CF6]/25">
                              <span className="text-[#E2D9F3]/60 block text-[11px]">
                                {locale === 'ar' ? 'الحفظ (Saves)' : 'Saves'}
                              </span>
                              <strong className="apx-serif-numeral text-base font-bold text-white">
                                {formatAuditNumber(activeHookReel.saves, { digits })}
                              </strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#140B24] border border-[#8B5CF6]/25">
                              <span className="text-[#E2D9F3]/60 block text-[11px]">
                                {locale === 'ar' ? 'إعادة النشر (Reposts)' : 'Reposts'}
                              </span>
                              <strong className="apx-serif-numeral text-base font-bold text-white">
                                {formatAuditNumber(activeHookReel.repostsCount, { digits })}
                              </strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40">
                              <span className="text-[#C4B5FD] block text-[11px]">
                                {locale === 'ar' ? 'التفاعل الشامل' : 'Full Engagement'}
                              </span>
                              <strong className="apx-serif-numeral text-base font-bold text-[#A78BFA]">
                                {formatDigits(activeHookReel.fullEngagementRatePct, digits)}%
                              </strong>
                            </div>
                          </div>

                          {/* Pros (المميزات) & Cons (العيوب) with Harmonious Non-Garish Boxes */}
                          {(activeHookReel.pros || activeHookReel.cons) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                              {activeHookReel.pros && (
                                <div className="p-3.5 rounded-xl bg-[#0F131B]/95 border border-[#5E9E7E]/30 space-y-1">
                                  <span className="text-xs font-bold text-[#8ED1B0] block">
                                    ✓ {dict.sections.reelProsTitle}
                                  </span>
                                  <div className="apx-scroll-box">
                                    <p className="text-[#E2D9F3]/90 leading-relaxed">
                                      {formatDigits(activeHookReel.pros, digits)}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {activeHookReel.cons && (
                                <div className="p-3.5 rounded-xl bg-[#130D19]/95 border border-[#B86B77]/30 space-y-1">
                                  <span className="text-xs font-bold text-[#E2A8B0] block">
                                    ✕ {dict.sections.reelConsTitle}
                                  </span>
                                  <div className="apx-scroll-box">
                                    <p className="text-[#E2D9F3]/90 leading-relaxed">
                                      {formatDigits(activeHookReel.cons, digits)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Interactive Video Timeline & Timestamped Editing Notes */}
                          {activeHookReel.parsedNotes.length > 0 && (
                            <div className="space-y-3 pt-1">
                              {/* Interactive Second-by-Second Timeline Bar */}
                              <div className="p-3 rounded-xl bg-[#140B24]/90 border border-[#8B5CF6]/30 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <span className="font-bold text-[#A78BFA] flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {locale === 'ar'
                                      ? 'الشريط الزمني لملاحظات الفيديو (اضغط على الثانية للتركيز):'
                                      : 'Interactive Video Timeline (Click timestamp to focus):'}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTimestampFilter(null)}
                                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                                        selectedTimestampFilter === null
                                          ? 'bg-[#8B5CF6] text-white'
                                          : 'bg-[#080608] text-[#E2D9F3]/70 hover:text-white'
                                      }`}
                                    >
                                      {locale === 'ar' ? 'الكل' : 'All'}
                                    </button>
                                    {activeHookReel.parsedNotes
                                      .filter((n) => Boolean(n.timestamp))
                                      .map((note, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          dir="ltr"
                                          onClick={() =>
                                            setSelectedTimestampFilter((prev) =>
                                              prev === note.timestamp
                                                ? null
                                                : note.timestamp || null
                                            )
                                          }
                                          className={`px-2.5 py-0.5 rounded-lg font-en text-[11px] font-bold transition-all border ${
                                            selectedTimestampFilter === note.timestamp
                                              ? 'bg-[#8B5CF6] text-white border-[#A78BFA] shadow-sm shadow-[#8B5CF6]/40'
                                              : 'bg-[#1E1136] text-[#C4B5FD] border-[#8B5CF6]/35 hover:border-[#A78BFA]'
                                          }`}
                                        >
                                          {note.timestamp}
                                        </button>
                                      ))}
                                  </div>
                                </div>

                                {/* Visual Progress Track with Timestamp Pins */}
                                <div className="relative h-2 w-full rounded-full bg-[#090510] overflow-hidden">
                                  <div className="absolute inset-y-0 start-0 w-full bg-gradient-to-r from-[#8B5CF6]/35 via-[#A78BFA]/55 to-[#8B5CF6]/35" />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {filteredNotes.map((note, nIdx) => (
                                  <div
                                    key={nIdx}
                                    className="flex items-start gap-2.5 text-sm bg-gradient-to-br from-[#23143E]/85 to-[#150C28]/90 p-3.5 rounded-xl border border-[#8B5CF6]/35"
                                  >
                                    {note.timestamp && (
                                      <span
                                        dir="ltr"
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#8B5CF6]/30 border border-[#A78BFA]/50 text-white font-en text-xs font-bold shrink-0"
                                      >
                                        <Clock className="w-3 h-3 text-[#C4B5FD]" />
                                        {note.timestamp}
                                      </span>
                                    )}
                                    <div className="apx-scroll-box flex-1">
                                      <span className="text-[#E2D9F3]/95 leading-relaxed">
                                        {formatDigits(note.text, digits)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )
              })()}
            </div>
          </motion.section>
        )}

        {/* ================================================================
            SECTION 6: COMPETITOR GAP (Interactive Competitor Slider)
           ================================================================ */}
        <motion.section
          id="sec-competitors"
          data-audit-section="competitors"
          {...sectionMotion}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 font-en font-bold text-xs text-[#A78BFA]">
                05
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {dict.sections.competitorsTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#E2D9F3]/65">
                  {dict.sections.competitorsSubtitle}
                </p>
              </div>
            </div>

            {m.competitorGap.value.items.length > 1 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#110B1B] p-1 rounded-xl border border-[#8B5CF6]/25">
                  {m.competitorGap.value.items.map((comp, idx) => (
                    <button
                      key={comp.handle || idx}
                      type="button"
                      onClick={() => setSelectedCompetitorIdx(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-en font-bold transition-all ${
                        selectedCompetitorIdx === idx
                          ? 'bg-[#8B5CF6] text-white'
                          : 'text-[#E2D9F3]/65 hover:text-white'
                      }`}
                      dir="ltr"
                    >
                      @{comp.handle}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCompetitorIdx(
                      (prev) =>
                        (prev - 1 + m.competitorGap.value.items.length) %
                        m.competitorGap.value.items.length
                    )
                  }
                  className="p-2 rounded-xl bg-[#110B1B] hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-white transition-all"
                >
                  {locale === 'ar' ? (
                    <ChevronRight className="w-4 h-4 text-[#A78BFA]" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-[#A78BFA]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCompetitorIdx(
                      (prev) => (prev + 1) % m.competitorGap.value.items.length
                    )
                  }
                  className="p-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30 transition-all"
                >
                  {locale === 'ar' ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="apx-liquid-glass apx-prism-card rounded-3xl p-5 sm:p-6 space-y-4">
            {(() => {
              const allPcts = [
                m.reachEfficiency.value.percent,
                ...m.competitorGap.value.items.map((c) => c.reachEfficiencyPct),
                1,
              ]
              const maxEffPct = Math.max(...allPcts)
              const prospectWidth = Math.max(
                8,
                (m.reachEfficiency.value.percent / maxEffPct) * 100
              )
              const safeCompIdx = Math.max(
                0,
                Math.min(
                  m.competitorGap.value.items.length - 1,
                  selectedCompetitorIdx
                )
              )
              const activeComp = m.competitorGap.value.items[safeCompIdx]

              return (
                <>
                  <div className="p-4 rounded-2xl bg-[#080608]/85 border border-[#8B5CF6]/20 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2D9F3]/15 text-white">
                          {dict.sections.yourAccount}
                        </span>
                        <span className="font-en font-bold text-white" dir="ltr">
                          @{report.prospect.handle}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#E2D9F3]/75">
                        <span>
                          {dict.sections.medianViewsShort}:{' '}
                          <strong className="text-white font-en">
                            {formatAuditNumber(m.medianViews.value, { digits })}
                          </strong>
                        </span>
                        <span>
                          {dict.sections.efficiencyShort}:{' '}
                          <strong className="text-white font-en">
                            {formatDigits(m.reachEfficiency.value.percent, digits)}%
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#110B1B] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${prospectWidth}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full bg-[#E2D9F3]/45"
                      />
                    </div>
                  </div>

                  {activeComp && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeComp.handle || safeCompIdx}
                        initial={{ opacity: 0, x: locale === 'ar' ? -16 : 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: locale === 'ar' ? 16 : -16 }}
                        transition={{ duration: 0.22 }}
                        className="p-4 rounded-2xl bg-[#110B1B]/90 border border-[#8B5CF6]/40 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-en font-bold text-[#A78BFA]" dir="ltr">
                              @{activeComp.handle}
                            </span>
                            <span className="text-xs text-[#E2D9F3]/65">
                              ({formatAuditNumber(activeComp.followers, { digits })}{' '}
                              {dict.sections.followers})
                            </span>
                          </div>

                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/45">
                            {formatDigits(activeComp.multiplierVsProspect, digits)}x{' '}
                            {locale === 'ar'
                              ? 'مشاهدات أكثر لكل متابع'
                              : 'more views per follower'}
                          </span>
                        </div>

                        <div className="h-3 w-full rounded-full bg-[#080608] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.max(
                                10,
                                (activeComp.reachEfficiencyPct / maxEffPct) * 100
                              )}%`,
                            }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]"
                          />
                        </div>

                        <div className="apx-scroll-box">
                          <p className="text-xs sm:text-sm text-[#E2D9F3]/85 leading-relaxed">
                            {formatDigits(activeComp.explanation[locale], digits)}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </>
              )
            })()}
          </div>
        </motion.section>

        {/* ================================================================
            SECTION 7: STREAMLINED UNIFIED 4-STAGE FUNNEL CARD
           ================================================================ */}
        <motion.section
          id="sec-funnel"
          data-audit-section="funnel"
          {...sectionMotion}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 font-en font-bold text-xs text-[#A78BFA]">
              06
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {dict.sections.funnelTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#E2D9F3]/65">
                {dict.sections.funnelSubtitle}
              </p>
            </div>
          </div>

          <div className="apx-liquid-glass apx-prism-card rounded-3xl p-5 sm:p-6 space-y-5">
            {/* Compact Connected 4-Step Pipeline Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {funnelStages.map((stage) => {
                const isSelected = activeStage.id === stage.id
                const dotColor =
                  stage.status === 'OK'
                    ? 'bg-[#4BA37A]'
                    : stage.status === 'WEAK'
                    ? 'bg-[#FBBF24]'
                    : 'bg-[#C95D63]'
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedFunnelStageId(stage.id)}
                    className={`px-3.5 py-3 rounded-2xl text-start transition-all border flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#8B5CF6]/25 border-[#8B5CF6] ring-1 ring-[#A78BFA]/45 text-white shadow-md shadow-[#8B5CF6]/20'
                        : 'bg-[#120A22]/85 border-[#8B5CF6]/20 text-[#E2D9F3]/75 hover:border-[#8B5CF6]/45 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-bold block truncate">
                        {locale === 'ar' ? stage.titleAr : stage.titleEn}
                      </span>
                      <span className="text-[11px] text-[#E2D9F3]/60 block truncate mt-0.5">
                        {locale === 'ar' ? stage.descAr : stage.descEn}
                      </span>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`}
                      title={statusTextForCheck(stage.status)}
                    />
                  </button>
                )
              })}
            </div>

            {/* Streamlined Single-Box Checklist for Active Stage */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#21133B]/85 via-[#160C28]/90 to-[#10081E]/95 border border-[#8B5CF6]/35 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5CF6]/20 pb-2.5 text-xs">
                  <span className="font-bold text-[#A78BFA]">
                    {locale === 'ar'
                      ? `فحص عناصر: ${activeStage.titleAr}`
                      : `Stage Checklist: ${activeStage.titleEn}`}
                  </span>
                  <span className="text-[#E2D9F3]/60">
                    {locale === 'ar'
                      ? 'اختر أي مرحلة بالأعلى لعرض نقاط الفحص'
                      : 'Select any stage above to inspect'}
                  </span>
                </div>

                <div className="divide-y divide-[#8B5CF6]/15">
                  {activeStageChecks.map((check) => {
                    const statusStyle =
                      check.status === 'OK'
                        ? 'bg-[#4BA37A]/15 text-[#4BA37A] border-[#4BA37A]/35'
                        : check.status === 'WEAK'
                        ? 'bg-[#D49A3D]/15 text-[#FBBF24] border-[#D49A3D]/35'
                        : 'bg-[#C95D63]/15 text-[#FDA4AF] border-[#C95D63]/35'

                    return (
                      <div
                        key={check.key}
                        className="py-3 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-white block">
                            {dict.profileChecks[check.key] || check.key}
                          </span>
                          {check.evidence && (
                            <p className="text-xs sm:text-sm text-[#E2D9F3]/80 leading-relaxed">
                              {formatDigits(check.evidence, digits)}
                            </p>
                          )}
                        </div>
                        <span
                          className={`self-start sm:self-center px-3 py-0.5 rounded-full text-xs font-bold border shrink-0 ${statusStyle}`}
                        >
                          {statusTextForCheck(check.status)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION 8: SINGLE-BOX BULLET LIST FOR UNMEASURED ITEMS
           ================================================================ */}
        <motion.section
          id="sec-unmeasured"
          data-audit-section="unmeasured"
          {...sectionMotion}
        >
          <div className="apx-liquid-glass apx-prism-card rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 font-en font-bold text-xs text-[#A78BFA]">
                07
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {dict.sections.unmeasuredTitle}
                </h2>
                <p className="text-xs text-[#E2D9F3]/70">
                  {locale === 'ar'
                    ? 'هناك مؤشرات داخلية لا يمكن قراءتها من خارج الحساب بدون فتح لوحة إحصائيات إنستغرام (Insights):'
                    : 'Internal metrics that cannot be measured externally without opening Instagram Insights:'}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#21133B]/85 via-[#150C28]/90 to-[#0E071B]/95 border border-[#8B5CF6]/35 space-y-3">
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#E2D9F3]/95">
                {report.unmeasuredItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-[#A78BFA] font-bold text-base leading-none mt-0.5 select-none">
                      •
                    </span>
                    <div>
                      <strong className="text-white font-bold">
                        {formatDigits(item.label, digits)}:
                      </strong>{' '}
                      <span className="text-[#E2D9F3]/80">
                        {formatDigits(item.whyItMatters, digits)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t border-[#8B5CF6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                <p className="text-xs text-[#C4B5FD]">
                  {locale === 'ar'
                    ? 'إذا رغبت في تحليل هذه النقاط أيضاً، يمكنك إرفاق لقطة شاشة من لوحة Insights أو استعراضها معنا مباشرة في المكالمة.'
                    : 'To analyze these internal metrics as well, you can attach an Insights screenshot or review them live on our call.'}
                </p>
                <label className="cursor-pointer shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#8B5CF6]/25 hover:bg-[#8B5CF6]/40 border border-[#A78BFA]/45 text-xs font-bold text-white transition-all">
                  <Upload className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>
                    {uploadingFiles
                      ? dict.sections.uploadingBtn
                      : dict.sections.uploadScreenshotsBtn}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleInsightsUpload}
                    disabled={uploadingFiles}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadSuccessMsg && (
                <p className="text-xs font-bold text-[#4BA37A]">
                  {dict.sections.uploadSuccess}
                </p>
              )}
              {uploadError && (
                <p className="text-xs font-bold text-[#C95D63]">{uploadError}</p>
              )}
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION 9: HIGH-CONVERTING FOMO CTA + SCARCITY & COUNTDOWN
           ================================================================ */}
        <motion.section
          id="sec-cta"
          data-audit-section="cta"
          {...sectionMotion}
          className="pb-8"
        >
          <div className="apx-liquid-glass apx-prism-card rounded-3xl p-6 sm:p-10 border border-[#8B5CF6]/50 text-center space-y-6 relative overflow-hidden">
            {/* High-Impact FOMO & Scarcity Bar (Shared Component Across Audit & Website) */}
            {report.settings?.fomoEnabled !== false && (
              <FomoBanner
                locale={locale}
                acceptingClients={report.settings?.acceptingClients !== false}
                seatsLeft={report.settings?.fomoSeatsLeft ?? 3}
                urgencyTextAr={
                  report.settings?.fomoUrgencyTextAr ||
                  `متبقي ${formatDigits(
                    report.settings?.fomoSeatsLeft ?? 3,
                    digits
                  )} مقاعد فقط لتطبيق الـ System هذا الشهر`
                }
                urgencyTextEn={
                  report.settings?.fomoUrgencyTextEn ||
                  `Only ${report.settings?.fomoSeatsLeft ?? 3} onboarding spots left this month`
                }
                countdownMinutes={report.settings?.fomoCountdownMinutes ?? 30}
                secondsLeftOverride={fomoSecondsLeft}
                formatSeatsNumber={(n: number) => formatDigits(n, digits)}
                className="max-w-2xl mx-auto"
              />
            )}

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>
                {locale === 'ar'
                  ? 'الـ System المتكامل لـ APX خلال 90 يوماً'
                  : 'APX 90-DAY DONE-FOR-YOU SYSTEM'}
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-bold text-white max-w-2xl mx-auto leading-snug">
              {dict.sections.closingTitle}
            </h2>

            <p className="text-sm sm:text-[15px] text-[#E2D9F3]/85 max-w-xl mx-auto leading-relaxed">
              {dict.sections.closingSubtitle}
            </p>

            {/* Always-Open Embedded Calendly Booking Calendar (Zero Buttons Required) */}
            <div className="pt-2 no-print max-w-3xl mx-auto">
              <CalendlyInlineEmbed
                bookingUrl={
                  report.settings?.bookingUrl ||
                  'https://calendly.com/zyaddonga/30min?hide_gdpr_banner=1&primary_color=8b5cf6'
                }
                locale={locale}
                themeMode={themeMode}
                height={680}
                onScheduled={() => handleCtaClick('CALENDLY_SCHEDULED')}
              />
            </div>

            {(report.settings?.scarcityTextAr || report.settings?.scarcityTextEn) && (
              <p className="text-xs text-[#E2D9F3]/70 max-w-lg mx-auto pt-1">
                {locale === 'ar'
                  ? report.settings.scarcityTextAr
                  : report.settings.scarcityTextEn}
              </p>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  )
}

export default AuditReportView
