'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Columns,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  Maximize2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react'
import '../../theme/tokens.css'
import { apxFontVariables } from '../../theme/fonts'
import ApxMark from '../brand/ApxMark'
import { trpc } from '../../client/trpc'
import {
  AUDIT_CATEGORY_KEYS,
  AUDIT_PROFILE_CHECK_KEYS,
  AuditCategoryKey,
  AuditCheckStatus,
  AuditFindingSeverity,
  AuditHookType,
  AuditLanguage,
  AuditProfileCheckKey,
  AUTO_SUGGESTED_CATEGORIES,
  DEFAULT_CATEGORY_WEIGHTS,
} from '../../schemas'
import {
  calculateAuditMetrics,
  computeWeightedOverallScore,
  parseReelsCsvOrPaste,
} from '../../metrics'
import { getDictionary } from '../../i18n'
import { ADMIN_DICTIONARY, AdminLocale } from '../../i18n/adminDict'
import AuditReportView, { PublicAuditReportData } from '../report/AuditReportView'
import {
  ReelsMedianBarChart,
  ScorecardRadarChart,
} from '../report/ReportCharts'

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
}

function formatCommaInput(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return ''
  const digits = String(val).replace(/[^0-9]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('en-US')
}

function parseCommaInput(val: string): number {
  const digits = String(val || '').replace(/[^0-9]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

export function AuditWizard({
  auditId,
  onBack,
  adminLang: controlledLang,
  onToggleLang,
}: {
  auditId: string
  onBack?: () => void
  adminLang?: AdminLocale
  onToggleLang?: () => void
}) {
  const [internalLang, setInternalLang] = useState<AdminLocale>('ar')
  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? (localStorage.getItem('apx_admin_lang') as AdminLocale | null)
        : null
    if (saved === 'ar' || saved === 'en') {
      setInternalLang(saved)
    }
  }, [])

  const lang: AdminLocale = controlledLang ?? internalLang
  const t = ADMIN_DICTIONARY[lang]
  const dict = getDictionary(lang)
  const isRtl = lang === 'ar'

  const handleToggleLang = () => {
    if (onToggleLang) {
      onToggleLang()
      return
    }
    const next: AdminLocale = lang === 'ar' ? 'en' : 'ar'
    setInternalLang(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('apx_admin_lang', next)
    }
  }

  const wizardTabs = useMemo(
    () => [
      { num: 0, title: t.stepAll },
      { num: 1, title: t.step1 },
      { num: 2, title: t.step2 },
      { num: 3, title: t.step3 },
      { num: 4, title: t.step4 },
      { num: 5, title: t.step5 },
      { num: 6, title: t.step6 },
    ],
    [t]
  )

  const utils = trpc.useUtils()
  const detailQuery = trpc.audit.getById.useQuery({ id: auditId })
  const snippetsQuery = trpc.audit.listSnippets.useQuery()

  const [step, setStep] = useState<number>(1)
  const [layoutMode, setLayoutMode] = useState<'editor' | 'preview'>('editor')
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop')
  const [activeEditorPillarIdx, setActiveEditorPillarIdx] = useState<number>(0)
  const [activeEditorFindingIdx, setActiveEditorFindingIdx] = useState<number>(0)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Local editable state hydrated from server
  const [hydratedId, setHydratedId] = useState<string | null>(null)
  const [language, setLanguage] = useState<AuditLanguage>('ar')
  const [summaryOpening, setSummaryOpening] = useState('')
  const [verdictLine, setVerdictLine] = useState('')
  const [expiresAt, setExpiresAt] = useState<string>('')

  const [prospect, setProspect] = useState({
    handle: '',
    displayName: '',
    niche: '',
    followers: 10000,
    followingCount: null as number | null,
    postsCount: null as number | null,
    profileUrl: '',
    linkInBioUrl: '',
    avatarUrl: '' as string | null,
    bio: '',
    bioLinks: [] as Array<{ title: string; url: string }>,
    notes: '',
  })

  const [reels, setReels] = useState<
    Array<{
      id?: string
      shortcode?: string | null
      url?: string | null
      thumbnailUrl?: string | null
      caption?: string | null
      postedAt: string
      views: number
      viewsEstimated?: boolean | null
      likes: number
      comments: number
      shares?: number | null
      saves?: number | null
      durationSec?: number | null
      topic?: string | null
      hookType?: AuditHookType | null
      hasSubtitles?: boolean | null
      hasCta?: boolean | null
      isRepost?: boolean | null
      demandSignalsCount: number
      pros?: string | null
      cons?: string | null
      editorNotes: string
      position: number
    }>
  >([])

  const [scrapeReelsCount, setScrapeReelsCount] = useState<number>(10)
  const [singleReelUrlInput, setSingleReelUrlInput] = useState<string>('')
  const [scrapingReelIndex, setScrapingReelIndex] = useState<number | null>(null)
  const [bulkScrapingReels, setBulkScrapingReels] = useState<boolean>(false)
  const [scraperFeedback, setScraperFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [profileChecks, setProfileChecks] = useState<
    Array<{
      key: AuditProfileCheckKey
      status: AuditCheckStatus
      evidence: string
      screenshotUrl?: string | null
    }>
  >([])

  const [competitors, setCompetitors] = useState<
    Array<{
      id?: string
      handle: string
      displayName: string
      followers: number
      medianViews: number
      notes: string
      reels: Array<{
        id?: string
        postedAt: string
        views: number
        likes: number
        comments: number
      }>
    }>
  >([])

  const [categoryScores, setCategoryScores] = useState<
    Array<{
      categoryKey: AuditCategoryKey
      score: number
      autoSuggestedScore: number | null
      isAutoSuggested: boolean
      isOverridden: boolean
      evidence: string
      recommendation: string
      weight: number
    }>
  >([])

  const [findings, setFindings] = useState<
    Array<{
      rank: number
      title: string
      evidence: string
      businessImpact: string
      apxFix: string
      severity: AuditFindingSeverity
    }>
  >([])

  const [unmeasuredItems, setUnmeasuredItems] = useState<
    Array<{
      id?: string
      label: string
      whyItMatters: string
      position: number
    }>
  >([])

  const isDirtyRef = useRef(false)

  // Hydrate state when query loads
  useEffect(() => {
    if (!detailQuery.data || hydratedId === detailQuery.data.audit.id) return
    const a = detailQuery.data.audit
    setHydratedId(a.id)
    setLanguage(a.language)
    setSummaryOpening(a.summaryOpening)
    setVerdictLine(a.verdictLine || '')
    setExpiresAt(
      a.expiresAt
        ? a.expiresAt.slice(0, 10)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    )
    setProspect({
      handle: a.prospect.handle,
      displayName: a.prospect.displayName,
      niche: a.prospect.niche,
      followers: a.prospect.followers,
      followingCount: a.prospect.followingCount,
      postsCount: a.prospect.postsCount,
      profileUrl: a.prospect.profileUrl,
      linkInBioUrl: a.prospect.linkInBioUrl || '',
      avatarUrl: a.prospect.avatarUrl || null,
      bio: a.prospect.bio || '',
      bioLinks: a.prospect.bioLinks || [],
      notes: a.prospect.notes || '',
    })
    setReels(
      a.reels.map((r, i) => ({
        ...r,
        postedAt: r.postedAt.slice(0, 10),
        position: r.position || i + 1,
      }))
    )

    const checksMap = new Map(a.profileChecks.map((c) => [c.key, c]))
    setProfileChecks(
      AUDIT_PROFILE_CHECK_KEYS.map((key) => {
        const existing = checksMap.get(key)
        return (
          existing || {
            key,
            status: 'WEAK' as AuditCheckStatus,
            evidence: '',
            screenshotUrl: null,
          }
        )
      })
    )

    setCompetitors(a.competitors)

    const catMap = new Map(a.categoryScores.map((c) => [c.categoryKey, c]))
    setCategoryScores(
      AUDIT_CATEGORY_KEYS.map((categoryKey) => {
        const existing = catMap.get(categoryKey)
        return (
          existing || {
            categoryKey,
            score: 5,
            autoSuggestedScore: null,
            isAutoSuggested: AUTO_SUGGESTED_CATEGORIES.includes(categoryKey),
            isOverridden: false,
            evidence: '',
            recommendation: '',
            weight: DEFAULT_CATEGORY_WEIGHTS[categoryKey] ?? 1.0,
          }
        )
      })
    )

    setFindings(
      a.findings && a.findings.length > 0
        ? a.findings
            .slice()
            .sort((x, y) => x.rank - y.rank)
            .map((f, idx) => ({
              ...f,
              rank: idx + 1,
            }))
        : [1, 2, 3].map((rank) => ({
            rank,
            title: isRtl ? `الفجوة الرئيسية رقم ${rank}` : `Core Bottleneck ${rank}`,
            evidence: '',
            businessImpact: '',
            apxFix: '',
            severity: rank === 1 ? 'CRITICAL' : 'HIGH',
          }))
    )

    setUnmeasuredItems(a.unmeasuredItems)
    isDirtyRef.current = false
  }, [detailQuery.data, hydratedId, isRtl])

  // Live Metrics Calculation for Real-Time Preview & Auto-Suggested Scores
  const liveMetrics = useMemo(() => {
    return calculateAuditMetrics({
      followers: prospect.followers,
      reels,
      competitors,
    })
  }, [prospect.followers, reels, competitors])

  // Sync non-overridden auto-suggested scores (categories 4, 5, 9) with liveMetrics
  const syncedCategoryScores = useMemo(() => {
    return categoryScores.map((cs) => {
      if (!AUTO_SUGGESTED_CATEGORIES.includes(cs.categoryKey)) {
        return cs
      }
      const autoObj =
        liveMetrics.autoSuggestedScores[
          cs.categoryKey as 'content_system' | 'reach_efficiency' | 'competitor_gap'
        ]
      const autoScore = autoObj.score
      const effectiveScore = cs.isOverridden ? cs.score : autoScore
      return {
        ...cs,
        score: effectiveScore,
        autoSuggestedScore: autoScore,
        isAutoSuggested: true,
        evidence: cs.evidence?.trim()
          ? cs.evidence
          : lang === 'ar'
          ? autoObj.evidenceAr
          : autoObj.evidenceEn,
        recommendation: cs.recommendation?.trim()
          ? cs.recommendation
          : lang === 'ar'
          ? autoObj.recommendationAr
          : autoObj.recommendationEn,
      }
    })
  }, [categoryScores, liveMetrics, lang])

  const liveOverallScore = useMemo(() => {
    return computeWeightedOverallScore(
      syncedCategoryScores,
      detailQuery.data?.settings?.weightsJson
    )
  }, [syncedCategoryScores, detailQuery.data?.settings?.weightsJson])

  const saveMutation = trpc.audit.saveFull.useMutation({
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved')
      isDirtyRef.current = false
      utils.audit.getById.invalidate({ id: auditId })
      utils.audit.list.invalidate()
    },
    onError: () => setSaveStatus('idle'),
  })

  const saveSettingsMutation = trpc.audit.saveSettings.useMutation({
    onSuccess: () => {
      utils.audit.getById.invalidate({ id: auditId })
      utils.audit.getSettings.invalidate()
    },
  })

  const publishMutation = trpc.audit.publish.useMutation({
    onSuccess: () => {
      setPublishError(null)
      utils.audit.getById.invalidate({ id: auditId })
      utils.audit.list.invalidate()
    },
    onError: (err) => {
      setPublishError(err.message)
    },
  })

  const unpublishMutation = trpc.audit.unpublish.useMutation({
    onSuccess: () => {
      utils.audit.getById.invalidate({ id: auditId })
      utils.audit.list.invalidate()
    },
  })

  const regenerateTokenMutation = trpc.audit.regenerateToken.useMutation({
    onSuccess: () => {
      utils.audit.getById.invalidate({ id: auditId })
      utils.audit.list.invalidate()
    },
  })

  const scrapeAccountMutation = trpc.audit.scrapeInstagram.useMutation({
    onSuccess: (scraped) => {
      markDirty()
      setProspect((prev) => ({
        ...prev,
        handle: scraped.handle || prev.handle,
        displayName: scraped.displayName || prev.displayName,
        niche: scraped.niche || prev.niche,
        followers: scraped.followers || prev.followers,
        followingCount: scraped.followingCount ?? prev.followingCount,
        postsCount: scraped.postsCount ?? prev.postsCount,
        profileUrl: scraped.profileUrl || prev.profileUrl,
        linkInBioUrl: scraped.linkInBioUrl || prev.linkInBioUrl,
        avatarUrl: scraped.avatarUrl || prev.avatarUrl,
        bio: scraped.bio || prev.bio,
        bioLinks:
          scraped.bioLinks && scraped.bioLinks.length > 0
            ? scraped.bioLinks
            : prev.bioLinks,
      }))
      if (scraped.reels && scraped.reels.length > 0) {
        setReels(
          scraped.reels.map((r, i) => ({
            shortcode: r.shortcode,
            url: r.url,
            thumbnailUrl: r.thumbnailUrl,
            caption: r.caption,
            topic: r.topic,
            postedAt: r.postedAt.slice(0, 10),
            views: r.views,
            viewsEstimated: r.viewsEstimated,
            likes: r.likes,
            comments: r.comments,
            shares: r.shares,
            saves: r.saves,
            durationSec: r.durationSec,
            hookType: r.hookType,
            hasSubtitles: r.hasSubtitles,
            hasCta: r.hasCta,
            isRepost: r.isRepost,
            demandSignalsCount: r.demandSignalsCount,
            pros: r.pros || '',
            cons: r.cons || '',
            editorNotes: r.editorNotes || '',
            position: i + 1,
          }))
        )
      }
      setScraperFeedback({
        type: 'success',
        message: t.scrapeSuccessBadge,
      })
    },
    onError: (err) => {
      setScraperFeedback({
        type: 'error',
        message: `${t.scrapeErrorPrefix} ${err.message}`,
      })
    },
  })

  const scrapeSingleReelMutation = trpc.audit.scrapeSingleReel.useMutation({
    onError: (err) => {
      setScraperFeedback({
        type: 'error',
        message: `${t.scrapeErrorPrefix} ${err.message}`,
      })
    },
  })

  const handleScrapePastedReelUrls = async () => {
    const raw = singleReelUrlInput.trim()
    if (!raw || bulkScrapingReels) return
    const urls = raw
      .split(/[\n\r,\s]+/)
      .map((u) => u.trim())
      .filter(Boolean)
    if (urls.length === 0) return

    setBulkScrapingReels(true)
    setScraperFeedback(null)
    try {
      const scrapedItems: Array<Awaited<ReturnType<typeof scrapeSingleReelMutation.mutateAsync>>> = []
      for (const u of urls) {
        const reel = await scrapeSingleReelMutation.mutateAsync({ reelUrlOrCode: u })
        scrapedItems.push(reel)
      }
      if (scrapedItems.length > 0) {
        markDirty()
        setSingleReelUrlInput('')
        setReels((prev) => [
          ...prev,
          ...scrapedItems.map((reel, i) => ({
            shortcode: reel.shortcode,
            url: reel.url,
            thumbnailUrl: reel.thumbnailUrl,
            caption: reel.caption,
            topic: reel.topic,
            postedAt: reel.postedAt.slice(0, 10),
            views: reel.views,
            viewsEstimated: reel.viewsEstimated,
            likes: reel.likes,
            comments: reel.comments,
            shares: reel.shares,
            saves: reel.saves,
            durationSec: reel.durationSec,
            hookType: reel.hookType,
            hasSubtitles: reel.hasSubtitles,
            hasCta: reel.hasCta,
            isRepost: reel.isRepost,
            demandSignalsCount: reel.demandSignalsCount,
            pros: reel.pros || '',
            cons: reel.cons || '',
            editorNotes: reel.editorNotes || '',
            position: prev.length + i + 1,
          })),
        ])
      }
    } catch {
      // Error already handled by mutation onError
    } finally {
      setBulkScrapingReels(false)
    }
  }

  const handleScrapeReelAtSlot = async (slotIdx: number, urlOrCode: string) => {
    const cleaned = (urlOrCode || '').trim()
    if (!cleaned || scrapingReelIndex !== null) return
    setScrapingReelIndex(slotIdx)
    setScraperFeedback(null)
    try {
      const reel = await scrapeSingleReelMutation.mutateAsync({ reelUrlOrCode: cleaned })
      markDirty()
      setReels((prev) => {
        const copy = [...prev]
        if (!copy[slotIdx]) return prev
        copy[slotIdx] = {
          ...copy[slotIdx],
          shortcode: reel.shortcode,
          url: reel.url,
          thumbnailUrl: reel.thumbnailUrl,
          caption: reel.caption,
          topic: reel.topic,
          postedAt: reel.postedAt.slice(0, 10),
          views: reel.views,
          viewsEstimated: reel.viewsEstimated,
          likes: reel.likes,
          comments: reel.comments,
          shares: reel.shares ?? copy[slotIdx].shares,
          saves: reel.saves ?? copy[slotIdx].saves,
          durationSec: reel.durationSec,
          hookType: reel.hookType ?? copy[slotIdx].hookType,
          hasSubtitles: reel.hasSubtitles ?? copy[slotIdx].hasSubtitles,
          hasCta: reel.hasCta ?? copy[slotIdx].hasCta,
        }
        return copy
      })
    } catch {
      // Error already handled by mutation onError
    } finally {
      setScrapingReelIndex(null)
    }
  }

  const triggerSave = () => {
    if (!hydratedId) return
    saveMutation.mutate({
      id: auditId,
      language,
      summaryOpening,
      verdictLine,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      prospect: {
        ...prospect,
        linkInBioUrl: prospect.linkInBioUrl || null,
      },
      reels,
      profileChecks,
      categoryScores: syncedCategoryScores,
      findings,
      competitors,
      unmeasuredItems,
    })
  }

  // Debounced autosave when user edits any step
  useEffect(() => {
    if (!hydratedId || !isDirtyRef.current) return
    const timer = setTimeout(() => {
      triggerSave()
    }, 1800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    language,
    summaryOpening,
    verdictLine,
    expiresAt,
    prospect,
    reels,
    profileChecks,
    syncedCategoryScores,
    findings,
    competitors,
    unmeasuredItems,
  ])

  const markDirty = () => {
    isDirtyRef.current = true
    setSaveStatus('idle')
  }

  if (detailQuery.isLoading || !detailQuery.data || !hydratedId) {
    return (
      <div
        dir={t.dir}
        className={`apx-audit ${apxFontVariables} ${t.fontClass} min-h-[75vh] bg-[#080608] text-[#E2D9F3] flex flex-col items-center justify-center gap-3`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
        <span className="text-sm font-bold text-[#E2D9F3]/80">{t.loadingAudits}</span>
      </div>
    )
  }

  const serverAudit = detailQuery.data.audit

  const liveReportData: PublicAuditReportData = {
    id: serverAudit.id,
    shareToken: serverAudit.shareToken,
    language,
    overallScore: liveOverallScore,
    summaryOpening,
    verdictLine,
    publishedAt: serverAudit.publishedAt,
    prospect: {
      handle: prospect.handle,
      displayName: prospect.displayName,
      niche: prospect.niche,
      followers: prospect.followers,
      followingCount: prospect.followingCount,
      postsCount: prospect.postsCount,
      profileUrl: prospect.profileUrl,
      linkInBioUrl: prospect.linkInBioUrl,
      avatarUrl: prospect.avatarUrl,
      bio: prospect.bio,
      bioLinks: prospect.bioLinks,
    },
    profileChecks,
    categoryScores: syncedCategoryScores,
    findings,
    competitors,
    unmeasuredItems,
    metrics: liveMetrics,
    settings: detailQuery.data.settings,
  }

  const handleCsvImport = () => {
    const imported = parseReelsCsvOrPaste(csvText)
    if (imported.length > 0) {
      markDirty()
      setReels((prev) => [
        ...prev,
        ...imported.map((r, i) => ({
          postedAt:
            typeof r.postedAt === 'string'
              ? r.postedAt
              : new Date(r.postedAt).toISOString().slice(0, 10),
          views: r.views,
          likes: r.likes,
          comments: r.comments,
          durationSec: r.durationSec ?? null,
          topic: r.topic ?? '',
          hookType: r.hookType ?? 'WEAK',
          hasSubtitles: r.hasSubtitles ?? true,
          hasCta: r.hasCta ?? false,
          isRepost: r.isRepost ?? false,
          demandSignalsCount: r.demandSignalsCount ?? 0,
          editorNotes: r.editorNotes ?? '',
          url: r.url ?? null,
          position: prev.length + i + 1,
        })),
      ])
    }
    setCsvText('')
    setShowCsvModal(false)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/a/${serverAudit.shareToken}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handlePublish = async () => {
    setPublishError(null)
    await saveMutation.mutateAsync({
      id: auditId,
      language,
      summaryOpening,
      verdictLine,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      prospect: {
        ...prospect,
        linkInBioUrl: prospect.linkInBioUrl || null,
      },
      reels,
      profileChecks,
      categoryScores: syncedCategoryScores,
      findings,
      competitors,
      unmeasuredItems,
    })
    publishMutation.mutate({
      id: auditId,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
  }

  const missingEvidenceCategories = syncedCategoryScores.filter(
    (c) => !c.evidence || c.evidence.trim().length < 3
  )

  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  return (
    <div
      dir={t.dir}
      className={`apx-audit ${apxFontVariables} ${t.fontClass} min-h-screen bg-[#080608] text-[#E2D9F3] flex flex-col`}
    >
      {/* ====================================================================
          TOP STUDIO HEADER (100% Pure Single-Language + Layout Switcher)
         ==================================================================== */}
      <header className="sticky top-0 z-30 bg-[#080608]/95 backdrop-blur-xl border-b border-[#8B5CF6]/20 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/30 text-[#E2D9F3] transition-all"
            >
              <BackIcon className="w-4 h-4 text-[#A78BFA]" />
              <span>{t.backToAudits}</span>
            </button>
          ) : (
            <Link
              href="/admin/audits"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/30 text-[#E2D9F3] transition-all"
            >
              <BackIcon className="w-4 h-4 text-[#A78BFA]" />
              <span>{t.backToAudits}</span>
            </Link>
          )}

          <div className="h-5 w-px bg-[#8B5CF6]/20 hidden sm:block" />
          {/* Prospect Profile Picture in Studio Header (Replaces APX Logo) */}
          {prospect.avatarUrl ? (
            <img
              src={prospect.avatarUrl}
              alt={prospect.displayName}
              className="w-10 h-10 rounded-2xl object-cover border-2 border-[#8B5CF6] shadow-[0_0_16px_rgba(139,92,246,0.35)] shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-[#1A0F2E] border border-[#8B5CF6]/45 flex items-center justify-center text-sm font-bold text-[#A78BFA] shrink-0">
              {(prospect.displayName || prospect.handle || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{prospect.displayName}</span>
              <span
                dir="ltr"
                className="font-en text-xs font-semibold text-[#A78BFA] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-lg"
              >
                @{prospect.handle}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (serverAudit.status === 'PUBLISHED') {
                    unpublishMutation.mutate({ id: auditId })
                  } else {
                    handlePublish()
                  }
                }}
                disabled={publishMutation.isLoading || unpublishMutation.isLoading}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                  serverAudit.status === 'PUBLISHED'
                    ? 'bg-[#4BA37A]/15 text-[#4BA37A] border-[#4BA37A]/40 hover:bg-[#4BA37A]/25'
                    : 'bg-[#D49A3D]/15 text-[#FBBF24] border-[#D49A3D]/40 hover:bg-[#D49A3D]/25'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    serverAudit.status === 'PUBLISHED' ? 'bg-[#4BA37A]' : 'bg-[#FBBF24]'
                  }`}
                />
                {serverAudit.status === 'PUBLISHED'
                  ? isRtl
                    ? 'أونلاين (منشور)'
                    : 'Online (Live)'
                  : isRtl
                    ? 'أوفلاين (مسودة)'
                    : 'Offline (Draft)'}
              </button>
            </div>
          </div>
        </div>

        {/* Separate Studio vs Preview Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#120B1E] p-1 rounded-xl border border-[#8B5CF6]/25 text-xs">
          {(
            [
              { key: 'editor', label: t.modeEditor, icon: null },
              { key: 'preview', label: t.modePreview, icon: Eye },
            ] as const
          ).map((m) => {
            const active = layoutMode === m.key
            const Icon = m.icon
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setLayoutMode(m.key)}
                className={`relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-colors ${
                  active ? 'text-white' : 'text-[#E2D9F3]/65 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="wizardModeActive"
                    transition={SPRING_TRANSITION}
                    className="absolute inset-0 rounded-lg bg-[#8B5CF6] shadow-md shadow-[#8B5CF6]/30"
                  />
                )}
                {Icon && <Icon className="w-3.5 h-3.5 relative z-10" />}
                <span className="relative z-10">{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Save, Language Switcher, Copy Link & Publish */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleToggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/30 text-[#E2D9F3] font-bold transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>{t.switchLangLabel}</span>
          </button>

          <button
            type="button"
            onClick={triggerSave}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/30 text-[#E2D9F3] font-bold transition-all"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B5CF6]" />
                <span>{t.savingBtn}</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4BA37A]" />
                <span>{t.savedBtn}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>{t.saveBtn}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/30 text-[#E2D9F3] font-bold transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4BA37A]" />
                <span>{t.copiedLinkBtn}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>{t.copyLinkBtn}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishMutation.isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-bold shadow-lg shadow-[#8B5CF6]/25 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {serverAudit.status === 'PUBLISHED' ? t.updatePublishedBtn : t.publishNowBtn}
            </span>
          </button>

          <Link
            href={`/a/${serverAudit.shareToken}?preview=1`}
            target="_blank"
            className="p-2 rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/30 text-[#E2D9F3]"
            title={t.previewReportBtn}
          >
            <ExternalLink className="w-4 h-4 text-[#A78BFA]" />
          </Link>
        </div>
      </header>

      {/* ====================================================================
          SECTION PILLS BAR + LIVE SCORE BADGE (Only shown in Studio mode)
         ==================================================================== */}
      {layoutMode === 'editor' && (
        <div className="bg-[#120B1E] border-b border-[#8B5CF6]/20 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {wizardTabs.map((tab) => {
              const active = step === tab.num
              return (
                <button
                  key={tab.num}
                  type="button"
                  onClick={() => setStep(tab.num)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    active ? 'text-white' : 'text-[#E2D9F3]/70 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="wizardTabActive"
                      transition={SPRING_TRANSITION}
                      className="absolute inset-0 rounded-xl bg-[#8B5CF6] shadow-md shadow-[#8B5CF6]/25"
                    />
                  )}
                  <span className="relative z-10">{tab.title}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/45 flex items-center gap-2">
              <span className="text-xs text-[#E2D9F3]/80">{t.overallScoreLabel}:</span>
              <span className="apx-serif-numeral text-lg font-bold text-white">
                {liveOverallScore}/100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MAIN WORKSPACE (Separate Studio or Separate Preview)
         ==================================================================== */}
      <div className="flex-1 flex">
        {/* EDITOR PANE (Studio Alone) */}
        {layoutMode === 'editor' && (
          <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-sm">
            {publishError && (
              <div className="p-4 rounded-2xl bg-[#C95D63]/15 border border-[#C95D63]/40 text-[#F87171] font-bold flex items-center justify-between">
                <span>{publishError}</span>
                <button
                  type="button"
                  onClick={() => setPublishError(null)}
                  className="text-xs underline"
                >
                  {t.closeBtn}
                </button>
              </div>
            )}

            {/* ============================================================
                TAB 1: PROSPECT INFO & EXECUTIVE INTRO
               ============================================================ */}
            {(step === 0 || step === 1) && (
              <div className="apx-bento-card p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8B5CF6]/20 pb-3">
                  <div className="flex items-center gap-3">
                    {prospect.avatarUrl && (
                      <img
                        src={prospect.avatarUrl}
                        alt={prospect.displayName}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#8B5CF6]/45 bg-[#080608]"
                      />
                    )}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">{t.step1}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#E2D9F3]/70">
                      {t.reportLangLabel}:
                    </span>
                    <select
                      value={language}
                      onChange={(e) => {
                        markDirty()
                        setLanguage(e.target.value as AuditLanguage)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/35 text-xs font-bold text-white"
                    >
                      <option value="ar">{t.langArOption}</option>
                      <option value="en">{t.langEnOption}</option>
                    </select>
                  </div>
                </div>

                {/* One-Click Instagram Account Profile Auto-Scraper Bar */}
                <div className="p-4 sm:p-5 rounded-3xl bg-[#110B1B]/90 border border-[#8B5CF6]/35 space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-[#A78BFA] mb-1.5">
                        {t.handleLabel}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={prospect.handle}
                        onChange={(e) => {
                          markDirty()
                          setProspect({ ...prospect, handle: e.target.value.replace(/^@/, '') })
                        }}
                        placeholder="@username / https://instagram.com/..."
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/35 text-white font-en text-xs sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!prospect.handle.trim() || scrapeAccountMutation.isLoading}
                      onClick={() => {
                        setScraperFeedback(null)
                        scrapeAccountMutation.mutate({
                          handleOrUrl: prospect.handle.trim(),
                          reelsCount: 18,
                        })
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#8B5CF6]/25 transition-all disabled:opacity-50 apx-btn-glow"
                    >
                      {scrapeAccountMutation.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.scrapingAccountBtn}</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>{t.rescrapeProfileAndReelsBtn}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Animated Account Profile Preview Card */}
                  {prospect.avatarUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#080608]/90 border border-[#8B5CF6]/30"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={prospect.avatarUrl}
                          alt={prospect.displayName}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-[#8B5CF6] shadow-[0_0_18px_rgba(139,92,246,0.35)] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {prospect.displayName}
                            </span>
                            <span
                              dir="ltr"
                              className="text-xs font-en font-bold text-[#A78BFA] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-lg"
                            >
                              @{prospect.handle}
                            </span>
                          </div>
                          {prospect.bio && (
                            <p className="text-xs text-[#E2D9F3]/70 line-clamp-1 mt-0.5">
                              {prospect.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="px-3 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-center">
                          <span className="block text-[10px] text-[#E2D9F3]/55">
                            {t.followersLabel}
                          </span>
                          <strong className="font-en text-white">
                            {prospect.followers.toLocaleString('en-US')}
                          </strong>
                        </div>
                        {prospect.followingCount !== null && (
                          <div className="px-3 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-center">
                            <span className="block text-[10px] text-[#E2D9F3]/55">
                              {t.followingLabel}
                            </span>
                            <strong className="font-en text-white">
                              {prospect.followingCount.toLocaleString('en-US')}
                            </strong>
                          </div>
                        )}
                        {prospect.postsCount !== null && (
                          <div className="px-3 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-center">
                            <span className="block text-[10px] text-[#E2D9F3]/55">
                              {t.postsCountLabel}
                            </span>
                            <strong className="font-en text-white">
                              {prospect.postsCount.toLocaleString('en-US')}
                            </strong>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {scraperFeedback && (
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold border ${
                        scraperFeedback.type === 'success'
                          ? 'bg-[#4BA37A]/15 text-[#4BA37A] border-[#4BA37A]/35'
                          : 'bg-[#C95D63]/15 text-[#C95D63] border-[#C95D63]/35'
                      }`}
                    >
                      {scraperFeedback.message}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                      {t.displayNameLabel}
                    </label>
                    <input
                      type="text"
                      value={prospect.displayName}
                      onChange={(e) => {
                        markDirty()
                        setProspect({ ...prospect, displayName: e.target.value })
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                      {t.nicheLabel}
                    </label>
                    <input
                      type="text"
                      value={prospect.niche}
                      onChange={(e) => {
                        markDirty()
                        setProspect({ ...prospect, niche: e.target.value })
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                      {t.followersLabel}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      value={formatCommaInput(prospect.followers)}
                      onChange={(e) => {
                        markDirty()
                        setProspect({
                          ...prospect,
                          followers: parseCommaInput(e.target.value),
                        })
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                        {t.followingLabel}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatCommaInput(prospect.followingCount)}
                        onChange={(e) => {
                          markDirty()
                          const val = e.target.value.trim()
                          setProspect({
                            ...prospect,
                            followingCount: val ? parseCommaInput(val) : null,
                          })
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                        {t.postsCountLabel}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatCommaInput(prospect.postsCount)}
                        onChange={(e) => {
                          markDirty()
                          const val = e.target.value.trim()
                          setProspect({
                            ...prospect,
                            postsCount: val ? parseCommaInput(val) : null,
                          })
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar URL, Profile URL, and Link in Bio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                      {t.avatarUrlLabel}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={prospect.avatarUrl || ''}
                      onChange={(e) => {
                        markDirty()
                        setProspect({ ...prospect, avatarUrl: e.target.value || null })
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                      {t.profileUrlLabel}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={prospect.profileUrl}
                      onChange={(e) => {
                        markDirty()
                        setProspect({ ...prospect, profileUrl: e.target.value })
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                      {t.bioLinkLabel}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={prospect.linkInBioUrl}
                      onChange={(e) => {
                        markDirty()
                        setProspect({ ...prospect, linkInBioUrl: e.target.value })
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en text-xs"
                    />
                  </div>
                </div>

                {/* Bio Text & Bio Links */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                      {t.bioTextLabel}
                    </label>
                    <textarea
                      rows={3}
                      value={prospect.bio}
                      onChange={(e) => {
                        markDirty()
                        setProspect({ ...prospect, bio: e.target.value })
                      }}
                      className="w-full h-24 max-h-24 overflow-y-auto resize-none apx-scroll-box px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] focus:outline-none text-white leading-relaxed text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#E2D9F3]/80">
                        {t.bioLinksLabel} ({prospect.bioLinks.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          markDirty()
                          setProspect({
                            ...prospect,
                            bioLinks: [...prospect.bioLinks, { title: '', url: '' }],
                          })
                        }}
                        className="text-xs font-bold text-[#A78BFA] hover:text-white inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addBioLinkBtn}</span>
                      </button>
                    </div>
                    <div className="space-y-2 max-h-28 overflow-y-auto pe-1">
                      {prospect.bioLinks.map((lnk, lIdx) => (
                        <div key={lIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={lnk.title}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...prospect.bioLinks]
                              copy[lIdx] = { ...copy[lIdx], title: e.target.value }
                              setProspect({ ...prospect, bioLinks: copy })
                            }}
                            placeholder={isRtl ? 'عنوان الرابط' : 'Link title'}
                            className="w-1/3 px-2.5 py-1.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white text-xs"
                          />
                          <input
                            type="text"
                            dir="ltr"
                            value={lnk.url}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...prospect.bioLinks]
                              copy[lIdx] = { ...copy[lIdx], url: e.target.value }
                              setProspect({ ...prospect, bioLinks: copy })
                            }}
                            placeholder="https://..."
                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              markDirty()
                              setProspect({
                                ...prospect,
                                bioLinks: prospect.bioLinks.filter((_, i) => i !== lIdx),
                              })
                            }}
                            className="text-[#C95D63] hover:text-[#F87171] p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#A78BFA] mb-1.5">
                      {t.verdictLabel}
                    </label>
                    <textarea
                      rows={3}
                      value={verdictLine}
                      onChange={(e) => {
                        markDirty()
                        setVerdictLine(e.target.value)
                      }}
                      className="w-full h-24 max-h-24 overflow-y-auto resize-none apx-scroll-box px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] focus:outline-none text-white leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/85 mb-1.5">
                      {t.workingParagraphLabel}
                    </label>
                    <textarea
                      rows={3}
                      value={summaryOpening}
                      onChange={(e) => {
                        markDirty()
                        setSummaryOpening(e.target.value)
                      }}
                      className="w-full h-24 max-h-24 overflow-y-auto resize-none apx-scroll-box px-3.5 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] focus:outline-none text-white leading-relaxed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/60 mb-1.5">
                    {t.privateNotesLabel}
                  </label>
                  <input
                    type="text"
                    value={prospect.notes}
                    onChange={(e) => {
                      markDirty()
                      setProspect({ ...prospect, notes: e.target.value })
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080608]/60 border border-[#E2D9F3]/15 text-[#E2D9F3]/80"
                  />
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 2: FULL ACCOUNT REELS BACKEND ANALYSIS & TOP 3/4/5 RANKER
               ============================================================ */}
            {(step === 0 || step === 2) && (
              <div className="apx-bento-card p-5 sm:p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#8B5CF6]/20 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {t.step2} ({reels.length})
                    </h2>
                    <p className="text-xs text-[#E2D9F3]/65 mt-0.5">
                      {isRtl
                        ? 'يقوم الباك إند بسحب وتحليل فيديوهات الحساب بالكامل، قياس المؤشرات العامة على آخر 10 فيديوهات تلقائياً، وتصنيف أفضل 3 أو 4 أو 5 فيديوهات بالترتيب.'
                        : 'Backend automatically scrapes and analyzes all account reels, computes baseline telemetry on the latest 10 reels, and ranks the Top 3, Top 4, or Top 5 reels in order.'}
                    </p>
                  </div>

                  {/* Reels Display Mode Selector (Top 3 / Top 4 / Top 5 / Last 10 / All) */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#110B1B] p-1.5 rounded-2xl border border-[#8B5CF6]/30 text-xs">
                    <span className="px-2 font-bold text-[#A78BFA]">
                      {isRtl ? 'التصنيف المعروض في التقرير:' : 'Report Display Filter:'}
                    </span>
                    {(
                      [
                        {
                          val: 'TOP_3',
                          labelAr: 'أفضل 3 فيديوهات (#1-#3)',
                          labelEn: 'Top 3 (#1-#3)',
                        },
                        {
                          val: 'TOP_4',
                          labelAr: 'أفضل 4 فيديوهات (#1-#4)',
                          labelEn: 'Top 4 (#1-#4)',
                        },
                        {
                          val: 'TOP_5',
                          labelAr: 'أفضل 5 فيديوهات (#1-#5)',
                          labelEn: 'Top 5 (#1-#5)',
                        },
                        {
                          val: 'LAST_10',
                          labelAr: 'آخر 10 فيديوهات',
                          labelEn: 'Last 10 Reels',
                        },
                        {
                          val: 'ALL',
                          labelAr: 'كل الفيديوهات',
                          labelEn: 'All Reels',
                        },
                      ] as const
                    ).map((opt) => {
                      const currentMode =
                        detailQuery.data?.settings?.reelsDisplayMode || 'TOP_5'
                      const isActive = currentMode === opt.val
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            if (!detailQuery.data?.settings) return
                            saveSettingsMutation.mutate({
                              ...detailQuery.data.settings,
                              reelsDisplayMode: opt.val,
                            })
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                            isActive
                              ? 'bg-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/40'
                              : 'text-[#E2D9F3]/65 hover:text-white'
                          }`}
                        >
                          {isRtl ? opt.labelAr : opt.labelEn}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Full Account Auto-Analyzer & Ranking Toolbar */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#110B1B]/90 border border-[#8B5CF6]/35">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center text-[#A78BFA] shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {isRtl
                          ? `تحليل فيديوهات الحساب بالكامل (@${prospect.handle || 'account'}) وتصنيف الأفضل تلقائياً`
                          : `Full Account Reels Analysis (@${prospect.handle || 'account'}) & Auto-Ranking`}
                      </p>
                      <p className="text-[11px] text-[#E2D9F3]/65">
                        {isRtl
                          ? 'يتم حساب القياس المرجعي على آخر 10 فيديوهات تلقائياً، وترتيب الفيديوهات من #1 للأعلى تأثيراً.'
                          : 'Baseline telemetry is computed on the latest 10 reels automatically, while ranking #1+ by impact.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (reels.length <= 1) return
                        markDirty()
                        const sorted = [...reels]
                          .sort((a, b) => {
                            const scoreA =
                              a.views +
                              a.likes * 15 +
                              a.comments * 40 +
                              (a.shares || 0) * 50 +
                              (a.saves || 0) * 45
                            const scoreB =
                              b.views +
                              b.likes * 15 +
                              b.comments * 40 +
                              (b.shares || 0) * 50 +
                              (b.saves || 0) * 45
                            return scoreB - scoreA
                          })
                          .map((item, i) => ({ ...item, position: i + 1 }))
                        setReels(sorted)
                      }}
                      className="px-3.5 py-2.5 rounded-2xl bg-[#1A0F2E] hover:bg-[#251640] border border-[#8B5CF6]/35 text-[#E2D9F3] font-bold text-xs transition-all"
                    >
                      {isRtl
                        ? 'ترتيب القائمة حسب الأفضل أداءً (#1 → الأقل)'
                        : 'Sort by Top Performance (#1 → Lowest)'}
                    </button>

                    <button
                      type="button"
                      disabled={!prospect.handle.trim() || scrapeAccountMutation.isLoading}
                      onClick={() => {
                        setScraperFeedback(null)
                        scrapeAccountMutation.mutate({
                          handleOrUrl: prospect.handle.trim(),
                          reelsCount: 18,
                        })
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 apx-btn-glow"
                    >
                      {scrapeAccountMutation.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.scrapingAccountBtn}</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>
                            {isRtl
                              ? 'تحليل وسحب فيديوهات الحساب بالكامل'
                              : 'Analyze & Scrape All Account Reels'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {reels.map((r, idx) => (
                    <div
                      key={r.id || r.shortcode || idx}
                      className="p-4 sm:p-5 rounded-2xl bg-[#080608]/90 border border-[#8B5CF6]/25 hover:border-[#8B5CF6]/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Visual Reel 9:16 Thumbnail Preview */}
                        <div className="w-full md:w-36 shrink-0 flex flex-col gap-2">
                          <div className="relative aspect-[9/16] w-28 md:w-36 mx-auto rounded-2xl overflow-hidden bg-[#120B1E] border border-[#8B5CF6]/35 flex items-center justify-center">
                            {r.thumbnailUrl ? (
                              <img
                                src={r.thumbnailUrl}
                                alt={`${t.reelNum} ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-[#E2D9F3]/40">
                                {t.reelNum} {idx + 1}
                              </span>
                            )}
                            <span className="absolute top-2 start-2 px-2 py-0.5 rounded-lg bg-black/80 border border-[#8B5CF6]/40 text-xs font-en font-bold text-white">
                              #{idx + 1}
                            </span>
                            {r.durationSec ? (
                              <span className="absolute bottom-2 end-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-en text-[#E2D9F3]">
                                {r.durationSec}s
                              </span>
                            ) : null}
                          </div>

                          {r.url && (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/35 text-[11px] font-bold text-[#A78BFA] transition-all"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{t.watchOnIgBtn}</span>
                            </a>
                          )}
                        </div>

                        {/* Reel Details, Metrics, Pros, Cons & Notes */}
                        <div className="flex-1 space-y-3.5 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 text-[#A78BFA] font-bold text-xs">
                                {t.reelNum} {idx + 1}
                              </span>
                              {/* Interactive toggle chips */}
                              <button
                                type="button"
                                onClick={() => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = { ...copy[idx], hasSubtitles: !r.hasSubtitles }
                                  setReels(copy)
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  r.hasSubtitles
                                    ? 'bg-[#4BA37A]/20 text-[#4BA37A] border-[#4BA37A]/40'
                                    : 'bg-[#120B1E] text-[#E2D9F3]/45 border-[#E2D9F3]/10'
                                }`}
                              >
                                {r.hasSubtitles ? t.hasSubtitlesYes : t.hasSubtitlesNo}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = { ...copy[idx], hasCta: !r.hasCta }
                                  setReels(copy)
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  r.hasCta
                                    ? 'bg-[#8B5CF6]/25 text-white border-[#8B5CF6]/50'
                                    : 'bg-[#120B1E] text-[#E2D9F3]/45 border-[#E2D9F3]/10'
                                }`}
                              >
                                {r.hasCta ? t.hasCtaYes : t.hasCtaNo}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = { ...copy[idx], isRepost: !r.isRepost }
                                  setReels(copy)
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  r.isRepost
                                    ? 'bg-[#C95D63]/20 text-[#C95D63] border-[#C95D63]/40'
                                    : 'bg-[#120B1E] text-[#E2D9F3]/45 border-[#E2D9F3]/10'
                                }`}
                              >
                                {r.isRepost ? t.isRepostYes : t.isRepostNo}
                              </button>

                              {r.viewsEstimated && (
                                <span className="px-2 py-0.5 rounded-lg bg-[#D49A3D]/15 text-[#FBBF24] border border-[#D49A3D]/35 text-[10px] font-bold">
                                  {t.viewsEstimatedHint}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                markDirty()
                                setReels((prev) => prev.filter((_, i) => i !== idx))
                              }}
                              className="text-[#C95D63] hover:text-[#F87171] inline-flex items-center gap-1 text-xs font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.deleteBtn}</span>
                            </button>
                          </div>

                          {/* Caption + Reel URL */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] text-[#E2D9F3]/65 mb-1 font-bold">
                                {t.reelCaptionLabel}
                              </label>
                              <input
                                type="text"
                                value={r.caption ?? r.topic ?? ''}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = {
                                    ...copy[idx],
                                    caption: e.target.value,
                                    topic: e.target.value.slice(0, 90),
                                  }
                                  setReels(copy)
                                }}
                                className="w-full px-3 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#E2D9F3]/65 mb-1 font-bold">
                                {t.reelUrlLabel}
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={r.url || ''}
                                  onChange={(e) => {
                                    markDirty()
                                    const copy = [...reels]
                                    copy[idx] = { ...copy[idx], url: e.target.value || null }
                                    setReels(copy)
                                  }}
                                  placeholder="https://www.instagram.com/reel/..."
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en text-xs"
                                />
                                <button
                                  type="button"
                                  disabled={!r.url?.trim() || scrapingReelIndex === idx}
                                  onClick={() => handleScrapeReelAtSlot(idx, r.url || '')}
                                  title={t.scrapeSingleReelBtn}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#8B5CF6]/25 hover:bg-[#8B5CF6]/40 border border-[#8B5CF6]/45 text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0 disabled:opacity-40 transition-all"
                                >
                                  {scrapingReelIndex === idx ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A78BFA]" />
                                  ) : (
                                    <RefreshCw className="w-3.5 h-3.5 text-[#A78BFA]" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Metrics Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            <div>
                              <label className="block text-[11px] text-[#E2D9F3]/60 mb-1">
                                {t.postedDateLabel}
                              </label>
                              <input
                                type="date"
                                dir="ltr"
                                value={r.postedAt.slice(0, 10)}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = { ...copy[idx], postedAt: e.target.value }
                                  setReels(copy)
                                }}
                                className="w-full px-2 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#A78BFA] font-bold mb-1">
                                {t.viewsLabel}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                dir="ltr"
                                value={formatCommaInput(r.views)}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = {
                                    ...copy[idx],
                                    views: parseCommaInput(e.target.value),
                                    viewsEstimated: false,
                                  }
                                  setReels(copy)
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/45 text-white font-en font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#E2D9F3]/60 mb-1">
                                {t.likesLabel}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                dir="ltr"
                                value={formatCommaInput(r.likes)}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = {
                                    ...copy[idx],
                                    likes: parseCommaInput(e.target.value),
                                  }
                                  setReels(copy)
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#E2D9F3]/60 mb-1">
                                {t.commentsLabel}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                dir="ltr"
                                value={formatCommaInput(r.comments)}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = {
                                    ...copy[idx],
                                    comments: parseCommaInput(e.target.value),
                                  }
                                  setReels(copy)
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#E2D9F3]/60 mb-1">
                                {t.sharesLabel}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                dir="ltr"
                                value={formatCommaInput(r.shares)}
                                onChange={(e) => {
                                  markDirty()
                                  const val = e.target.value.trim()
                                  const copy = [...reels]
                                  copy[idx] = {
                                    ...copy[idx],
                                    shares: val ? parseCommaInput(val) : null,
                                  }
                                  setReels(copy)
                                }}
                                placeholder="—"
                                className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#E2D9F3]/60 mb-1">
                                {t.savesLabel}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                dir="ltr"
                                value={formatCommaInput(r.saves)}
                                onChange={(e) => {
                                  markDirty()
                                  const val = e.target.value.trim()
                                  const copy = [...reels]
                                  copy[idx] = {
                                    ...copy[idx],
                                    saves: val ? parseCommaInput(val) : null,
                                  }
                                  setReels(copy)
                                }}
                                placeholder="—"
                                className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#E2D9F3]/60 mb-1">
                                {t.demandCommentsLabel}
                              </label>
                              <input
                                type="number"
                                min={0}
                                dir="ltr"
                                value={r.demandSignalsCount}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = {
                                    ...copy[idx],
                                    demandSignalsCount: Math.max(
                                      0,
                                      parseInt(e.target.value, 10) || 0
                                    ),
                                  }
                                  setReels(copy)
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-[#4BA37A] font-en font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#E2D9F3]/60 mb-1">
                                {t.hookTypeLabel}
                              </label>
                              <select
                                value={r.hookType || 'WEAK'}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = {
                                    ...copy[idx],
                                    hookType: e.target.value as AuditHookType,
                                  }
                                  setReels(copy)
                                }}
                                className="w-full px-2 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white text-xs"
                              >
                                <option value="QUESTION">{dict.hookTypes.QUESTION}</option>
                                <option value="BOLD_CLAIM">{dict.hookTypes.BOLD_CLAIM}</option>
                                <option value="STORY">{dict.hookTypes.STORY}</option>
                                <option value="PATTERN_INTERRUPT">
                                  {dict.hookTypes.PATTERN_INTERRUPT}
                                </option>
                                <option value="WEAK">{dict.hookTypes.WEAK}</option>
                                <option value="OTHER">{dict.hookTypes.OTHER}</option>
                              </select>
                            </div>
                          </div>

                          {/* Per-Reel Pros (المميزات) & Cons (العيوب) — Standard Fixed-Height Scrollable Boxes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-[#E2D9F3]/85 mb-1">
                                ✓ {t.reelProsLabel}
                              </label>
                              <textarea
                                rows={3}
                                value={r.pros || ''}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = { ...copy[idx], pros: e.target.value }
                                  setReels(copy)
                                }}
                                placeholder={t.reelProsPlaceholder}
                                className="w-full h-20 max-h-20 overflow-y-auto resize-none apx-scroll-box px-3 py-2 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] focus:outline-none text-white text-xs leading-relaxed"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-[#E2D9F3]/85 mb-1">
                                ✕ {t.reelConsLabel}
                              </label>
                              <textarea
                                rows={3}
                                value={r.cons || ''}
                                onChange={(e) => {
                                  markDirty()
                                  const copy = [...reels]
                                  copy[idx] = { ...copy[idx], cons: e.target.value }
                                  setReels(copy)
                                }}
                                placeholder={t.reelConsPlaceholder}
                                className="w-full h-20 max-h-20 overflow-y-auto resize-none apx-scroll-box px-3 py-2 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] focus:outline-none text-white text-xs leading-relaxed"
                              />
                            </div>
                          </div>

                          {/* Timestamped Editing Notes */}
                          <div>
                            <label className="block text-[11px] text-[#E2D9F3]/60 mb-1">
                              {t.editorNotesLabel}
                            </label>
                            <input
                              type="text"
                              value={r.editorNotes}
                              onChange={(e) => {
                                markDirty()
                                const copy = [...reels]
                                copy[idx] = { ...copy[idx], editorNotes: e.target.value }
                                setReels(copy)
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 3: 9-CATEGORY SCORECARD (Single-Card Slider Editor)
               ============================================================ */}
            {(step === 0 || step === 3) && (
              <div className="apx-bento-card p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8B5CF6]/20 pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {t.step3} ({liveOverallScore}/100)
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEditorPillarIdx(
                          (prev) =>
                            (prev - 1 + syncedCategoryScores.length) %
                            syncedCategoryScores.length
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#120B1E] hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-xs font-bold text-white transition-all"
                    >
                      {isRtl ? 'السابق' : 'Prev'}
                    </button>
                    <span className="text-xs font-en font-bold text-[#A78BFA] px-2">
                      {activeEditorPillarIdx + 1} / {syncedCategoryScores.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEditorPillarIdx(
                          (prev) => (prev + 1) % syncedCategoryScores.length
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white transition-all"
                    >
                      {isRtl ? 'التالي' : 'Next'}
                    </button>
                  </div>
                </div>

                {/* Horizontal Pillar Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
                  {syncedCategoryScores.map((cat, idx) => {
                    const isSelected = activeEditorPillarIdx === idx
                    const missingEv = !cat.evidence || cat.evidence.trim().length < 3
                    return (
                      <button
                        key={cat.categoryKey}
                        type="button"
                        onClick={() => setActiveEditorPillarIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border shrink-0 ${
                          isSelected
                            ? 'bg-[#8B5CF6] text-white border-[#A78BFA] shadow-md shadow-[#8B5CF6]/25'
                            : 'bg-[#080608]/80 text-[#E2D9F3]/70 border-[#8B5CF6]/20 hover:border-[#8B5CF6]/45 hover:text-white'
                        }`}
                      >
                        <span className="font-en">{idx + 1}.</span>
                        <span>
                          {(dict.categories[cat.categoryKey] || cat.categoryKey)
                            .split('(')[0]
                            .trim()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-black/40 font-en text-[11px]">
                          {cat.score}/10
                        </span>
                        {missingEv && (
                          <span className="w-2 h-2 rounded-full bg-[#C95D63]" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Single Active Pillar Editor Card */}
                {(() => {
                  const idx = Math.max(
                    0,
                    Math.min(syncedCategoryScores.length - 1, activeEditorPillarIdx)
                  )
                  const cat = syncedCategoryScores[idx]
                  if (!cat) return null
                  const isAuto = AUTO_SUGGESTED_CATEGORIES.includes(cat.categoryKey)
                  const missingEv = !cat.evidence || cat.evidence.trim().length < 3

                  return (
                    <div
                      key={cat.categoryKey}
                      className="p-4 sm:p-5 rounded-2xl bg-[#080608]/85 border border-[#8B5CF6]/30 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center font-en text-xs font-bold text-[#A78BFA]">
                            0{idx + 1}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-white">
                            {dict.categories[cat.categoryKey] || cat.categoryKey}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-en bg-[#140D22] text-[#A78BFA] border border-[#8B5CF6]/30">
                            {t.weightBadge}: {cat.weight}x
                          </span>
                          {isAuto && (
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#8B5CF6]/20 text-[#A78BFA]">
                              {t.autoSuggestedBadge}: {cat.autoSuggestedScore}/10
                            </span>
                          )}
                          {isAuto && cat.isOverridden && (
                            <button
                              type="button"
                              onClick={() => {
                                markDirty()
                                const copy = [...categoryScores]
                                copy[idx] = {
                                  ...copy[idx],
                                  isOverridden: false,
                                  score: cat.autoSuggestedScore ?? 5,
                                }
                                setCategoryScores(copy)
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#8B5CF6]/20 text-[#A78BFA] hover:underline"
                            >
                              <RotateCcw className="w-3 h-3" />
                              {t.resetAutoBtn}
                            </button>
                          )}
                          {missingEv && (
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#C95D63]/20 text-[#C95D63]">
                              {t.evidenceRequiredBadge}
                            </span>
                          )}
                        </div>

                        {/* Interactive Modern Score Slider + Quick Score Pills */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                          <div className="flex items-center gap-1 bg-[#120B1E] p-1 rounded-2xl border border-[#8B5CF6]/30" dir="ltr">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                              const isSelectedScore = cat.score === num
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => {
                                    markDirty()
                                    const copy = [...categoryScores]
                                    copy[idx] = {
                                      ...copy[idx],
                                      score: num,
                                      isOverridden: isAuto && num !== cat.autoSuggestedScore,
                                    }
                                    setCategoryScores(copy)
                                  }}
                                  className={`w-7 h-7 rounded-xl font-en text-xs font-bold transition-all ${
                                    isSelectedScore
                                      ? 'bg-[#8B5CF6] text-white shadow-[0_0_12px_rgba(139,92,246,0.55)] scale-105'
                                      : 'text-[#E2D9F3]/60 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  {num}
                                </button>
                              )
                            })}
                          </div>
                          <span className="apx-serif-numeral text-xl font-bold px-3.5 py-1.5 rounded-2xl bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/45 text-center shrink-0">
                            {cat.score}/10
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                            {t.observedEvidenceLabel} *
                          </label>
                          <textarea
                            rows={3}
                            value={cat.evidence}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...categoryScores]
                              copy[idx] = { ...copy[idx], evidence: e.target.value }
                              setCategoryScores(copy)
                            }}
                            className="w-full h-24 max-h-24 overflow-y-auto resize-none apx-scroll-box px-3.5 py-2.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] focus:outline-none text-white leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#A78BFA] mb-1.5">
                            {t.recommendationInputLabel}
                          </label>
                          <textarea
                            rows={3}
                            value={cat.recommendation}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...categoryScores]
                              copy[idx] = { ...copy[idx], recommendation: e.target.value }
                              setCategoryScores(copy)
                            }}
                            className="w-full h-24 max-h-24 overflow-y-auto resize-none apx-scroll-box px-3.5 py-2.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] focus:outline-none text-white leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ============================================================
                TAB 4: DYNAMIC FINDINGS & APX FIXES (Add / Delete + Single-Card Slider Editor)
               ============================================================ */}
            {(step === 0 || step === 4) && (
              <div className="apx-bento-card p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8B5CF6]/20 pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {t.step4} ({findings.length})
                    </h2>
                    <p className="text-xs text-[#E2D9F3]/65 mt-0.5">
                      {isRtl
                        ? 'أضف أو احذف الفجوات بحرية (١، ٣، ٥ أو أكثر). كل بطاقة تعرض: الدليل (بنفسجي)، التكلفة (أحمر)، والحل (أخضر).'
                        : 'Add or remove bottlenecks freely. Color-coded: Evidence (Purple), Business Cost (Red), APX Fix (Green).'}
                    </p>
                  </div>

                  {/* Bottleneck Slider Selector Pills + Add New Finding Button */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {findings.map((f, idx) => (
                      <button
                        key={f.rank || idx}
                        type="button"
                        onClick={() => setActiveEditorFindingIdx(idx)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          activeEditorFindingIdx === idx
                            ? 'bg-[#8B5CF6] text-white border-[#A78BFA] shadow-md shadow-[#8B5CF6]/25'
                            : 'bg-[#080608]/80 text-[#E2D9F3]/70 border-[#8B5CF6]/20 hover:text-white'
                        }`}
                      >
                        {t.findingNum} {String(f.rank || idx + 1).padStart(2, '0')}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        markDirty()
                        const nextRank = findings.length + 1
                        setFindings((prev) => [
                          ...prev,
                          {
                            rank: nextRank,
                            title: isRtl
                              ? `الفجوة الرئيسية رقم ${nextRank}`
                              : `Core Bottleneck ${nextRank}`,
                            evidence: '',
                            businessImpact: '',
                            apxFix: '',
                            severity: 'HIGH',
                          },
                        ])
                        setActiveEditorFindingIdx(findings.length)
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#10B981]/20 hover:bg-[#10B981]/35 border border-[#10B981]/50 text-[#6EE7B7] hover:text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إضافة فجوة جديدة' : 'Add Bottleneck'}</span>
                    </button>
                  </div>
                </div>

                {(() => {
                  const idx = Math.max(
                    0,
                    Math.min(findings.length - 1, activeEditorFindingIdx)
                  )
                  const f = findings[idx]
                  if (!f) return null

                  return (
                    <div
                      key={f.rank || idx}
                      className="p-5 rounded-2xl bg-[#080608]/90 border border-[#8B5CF6]/30 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-[#8B5CF6]/25 border border-[#8B5CF6]/50 flex items-center justify-center font-en font-bold text-white">
                            {String(f.rank || idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-bold text-sm text-white">
                            {t.findingNum} {f.rank || idx + 1}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const snip = (snippetsQuery.data || []).find(
                                (s) => s.id === e.target.value
                              )
                              if (!snip) return
                              markDirty()
                              const copy = [...findings]
                              copy[idx] = {
                                ...copy[idx],
                                title: language === 'ar' ? snip.titleAr : snip.titleEn,
                                businessImpact:
                                  language === 'ar' ? snip.impactAr : snip.impactEn,
                                apxFix: language === 'ar' ? snip.bodyAr : snip.bodyEn,
                              }
                              setFindings(copy)
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#140D22] border border-[#8B5CF6]/45 text-xs font-bold text-[#A78BFA]"
                          >
                            <option value="">{t.pickSnippetPlaceholder}</option>
                            {(snippetsQuery.data || []).map((s) => (
                              <option key={s.id} value={s.id}>
                                {lang === 'ar' ? s.titleAr : s.titleEn}
                              </option>
                            ))}
                          </select>

                          <select
                            value={f.severity}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...findings]
                              copy[idx] = {
                                ...copy[idx],
                                severity: e.target.value as AuditFindingSeverity,
                              }
                              setFindings(copy)
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/30 text-xs font-bold text-white"
                          >
                            <option value="CRITICAL">{t.severityCritical}</option>
                            <option value="HIGH">{t.severityHigh}</option>
                            <option value="MEDIUM">{t.severityMedium}</option>
                          </select>

                          {findings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                markDirty()
                                const remaining = findings
                                  .filter((_, i) => i !== idx)
                                  .map((item, newIdx) => ({
                                    ...item,
                                    rank: newIdx + 1,
                                  }))
                                setFindings(remaining)
                                setActiveEditorFindingIdx(Math.max(0, idx - 1))
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F43F5E]/15 hover:bg-[#F43F5E]/30 border border-[#F43F5E]/45 text-[#FDA4AF] text-xs font-bold transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.deleteBtn}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                          {t.problemHeadlineLabel}
                        </label>
                        <input
                          type="text"
                          value={f.title}
                          onChange={(e) => {
                            markDirty()
                            const copy = [...findings]
                            copy[idx] = { ...copy[idx], title: e.target.value }
                            setFindings(copy)
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] focus:outline-none text-white font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                        {/* 1. PURPLE — Observed Evidence */}
                        <div className="p-3.5 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/45">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-[#C4B5FD] mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                            {dict.sections.problemEvidence}
                          </label>
                          <textarea
                            rows={3}
                            value={f.evidence}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...findings]
                              copy[idx] = { ...copy[idx], evidence: e.target.value }
                              setFindings(copy)
                            }}
                            className="w-full h-24 max-h-24 overflow-y-auto resize-none apx-scroll-box px-3.5 py-2.5 rounded-xl bg-[#0D0718] border border-[#8B5CF6]/40 focus:border-[#8B5CF6] focus:outline-none text-white leading-relaxed"
                          />
                        </div>

                        {/* 2. RED — Business Impact / Cost */}
                        <div className="p-3.5 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/45">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-[#FDA4AF] mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                            {dict.sections.problemCost}
                          </label>
                          <textarea
                            rows={3}
                            value={f.businessImpact}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...findings]
                              copy[idx] = { ...copy[idx], businessImpact: e.target.value }
                              setFindings(copy)
                            }}
                            className="w-full h-24 max-h-24 overflow-y-auto resize-none apx-scroll-box px-3.5 py-2.5 rounded-xl bg-[#14070D] border border-[#F43F5E]/45 focus:border-[#F43F5E] focus:outline-none text-white leading-relaxed"
                          />
                        </div>

                        {/* 3. EMERALD GREEN — APX Solution / Fix */}
                        <div className="p-3.5 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/50">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-[#6EE7B7] mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                            {dict.sections.problemFix}
                          </label>
                          <textarea
                            rows={3}
                            value={f.apxFix}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...findings]
                              copy[idx] = { ...copy[idx], apxFix: e.target.value }
                              setFindings(copy)
                            }}
                            className="w-full h-24 max-h-24 overflow-y-auto resize-none apx-scroll-box px-3.5 py-2.5 rounded-xl bg-[#071612] border border-[#10B981]/45 focus:border-[#10B981] focus:outline-none text-white leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ============================================================
                TAB 5: PROFILE FUNNEL CHECKLIST + COMPETITORS
               ============================================================ */}
            {(step === 0 || step === 5) && (
              <div className="space-y-6">
                {/* Profile Checklist */}
                <div className="apx-bento-card p-5 sm:p-6 space-y-4">
                  <div className="border-b border-[#8B5CF6]/20 pb-3">
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {dict.sections.funnelTitle}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profileChecks.map((check, idx) => (
                      <div
                        key={check.key}
                        className="p-4 rounded-2xl bg-[#080608]/85 border border-[#8B5CF6]/20 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs">
                            {dict.profileChecks[check.key] || check.key}
                          </span>

                          <div className="flex items-center gap-1">
                            {(
                              [
                                { k: 'OK', label: t.checkOk },
                                { k: 'WEAK', label: t.checkWeak },
                                { k: 'MISSING', label: t.checkMissing },
                              ] as const
                            ).map((st) => (
                              <button
                                key={st.k}
                                type="button"
                                onClick={() => {
                                  markDirty()
                                  const copy = [...profileChecks]
                                  copy[idx] = { ...copy[idx], status: st.k }
                                  setProfileChecks(copy)
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  check.status === st.k
                                    ? st.k === 'OK'
                                      ? 'bg-[#4BA37A]/20 text-[#4BA37A] border-[#4BA37A]'
                                      : st.k === 'WEAK'
                                      ? 'bg-[#D49A3D]/20 text-[#FBBF24] border-[#D49A3D]'
                                      : 'bg-[#C95D63]/20 text-[#C95D63] border-[#C95D63]'
                                    : 'bg-[#120B1E] text-[#E2D9F3]/45 border-transparent'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <input
                          type="text"
                          value={check.evidence}
                          onChange={(e) => {
                            markDirty()
                            const copy = [...profileChecks]
                            copy[idx] = { ...copy[idx], evidence: e.target.value }
                            setProfileChecks(copy)
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitors */}
                <div className="apx-bento-card p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#8B5CF6]/20 pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        {dict.sections.competitorsTitle} ({competitors.length})
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        markDirty()
                        setCompetitors((prev) => [
                          ...prev,
                          {
                            handle: 'competitor.account',
                            displayName: isRtl ? 'منافس في نفس المجال' : 'Niche Competitor',
                            followers: 30000,
                            medianViews: 9000,
                            notes: isRtl
                              ? 'يستخدم خطافات بصرية سريعة في أول ثانيتين مع دعوة تواصل واضحة.'
                              : 'Uses fast visual hooks in the first 2 seconds with a clear CTA.',
                            reels: [],
                          },
                        ])
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B5CF6] text-white font-bold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.addCompetitorBtn}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {competitors.map((comp, idx) => (
                      <div
                        key={comp.id || idx}
                        className="p-4 rounded-2xl bg-[#080608]/85 border border-[#8B5CF6]/25 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-en font-bold text-[#A78BFA]" dir="ltr">
                            @{comp.handle}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              markDirty()
                              setCompetitors((prev) => prev.filter((_, i) => i !== idx))
                            }}
                            className="text-[#C95D63] hover:underline font-bold"
                          >
                            {t.deleteBtn}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-[#E2D9F3]/60 mb-1">
                              {t.handleLabel}
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              value={comp.handle}
                              onChange={(e) => {
                                markDirty()
                                const copy = [...competitors]
                                copy[idx] = {
                                  ...copy[idx],
                                  handle: e.target.value.replace(/^@/, ''),
                                }
                                setCompetitors(copy)
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#E2D9F3]/60 mb-1">
                              {t.followersLabel}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              dir="ltr"
                              value={formatCommaInput(comp.followers)}
                              onChange={(e) => {
                                markDirty()
                                const copy = [...competitors]
                                copy[idx] = {
                                  ...copy[idx],
                                  followers: Math.max(1, parseCommaInput(e.target.value) || 1),
                                }
                                setCompetitors(copy)
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#E2D9F3]/60 mb-1">
                              {t.kpiMedian}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              dir="ltr"
                              value={formatCommaInput(comp.medianViews)}
                              onChange={(e) => {
                                markDirty()
                                const copy = [...competitors]
                                copy[idx] = {
                                  ...copy[idx],
                                  medianViews: parseCommaInput(e.target.value),
                                  reels: [],
                                }
                                setCompetitors(copy)
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white font-en font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-[#E2D9F3]/60 mb-1">
                            {t.competitorNotesLabel}
                          </label>
                          <input
                            type="text"
                            value={comp.notes}
                            onChange={(e) => {
                              markDirty()
                              const copy = [...competitors]
                              copy[idx] = { ...copy[idx], notes: e.target.value }
                              setCompetitors(copy)
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 6: PUBLISH CONTROLS & SHARE TOKEN
               ============================================================ */}
            {(step === 0 || step === 6) && (
              <div className="apx-bento-card p-5 sm:p-6 space-y-6">
                <div className="border-b border-[#8B5CF6]/20 pb-3">
                  <h2 className="text-base sm:text-lg font-bold text-white">{t.step6}</h2>
                </div>

                {/* Readiness Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#080608]/85 border border-[#8B5CF6]/25 flex items-center gap-3">
                    {reels.length >= 5 ? (
                      <CheckCircle2 className="w-5 h-5 text-[#4BA37A] shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#FBBF24] shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-white block">
                        {t.readinessReelsTitle}: {reels.length}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#080608]/85 border border-[#8B5CF6]/25 flex items-center gap-3">
                    {missingEvidenceCategories.length === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-[#4BA37A] shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#C95D63] shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-white block">
                        {t.readinessEvidenceTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share URL & Publish Box */}
                <div className="p-5 rounded-2xl bg-[#080608]/90 border border-[#8B5CF6]/40 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#A78BFA] mb-1.5">
                      {t.secretUrlLabel}
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        dir="ltr"
                        value={`/a/${serverAudit.shareToken}`}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#120B1E] border border-[#8B5CF6]/30 font-en text-[#A78BFA]"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold"
                      >
                        {copiedLink ? t.copiedLinkBtn : t.copyLinkBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerateTokenMutation.mutate({ id: auditId })}
                        className="px-3.5 py-2.5 rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/30 text-white"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Modern Expiration Date Selector Card (Default = 7 Days) */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-[#120B1E]/95 border border-[#8B5CF6]/35 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-white">
                            {t.expiryDateLabel}
                          </label>
                          <p className="text-[11px] text-[#E2D9F3]/60">
                            {isRtl
                              ? 'الافتراضي 7 أيام لخلق أولوية قراءة للعميل — يمكنك تغيير المدة أو فتحها بلا انتهاء.'
                              : 'Default is 7 days to create urgency — choose a preset or custom date.'}
                          </p>
                        </div>
                      </div>

                      {expiresAt ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 font-en">
                          {expiresAt}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#4BA37A]/15 text-[#4BA37A] border border-[#4BA37A]/35">
                          {isRtl ? 'متاح دائماً (بدون انتهاء)' : 'No Expiration'}
                        </span>
                      )}
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { days: 5, labelAr: '5 أيام', labelEn: '5 Days' },
                        { days: 7, labelAr: '7 أيام (الافتراضي)', labelEn: '7 Days (Default)' },
                        { days: 14, labelAr: '14 يوماً', labelEn: '14 Days' },
                        { days: 30, labelAr: '30 يوماً', labelEn: '30 Days' },
                        { days: 0, labelAr: 'بدون تاريخ انتهاء', labelEn: 'Never Expires' },
                      ].map((preset) => {
                        const targetDate =
                          preset.days > 0
                            ? new Date(Date.now() + preset.days * 24 * 60 * 60 * 1000)
                                .toISOString()
                                .slice(0, 10)
                            : ''
                        const isSelected = expiresAt === targetDate
                        return (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() => {
                              markDirty()
                              setExpiresAt(targetDate)
                            }}
                            className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all ${
                              isSelected
                                ? 'bg-[#8B5CF6] text-white border-[#A78BFA] shadow-md shadow-[#8B5CF6]/30'
                                : 'bg-[#080608] text-[#E2D9F3]/75 border-[#8B5CF6]/25 hover:border-[#8B5CF6]/60 hover:text-white'
                            }`}
                          >
                            {isRtl ? preset.labelAr : preset.labelEn}
                          </button>
                        )
                      })}

                      <div className="relative flex items-center">
                        <input
                          type="date"
                          dir="ltr"
                          value={expiresAt}
                          onChange={(e) => {
                            markDirty()
                            setExpiresAt(e.target.value)
                          }}
                          className="px-3.5 py-1.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/35 text-white font-en text-xs focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>
                    </div>

                    {/* Publish & Online/Offline Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#8B5CF6]/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#E2D9F3]/75">
                          {isRtl ? 'حالة الرابط للجمهور:' : 'Public Link Status:'}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            serverAudit.status === 'PUBLISHED'
                              ? 'bg-[#4BA37A]/15 text-[#4BA37A] border-[#4BA37A]/40'
                              : 'bg-[#D49A3D]/15 text-[#FBBF24] border-[#D49A3D]/40'
                          }`}
                        >
                          {serverAudit.status === 'PUBLISHED'
                            ? isRtl
                              ? '● أونلاين (متاح للعميل)'
                              : '● Online (Live)'
                            : isRtl
                              ? '○ أوفلاين (يظهر كرابط غير متاح)'
                              : '○ Offline (Shows Unavailable Page)'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handlePublish}
                          disabled={publishMutation.isLoading}
                          className="py-2.5 px-6 rounded-2xl bg-[#4BA37A] hover:bg-[#3d8b66] text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-[#4BA37A]/25"
                        >
                          {serverAudit.status === 'PUBLISHED'
                            ? t.updatePublishedBtn
                            : t.publishNowBtn}
                        </button>

                        {serverAudit.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() => unpublishMutation.mutate({ id: auditId })}
                            disabled={unpublishMutation.isLoading}
                            className="py-2.5 px-4 rounded-2xl bg-[#C95D63]/20 hover:bg-[#C95D63]/35 border border-[#C95D63]/40 text-[#C95D63] font-bold text-xs sm:text-sm"
                          >
                            {isRtl ? 'تحويل إلى أوفلاين (إيقاف الرابط)' : t.unpublishBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIVE CLIENT REPORT PREVIEW PANE (Standalone Preview Mode) */}
        {layoutMode === 'preview' && (
          <div className="flex w-full flex-col bg-[#050307] overflow-hidden">
            <div className="h-11 px-4 bg-[#120B1E] border-b border-[#8B5CF6]/20 flex items-center justify-between text-xs">
              <span className="font-bold text-[#A78BFA] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {t.previewHeaderTitle}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                    previewDevice === 'mobile'
                      ? 'bg-[#8B5CF6]/25 text-white border border-[#8B5CF6]/45'
                      : 'text-[#E2D9F3]/50'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {t.previewMobile}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                    previewDevice === 'desktop'
                      ? 'bg-[#8B5CF6]/25 text-white border border-[#8B5CF6]/45'
                      : 'text-[#E2D9F3]/50'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  {t.previewDesktop}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto flex justify-center p-4">
              <div
                className={
                  previewDevice === 'mobile'
                    ? 'w-[405px] max-w-full rounded-[32px] border-4 border-[#1A0F2E] overflow-y-auto max-h-[82vh] shadow-2xl'
                    : 'w-full'
                }
              >
                <AuditReportView report={liveReportData} isPreviewMode={true} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSV / Paste Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl apx-bento-card p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">{t.csvModalTitle}</h3>
            <textarea
              rows={8}
              dir="ltr"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`date,views,likes,comments,hook,subtitles,cta,demand,topic,notes\n2026-10-01,4200,130,14,QUESTION,yes,no,2,Pricing strategy,"0:02 — Strong question hook"`}
              className="w-full p-3.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 font-en text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-xl bg-[#140D22] text-[#E2D9F3]/80 font-bold"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleCsvImport}
                className="px-5 py-2 rounded-xl bg-[#8B5CF6] text-white font-bold"
              >
                {t.csvImportBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditWizard
