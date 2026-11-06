'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Archive,
  ArchiveRestore,
  BarChart3,
  BookOpen,
  Check,
  Clock,
  Copy,
  Edit3,
  Eye,
  ExternalLink,
  Flame,
  FolderPlus,
  Globe,
  Loader2,
  MousePointerClick,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import '../../theme/tokens.css'
import { trpc } from '../../client/trpc'
import {
  AUDIT_CATEGORY_KEYS,
  AuditCategoryKey,
  AuditSettingsData,
  DEFAULT_CATEGORY_WEIGHTS,
} from '../../schemas'
import { getDictionary } from '../../i18n'
import { ADMIN_DICTIONARY, AdminLocale } from '../../i18n/adminDict'
import AuditWizard from './AuditWizard'

/**
 * Clean, rock-solid toggle switch that always animates inside its pill container (never overflows in RTL/LTR).
 */
export function ApxSwitch({
  checked,
  onChange,
  disabled = false,
  activeColor = 'bg-[#4BA37A]',
  inactiveColor = 'bg-[#1F1631]',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  activeColor?: string
  inactiveColor?: string
}) {
  return (
    <button
      type="button"
      dir="ltr"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none border border-white/15 ${
        checked ? activeColor : inactiveColor
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md"
      />
    </button>
  )
}

export function formatWithCommas(val: string | number): string {
  const digits = String(val ?? '').replace(/[^0-9]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('en-US')
}

export function parseCommaNumber(val: string): number {
  const digits = String(val ?? '').replace(/[^0-9]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

export function AuditsDashboard({
  embedded = false,
  adminLang: externalLang,
  onToggleLang,
}: {
  embedded?: boolean
  adminLang?: AdminLocale
  onToggleLang?: () => void
} = {}) {
  const [internalLang, setInternalLang] = useState<AdminLocale>('ar')
  const lang = externalLang ?? internalLang
  const t = ADMIN_DICTIONARY[lang]
  const dict = getDictionary(lang)

  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'audits' | 'tracking' | 'snippets' | 'settings'>('audits')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL')
  const [showNewModal, setShowNewModal] = useState(false)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)
  const [analyticsAuditId, setAnalyticsAuditId] = useState<string | null>(null)
  const [trackingRange, setTrackingRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('all')
  const [auditDailyTimeline, setAuditDailyTimeline] = useState<
    Array<{
      date: string
      labelAr: string
      labelEn: string
      auditOpens: number
      bookings: number
    }>
  >([])
  const [auditGeoInsights, setAuditGeoInsights] = useState<{
    avgOpensPerAudit: number
    avgRetentionPct: number
    bookingConversionPct: number
    topCountriesByViews?: Array<{
      code: string
      name: string
      nameAr?: string
      nameEn?: string
      flag: string
      views: number
      opens?: number
      bookings: number
      avgRetentionPct: number
    }>
    topCountries?: Array<{
      code?: string
      countryCode?: string
      name?: string
      countryName?: string
      flag: string
      views?: number
      opens?: number
      bookings: number
      avgRetentionPct?: number
      retentionRate?: number
    }>
    perAudit?: Array<{
      id: string
      retentionPct: number
      booked: boolean
      countries?: Array<{ code: string; name: string; flag: string; count: number }>
    }>
  } | null>(null)

  useEffect(() => {
    if (activeTab !== 'tracking') return
    fetch(`/api/insights?range=${trackingRange}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.audits) {
          setAuditGeoInsights(d.audits)
        }
        if (Array.isArray(d?.dailyTimeline)) {
          setAuditDailyTimeline(d.dailyTimeline)
        }
      })
      .catch(() => null)
  }, [activeTab, trackingRange])

  const [newHandle, setNewHandle] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newNiche, setNewNiche] = useState('')
  const [newFollowers, setNewFollowers] = useState('25000')
  const [newFollowingCount, setNewFollowingCount] = useState<number | null>(null)
  const [newPostsCount, setNewPostsCount] = useState<number | null>(null)
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null)
  const [newBio, setNewBio] = useState('')
  const [newBioLinks, setNewBioLinks] = useState<Array<{ title: string; url: string }>>([])
  const [newLinkInBioUrl, setNewLinkInBioUrl] = useState<string | null>(null)
  const [newScrapedReels, setNewScrapedReels] = useState<
    Array<{
      url: string
      thumbnailUrl: string | null
      caption: string
      topic: string
      postedAt: string
      views: number
      likes: number
      comments: number
      shares: number | null
      saves: number | null
      durationSec: number | null
      hookType: 'QUESTION' | 'BOLD_CLAIM' | 'PATTERN_INTERRUPT' | 'STORY' | 'WEAK' | 'OTHER' | null
      hasSubtitles: boolean | null
      hasCta: boolean | null
      isRepost: boolean
      demandSignalsCount: number
      pros: string
      cons: string
      editorNotes: string
    }>
  >([])
  const [scrapeError, setScrapeError] = useState<string | null>(null)

  const [editingSnippet, setEditingSnippet] = useState<{
    id?: string
    categoryKey: AuditCategoryKey
    problemPattern: string
    titleAr: string
    titleEn: string
    bodyAr: string
    bodyEn: string
    impactAr: string
    impactEn: string
  } | null>(null)

  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const utils = trpc.useUtils()
  const storageStatusQuery = trpc.audit.getStorageStatus.useQuery()
  const auditsQuery = trpc.audit.list.useQuery({
    search,
    status: activeTab === 'tracking' ? 'ALL' : statusFilter,
  })
  const snippetsQuery = trpc.audit.listSnippets.useQuery(undefined, {
    enabled: activeTab === 'snippets',
  })
  const settingsQuery = trpc.audit.getSettings.useQuery(undefined, {
    enabled: activeTab === 'settings',
  })
  const analyticsDetailQuery = trpc.audit.getById.useQuery(
    { id: analyticsAuditId || '' },
    { enabled: Boolean(analyticsAuditId) }
  )

  const scrapeInstagramMutation = trpc.audit.scrapeInstagram.useMutation({
    onSuccess: (scraped) => {
      setScrapeError(null)
      setNewHandle(scraped.handle)
      setNewDisplayName(scraped.displayName || scraped.handle)
      if (scraped.niche) {
        setNewNiche(scraped.niche)
      }
      setNewFollowers(String(scraped.followers || 0))
      setNewFollowingCount(scraped.followingCount)
      setNewPostsCount(scraped.postsCount)
      setNewAvatarUrl(scraped.avatarUrl)
      setNewBio(scraped.bio || '')
      setNewBioLinks(scraped.bioLinks || [])
      setNewLinkInBioUrl(scraped.linkInBioUrl)
      if (Array.isArray(scraped.reels)) {
        setNewScrapedReels(
          scraped.reels.map((r) => ({
            url: r.url,
            thumbnailUrl: r.thumbnailUrl,
            caption: r.caption || '',
            topic: r.topic || '',
            postedAt: r.postedAt,
            views: r.views || 0,
            likes: r.likes || 0,
            comments: r.comments || 0,
            shares: r.shares ?? null,
            saves: r.saves ?? null,
            durationSec: r.durationSec ?? null,
            hookType: r.hookType ?? 'OTHER',
            hasSubtitles: r.hasSubtitles ?? true,
            hasCta: r.hasCta ?? false,
            isRepost: Boolean(r.isRepost),
            demandSignalsCount: r.demandSignalsCount || 0,
            pros: r.pros || '',
            cons: r.cons || '',
            editorNotes: r.editorNotes || '',
          }))
        )
      }
    },
    onError: (err) => {
      setScrapeError(err.message)
    },
  })

  const createDraftMutation = trpc.audit.createDraft.useMutation({
    onSuccess: async (created) => {
      setShowNewModal(false)
      setNewHandle('')
      setNewDisplayName('')
      setNewNiche('')
      setNewAvatarUrl(null)
      setNewBio('')
      setNewBioLinks([])
      setNewLinkInBioUrl(null)
      setNewScrapedReels([])
      setScrapeError(null)
      await utils.audit.list.invalidate()
      setSelectedAuditId(created.id)
    },
  })

  const duplicateMutation = trpc.audit.duplicate.useMutation({
    onSuccess: async (cloned) => {
      await utils.audit.list.invalidate()
      setSelectedAuditId(cloned.id)
    },
  })

  const archiveMutation = trpc.audit.archive.useMutation({
    onSuccess: async () => {
      await utils.audit.list.invalidate()
    },
  })

  const publishMutation = trpc.audit.publish.useMutation({
    onSuccess: async () => {
      await utils.audit.list.invalidate()
    },
  })

  const unpublishMutation = trpc.audit.unpublish.useMutation({
    onSuccess: async () => {
      await utils.audit.list.invalidate()
    },
  })

  const deleteMutation = trpc.audit.delete.useMutation({
    onSuccess: async () => {
      await utils.audit.list.invalidate()
    },
  })

  const saveSnippetMutation = trpc.audit.saveSnippet.useMutation({
    onSuccess: () => {
      setEditingSnippet(null)
      utils.audit.listSnippets.invalidate()
    },
  })

  const deleteSnippetMutation = trpc.audit.deleteSnippet.useMutation({
    onSuccess: () => utils.audit.listSnippets.invalidate(),
  })

  const saveSettingsMutation = trpc.audit.saveSettings.useMutation({
    onSuccess: () => utils.audit.getSettings.invalidate(),
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (isInput) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setShowNewModal(true)
      } else if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleToggleLanguage = () => {
    if (onToggleLang) {
      onToggleLang()
    } else {
      setInternalLang((prev) => (prev === 'ar' ? 'en' : 'ar'))
    }
  }

  const handleCopyShareLink = (shareToken: string, id: string) => {
    const url = `${window.location.origin}/a/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopiedTokenId(id)
    setTimeout(() => setCopiedTokenId(null), 2000)
  }

  const handleScrapeInModal = () => {
    if (!newHandle.trim()) return
    setScrapeError(null)
    scrapeInstagramMutation.mutate({
      handleOrUrl: newHandle.trim(),
      reelsCount: 18,
    })
  }

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHandle.trim() || createDraftMutation.isLoading) return

    const cleanH = newHandle
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .split('/')[0]
      .split('?')[0]
      .replace(/^@/, '')
      .trim()

    createDraftMutation.mutate({
      handle: cleanH,
      displayName: newDisplayName.trim() || cleanH,
      niche: newNiche.trim() || (lang === 'ar' ? 'خبير / استشاري' : 'Expert / Consultant'),
      followers: Math.max(0, parseCommaNumber(newFollowers)),
      followingCount: newFollowingCount,
      postsCount: newPostsCount,
      linkInBioUrl: newLinkInBioUrl,
      avatarUrl: newAvatarUrl,
      bio: newBio,
      bioLinks: newBioLinks,
      reels: newScrapedReels,
    })
  }

  const handleToggleOnlineStatus = (rowId: string, currentStatus: string) => {
    if (currentStatus === 'PUBLISHED') {
      unpublishMutation.mutate({ id: rowId })
    } else {
      publishMutation.mutate({ id: rowId })
    }
  }

  if (selectedAuditId) {
    return (
      <div className={embedded ? 'rounded-3xl overflow-hidden border border-[#8B5CF6]/25' : ''}>
        <AuditWizard
          auditId={selectedAuditId}
          adminLang={lang}
          onToggleLang={handleToggleLanguage}
          onBack={() => {
            setSelectedAuditId(null)
            utils.audit.list.invalidate()
          }}
        />
      </div>
    )
  }

  const allAudits = auditsQuery.data || []
  const totalOnlineCount = allAudits.filter((a) => a.status === 'PUBLISHED').length
  const totalOpenedAudits = allAudits.filter((a) => a.analytics.totalOpens > 0).length
  const totalOpensSum = allAudits.reduce((sum, a) => sum + a.analytics.totalOpens, 0)
  const totalCtaClicksSum = allAudits.reduce((sum, a) => sum + a.analytics.ctaClicksCount, 0)

  return (
    <div
      dir={t.dir}
      className={`apx-audit ${t.fontClass} ${
        embedded
          ? ''
          : 'min-h-screen bg-[#080608] p-6'
      } text-[#E2D9F3] space-y-6`}
    >
      {/* Top Header (No duplicate center APX logo) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#8B5CF6]/20">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center text-[#A78BFA] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {t.auditsTitle}
              </h2>
              {storageStatusQuery.data && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    storageStatusQuery.data.blobConnected
                      ? 'bg-[#4BA37A]/15 text-[#4BA37A] border-[#4BA37A]/35'
                      : 'bg-[#D49A3D]/15 text-[#FBBF24] border-[#D49A3D]/35'
                  }`}
                >
                  {storageStatusQuery.data.blobConnected
                    ? t.storageCloud
                    : t.storageLocal}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#E2D9F3]/65 mt-1">
              {t.auditsSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!embedded && (
            <>
              <button
                type="button"
                onClick={handleToggleLanguage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-[#110B1B] border border-[#8B5CF6]/30 text-white hover:bg-[#1A0F2E] transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>{t.switchLangLabel}</span>
              </button>
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#110B1B] border border-[#8B5CF6]/25 text-[#E2D9F3] hover:text-white transition-all"
              >
                {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
            </>
          )}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newAuditBtn}</span>
          </motion.button>
        </div>
      </div>

      {/* Sub-navigation Tabs (4 Tabs including Link Tracking & Opens) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#110B1B] p-1.5 rounded-2xl border border-[#8B5CF6]/20 w-fit">
        {[
          { id: 'audits', label: t.tabAudits, icon: BarChart3 },
          { id: 'tracking', label: lang === 'ar' ? 'إحصائيات' : 'Insights', icon: Activity },
          { id: 'snippets', label: t.tabSnippets, icon: BookOpen },
          { id: 'settings', label: t.tabSettings, icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                isActive ? 'text-white' : 'text-[#E2D9F3]/65 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="auditSubTabActive"
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="absolute inset-0 rounded-xl bg-[#8B5CF6] -z-10 shadow-md shadow-[#8B5CF6]/30"
                />
              )}
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ================================================================
          TAB 1: AUDITS BENTO CARDS
         ================================================================ */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          {/* Search & Status Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#E2D9F3]/45 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full ps-10 pe-8 py-2.5 rounded-2xl text-xs sm:text-sm bg-[#080608]/85 border border-[#8B5CF6]/25 text-white placeholder:text-[#E2D9F3]/40 focus:outline-none focus:border-[#8B5CF6]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[#E2D9F3]/45 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-[#110B1B] p-1 rounded-2xl border border-[#8B5CF6]/20">
              {[
                { id: 'ALL', label: t.filterAll },
                { id: 'PUBLISHED', label: t.filterPublished },
                { id: 'DRAFT', label: t.filterDraft },
                { id: 'ARCHIVED', label: t.filterArchived },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as typeof statusFilter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st.id
                      ? 'bg-[#8B5CF6] text-white'
                      : 'text-[#E2D9F3]/65 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {auditsQuery.isLoading ? (
            <div className="py-14 text-center text-[#E2D9F3]/65 apx-bento-card rounded-3xl">
              <Loader2 className="w-5 h-5 animate-spin inline me-2 text-[#8B5CF6]" />
              {t.loadingAudits}
            </div>
          ) : allAudits.length === 0 ? (
            <div className="py-14 text-center text-[#E2D9F3]/65 apx-bento-card rounded-3xl space-y-4">
              <p className="text-base font-bold text-white">{t.emptyAudits}</p>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#8B5CF6] text-white"
              >
                <Plus className="w-4 h-4" />
                <span>{t.createFirstAudit}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {allAudits.map((row, idx) => {
                const isDemo =
                  row.prospect.handle.toLowerCase().includes('demo') ||
                  row.prospect.displayName.toUpperCase().includes('DEMO')
                const isOnline = row.status === 'PUBLISHED'
                const isArchived = row.status === 'ARCHIVED'

                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="apx-bento-card rounded-3xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Avatar + Score Tile */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {row.prospect.avatarUrl ? (
                          <img
                            src={row.prospect.avatarUrl}
                            alt={row.prospect.displayName}
                            className="w-14 h-14 rounded-2xl object-cover border border-[#8B5CF6]/45 bg-[#080608]"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-[#1A0F2E] border border-[#8B5CF6]/40 flex items-center justify-center text-lg font-bold text-[#A78BFA]">
                            {(row.prospect.displayName || row.prospect.handle || 'A')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedAuditId(row.id)}
                          className="w-14 h-14 rounded-2xl bg-[#080608] border border-[#8B5CF6]/45 flex flex-col items-center justify-center shrink-0 hover:border-[#8B5CF6] transition-all"
                        >
                          <span className="apx-serif-numeral text-xl font-bold text-white leading-none">
                            {row.overallScore}
                          </span>
                          <span className="text-[11px] text-[#E2D9F3]/50 font-en">/100</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAuditId(row.id)}
                            className="text-base font-bold text-white hover:text-[#A78BFA] transition-colors text-start"
                          >
                            {row.prospect.displayName}
                          </button>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isOnline
                                ? 'bg-[#4BA37A]/15 text-[#4BA37A] border-[#4BA37A]/35'
                                : isArchived
                                  ? 'bg-white/10 text-[#E2D9F3]/60 border-white/15'
                                  : 'bg-[#D49A3D]/15 text-[#FBBF24] border-[#D49A3D]/35'
                            }`}
                          >
                            {isOnline
                              ? t.statusPublished
                              : isArchived
                                ? t.statusArchived
                                : t.statusDraft}
                          </span>

                          {isDemo && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D49A3D]/20 text-[#FBBF24] border border-[#D49A3D]/40">
                              {t.demoBadge}
                            </span>
                          )}

                          {row.analytics.isHotLead && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C95D63]/20 text-[#C95D63] border border-[#C95D63]/40">
                              <Flame className="w-3.5 h-3.5" />
                              {t.hotLeadBadge}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#E2D9F3]/70">
                          <span className="font-en text-[#A78BFA] font-bold" dir="ltr">
                            @{row.prospect.handle}
                          </span>
                          <span>•</span>
                          <span>{row.prospect.niche}</span>
                          <span>•</span>
                          <span>
                            <strong className="text-white font-en">
                              {row.prospect.followers.toLocaleString('en-US')}
                            </strong>{' '}
                            {t.followersUnit}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-0.5 text-xs text-[#E2D9F3]/60">
                          <span>
                            {t.opensCount}:{' '}
                            <strong className="text-white font-en">
                              {row.analytics.totalOpens}
                            </strong>
                          </span>
                          <span>
                            {t.avgReadTime}:{' '}
                            <strong className="text-white font-en">
                              {row.analytics.avgTimeSpentSec > 0
                                ? `${row.analytics.avgTimeSpentSec} ${t.secUnit}`
                                : '—'}
                            </strong>
                          </span>
                          <span>
                            {t.ctaClickedLabel}:{' '}
                            <strong
                              className={
                                row.analytics.ctaClicked
                                  ? 'text-[#4BA37A]'
                                  : 'text-[#E2D9F3]/45'
                              }
                            >
                              {row.analytics.ctaClicked
                                ? `${t.yes} (${row.analytics.ctaClicksCount})`
                                : t.no}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Online / Offline Direct Switch */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#080608]/90 border border-[#8B5CF6]/25">
                        <ApxSwitch
                          checked={isOnline}
                          onChange={() => handleToggleOnlineStatus(row.id, row.status)}
                          disabled={publishMutation.isLoading || unpublishMutation.isLoading}
                        />
                        <span
                          className={`text-xs font-bold ${
                            isOnline ? 'text-[#4BA37A]' : 'text-[#E2D9F3]/60'
                          }`}
                        >
                          {isOnline
                            ? lang === 'ar'
                              ? 'أونلاين'
                              : 'Online'
                            : lang === 'ar'
                              ? 'أوفلاين'
                              : 'Offline'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedAuditId(row.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#8B5CF6]/25 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t.editStudioBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyShareLink(row.shareToken, row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#080608]/85 hover:bg-[#1A0F2E] border border-[#8B5CF6]/30 text-xs font-bold text-[#E2D9F3] hover:text-white transition-all"
                      >
                        {copiedTokenId === row.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#4BA37A]" />
                            <span className="text-[#4BA37A]">{t.copiedLinkBtn}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <span>{t.copyLinkBtn}</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/a/${row.shareToken}?preview=1`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#080608]/85 hover:bg-[#1A0F2E] border border-[#8B5CF6]/30 text-xs font-bold text-[#E2D9F3] hover:text-white transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <span>{t.previewReportBtn}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setAnalyticsAuditId(row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#080608]/85 hover:bg-[#1A0F2E] border border-[#8B5CF6]/30 text-xs font-bold text-[#A78BFA] transition-all"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>{t.analyticsBtn}</span>
                      </button>

                      {/* Archive / Unarchive Button */}
                      <button
                        type="button"
                        onClick={() => archiveMutation.mutate({ id: row.id })}
                        disabled={archiveMutation.isLoading}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                          isArchived
                            ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/45 text-white hover:bg-[#8B5CF6]/30'
                            : 'bg-[#080608]/85 hover:bg-[#1A0F2E] border-[#8B5CF6]/20 text-[#E2D9F3]/75 hover:text-white'
                        }`}
                        title={isArchived ? t.unarchiveBtn : t.archiveBtn}
                      >
                        {isArchived ? (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <span>{t.unarchiveBtn}</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <span>{t.archiveBtn}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateMutation.mutate({ id: row.id })}
                        className="p-2 rounded-2xl bg-[#080608]/85 hover:bg-[#1A0F2E] border border-[#8B5CF6]/20 text-[#E2D9F3]/65 hover:text-white"
                        title={t.duplicateBtn}
                      >
                        <FolderPlus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const msg =
                            lang === 'ar'
                              ? 'هل أنت متأكد من حذف هذا التقرير نهائياً؟'
                              : 'Are you sure you want to permanently delete this audit?'
                          if (confirm(msg)) {
                            deleteMutation.mutate({ id: row.id })
                          }
                        }}
                        className="p-2 rounded-2xl bg-[#C95D63]/10 hover:bg-[#C95D63]/20 border border-[#C95D63]/30 text-[#C95D63]"
                        title={t.deleteBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          TAB 2: LINK OPENS & ENGAGEMENT TRACKING TAB
         ================================================================ */}
      {activeTab === 'tracking' && (
        <div className="space-y-5">
          {/* Date Filter Bar */}
          <div className="apx-bento-card rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-xs sm:text-sm font-bold text-white">
                {lang === 'ar'
                  ? 'نطاق زمن تحليل الإحصائيات والمنحنيات'
                  : 'Insights & Telemetry Date Range'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 bg-[#080608] p-1 rounded-2xl border border-[#8B5CF6]/25">
              {(
                [
                  { id: 'today', ar: 'اليوم', en: 'Today' },
                  { id: '7d', ar: 'آخر 7 أيام', en: '7 Days' },
                  { id: '30d', ar: 'آخر 30 يوماً', en: '30 Days' },
                  { id: '90d', ar: 'آخر 90 يوماً', en: '90 Days' },
                  { id: 'all', ar: 'كل الفترات', en: 'All Time' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setTrackingRange(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    trackingRange === r.id
                      ? 'bg-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/40'
                      : 'text-[#E2D9F3]/65 hover:text-white'
                  }`}
                >
                  {lang === 'ar' ? r.ar : r.en}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Telemetry KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
            <div className="apx-bento-card rounded-3xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#E2D9F3]/65 block mb-1">
                  {lang === 'ar' ? 'الروابط الأونلاين' : 'Online Links'}
                </span>
                <strong className="apx-serif-numeral text-2xl font-bold text-[#4BA37A]">
                  {totalOnlineCount}
                </strong>
                <span className="text-xs text-[#E2D9F3]/45 ms-1 font-en">
                  / {allAudits.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#4BA37A]/15 border border-[#4BA37A]/35 flex items-center justify-center text-[#4BA37A]">
                <Globe className="w-4 h-4" />
              </div>
            </div>

            <div className="apx-bento-card rounded-3xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#E2D9F3]/65 block mb-1">
                  {lang === 'ar' ? 'تقارير تم فتحها' : 'Opened Audits'}
                </span>
                <strong className="apx-serif-numeral text-2xl font-bold text-white">
                  {totalOpenedAudits}
                </strong>
                <span className="text-xs text-[#E2D9F3]/45 ms-1 font-en">
                  / {allAudits.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center text-[#A78BFA]">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="apx-bento-card rounded-3xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#E2D9F3]/65 block mb-1">
                  {lang === 'ar' ? 'إجمالي الفتح' : 'Total Opens'}
                </span>
                <strong className="apx-serif-numeral text-2xl font-bold text-[#A78BFA]">
                  {totalOpensSum.toLocaleString('en-US')}
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center text-[#A78BFA]">
                <Eye className="w-4 h-4" />
              </div>
            </div>

            <div className="apx-bento-card rounded-3xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#E2D9F3]/65 block mb-1">
                  {lang === 'ar' ? 'متوسط الفتح لكل أوديت' : 'Avg Opens / Audit'}
                </span>
                <strong className="apx-serif-numeral text-2xl font-bold text-white">
                  {auditGeoInsights?.avgOpensPerAudit ??
                    (allAudits.length > 0
                      ? Number((totalOpensSum / allAudits.length).toFixed(1))
                      : 0)}
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center text-[#A78BFA]">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="apx-bento-card rounded-3xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#E2D9F3]/65 block mb-1">
                  {lang === 'ar' ? 'متوسط الـ Retention' : 'Avg Retention'}
                </span>
                <strong className="apx-serif-numeral text-2xl font-bold text-[#10B981]">
                  {auditGeoInsights?.avgRetentionPct ?? 0}%
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/35 flex items-center justify-center text-[#10B981]">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>

            <div className="apx-bento-card rounded-3xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#E2D9F3]/65 block mb-1">
                  {lang === 'ar' ? 'نسبة الحجز (Booking %)' : 'Booking Conv %'}
                </span>
                <strong className="apx-serif-numeral text-2xl font-bold text-[#FBBF24]">
                  {auditGeoInsights?.bookingConversionPct ?? 0}%
                </strong>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#D49A3D]/15 border border-[#D49A3D]/35 flex items-center justify-center text-[#FBBF24]">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Top Countries Opening & Booking Audits */}
          {(() => {
            const topCountriesList =
              auditGeoInsights?.topCountriesByViews ||
              auditGeoInsights?.topCountries ||
              []
            if (topCountriesList.length === 0) return null
            return (
              <div className="apx-bento-card rounded-3xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#A78BFA]" />
                  <span>
                    {lang === 'ar'
                      ? 'أكثر الدول فتحاً وحجزاً لتقارير الأوديت'
                      : 'Top Countries Opening & Booking Audits'}
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {topCountriesList.slice(0, 8).map((c: any, idx: number) => {
                    const code = c.code || c.countryCode || `c_${idx}`
                    const name =
                      lang === 'ar'
                        ? c.nameAr || c.name || c.countryName || code
                        : c.nameEn || c.code || c.countryCode || c.name || code
                    const views = c.views ?? c.opens ?? 0
                    const ret = c.avgRetentionPct ?? c.retentionRate ?? 0
                    return (
                      <div
                        key={code}
                        className="p-3.5 rounded-2xl bg-[#080608]/90 border border-[#8B5CF6]/25 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl leading-none">{c.flag}</span>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {name}
                            </span>
                            <span className="text-[11px] text-[#E2D9F3]/60 font-en">
                              Retention: {ret}%
                            </span>
                          </div>
                        </div>
                        <div className="text-end font-en">
                          <span className="text-xs font-bold text-[#A78BFA] block">
                            {views} {lang === 'ar' ? 'فتح' : 'opens'}
                          </span>
                          <span className="text-[11px] font-bold text-[#10B981] block">
                            {c.bookings || 0} {lang === 'ar' ? 'حجز' : 'booked'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Daily Audit Opens Timeline Bar/Curve */}
          {auditDailyTimeline.length > 0 && (
            <div className="apx-bento-card rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#A78BFA]" />
                  <span>
                    {lang === 'ar'
                      ? 'منحنى فتح التقارير والتفاعل حسب التاريخ'
                      : 'Daily Audit Opens & Engagement Timeline'}
                  </span>
                </h4>
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end h-28 pt-4 px-2">
                {auditDailyTimeline.slice(-14).map((d) => {
                  const maxO = Math.max(
                    1,
                    ...auditDailyTimeline.map((x) => x.auditOpens || 0)
                  )
                  const hPct = Math.max(
                    10,
                    Math.round(((d.auditOpens || 0) / maxO) * 100)
                  )
                  return (
                    <div
                      key={d.date}
                      className="flex flex-col items-center gap-1.5 h-full justify-end group"
                    >
                      <span className="text-[10px] font-en font-bold text-[#A78BFA] opacity-85 group-hover:opacity-100">
                        {d.auditOpens}
                      </span>
                      <div className="w-full max-w-[24px] bg-[#090510] rounded-lg h-16 flex items-end overflow-hidden border border-[#8B5CF6]/20">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${hPct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="w-full rounded-t-md bg-gradient-to-t from-[#6D28D9] to-[#A78BFA]"
                        />
                      </div>
                      <span className="text-[9px] text-[#E2D9F3]/60 whitespace-nowrap">
                        {lang === 'ar' ? d.labelAr : d.labelEn}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Detailed Link Opens Table / Bento Rows */}
          <div className="apx-bento-card rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5CF6]/20 pb-3.5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {lang === 'ar'
                    ? 'سجل فتح الروابط وتتبع قراءة العملاء لحظة بلحظة'
                    : 'Real-Time Client Link Opens & Reading Telemetry'}
                </h3>
                <p className="text-xs text-[#E2D9F3]/65 mt-0.5">
                  {lang === 'ar'
                    ? 'راقب من فتح رابط التقرير، عدد مرات الفتح، الدول، نسبة الـ Retention، وهل قام بالحجز أم لا.'
                    : 'Track which prospects opened their audit link, open count, countries, retention %, and booking status.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {allAudits.map((row) => {
                const opened = row.analytics.totalOpens > 0
                const isOnline = row.status === 'PUBLISHED'
                const geoRow = (auditGeoInsights?.perAudit || []).find(
                  (p) => p.id === row.id
                )
                const retentionPct = geoRow?.retentionPct ?? row.analytics.maxScrollDepth
                const booked = geoRow?.booked ?? row.analytics.ctaClicked

                return (
                  <div
                    key={row.id}
                    className="p-4 rounded-2xl bg-[#080608]/90 border border-[#8B5CF6]/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-[#8B5CF6]/50 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      {row.prospect.avatarUrl ? (
                        <img
                          src={row.prospect.avatarUrl}
                          alt={row.prospect.displayName}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#8B5CF6]/40 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#1A0F2E] border border-[#8B5CF6]/35 flex items-center justify-center text-base font-bold text-[#A78BFA] shrink-0">
                          {(row.prospect.displayName || row.prospect.handle || 'A')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm sm:text-base">
                            {row.prospect.displayName}
                          </span>
                          <span className="text-xs font-en text-[#A78BFA]" dir="ltr">
                            @{row.prospect.handle}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              opened
                                ? 'bg-[#4BA37A]/15 text-[#4BA37A] border-[#4BA37A]/40'
                                : 'bg-white/5 text-[#E2D9F3]/50 border-white/10'
                            }`}
                          >
                            {opened
                              ? lang === 'ar'
                                ? `✓ تم فتح الرابط (${row.analytics.totalOpens} مرات)`
                                : `✓ Opened (${row.analytics.totalOpens}x)`
                              : lang === 'ar'
                                ? 'لم يُفتح بعد'
                                : 'Not Opened Yet'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              booked
                                ? 'bg-[#10B981]/20 text-[#6EE7B7] border-[#10B981]/50'
                                : 'bg-white/5 text-[#E2D9F3]/50 border-white/10'
                            }`}
                          >
                            {booked
                              ? lang === 'ar'
                                ? '★ ضغط حجز مكالمة'
                                : '★ Clicked to Book'
                              : lang === 'ar'
                                ? 'لم يحجز بعد'
                                : 'Not Booked Yet'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#E2D9F3]/65 mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                            {lang === 'ar' ? 'آخر فتح:' : 'Last opened:'}{' '}
                            <strong className="text-white font-en">
                              {row.analytics.lastOpenedAt
                                ? new Date(row.analytics.lastOpenedAt).toLocaleString(
                                    lang === 'ar' ? 'ar-EG' : 'en-US',
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )
                                : lang === 'ar'
                                  ? 'لا يوجد'
                                  : 'Never'}
                            </strong>
                          </span>
                          <span>
                            {lang === 'ar' ? 'جلسات فريدة:' : 'Unique visitors:'}{' '}
                            <strong className="text-white font-en">
                              {row.analytics.uniqueSessions}
                            </strong>
                          </span>
                          <span>
                            {lang === 'ar' ? 'نسبة الـ Retention:' : 'Retention:'}{' '}
                            <strong className="text-[#10B981] font-en">
                              {retentionPct}%
                            </strong>
                          </span>
                          <span>
                            {lang === 'ar' ? 'عمق التصفح:' : 'Max scroll:'}{' '}
                            <strong className="text-[#A78BFA] font-en">
                              {row.analytics.maxScrollDepth}%
                            </strong>
                          </span>
                          {geoRow && Array.isArray(geoRow.countries) && geoRow.countries.length > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                              <span>{lang === 'ar' ? 'الدول:' : 'Countries:'}</span>
                              {geoRow.countries.map((c: any, cIdx: number) => (
                                <span
                                  key={c.code || c.countryCode || cIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#140B24] border border-[#8B5CF6]/30 text-white text-[11px]"
                                >
                                  <span>{c.flag}</span>
                                  <span>{c.name || c.countryName || c.code}</span>
                                  <span className="font-en text-[#A78BFA]">({c.count})</span>
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#110B1B] border border-[#8B5CF6]/25">
                        <ApxSwitch
                          checked={isOnline}
                          onChange={() => handleToggleOnlineStatus(row.id, row.status)}
                          disabled={publishMutation.isLoading || unpublishMutation.isLoading}
                        />
                        <span
                          className={`text-xs font-bold ${
                            isOnline ? 'text-[#4BA37A]' : 'text-[#E2D9F3]/60'
                          }`}
                        >
                          {isOnline ? t.onlineLabel : t.offlineLabel}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyShareLink(row.shareToken, row.id)}
                        className="px-3 py-2 rounded-2xl bg-[#110B1B] hover:bg-[#1A0F2E] border border-[#8B5CF6]/30 text-xs font-bold text-white inline-flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <span>{copiedTokenId === row.id ? t.copiedLinkBtn : t.copyLinkBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAnalyticsAuditId(row.id)}
                        className="px-3.5 py-2 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white inline-flex items-center gap-1.5"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تفاصيل الجلسة' : 'Full Telemetry'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          TAB 3: RECOMMENDATION SNIPPETS LIBRARY
         ================================================================ */}
      {activeTab === 'snippets' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">{t.snippetsTitle}</h3>
              <p className="text-xs sm:text-sm text-[#E2D9F3]/65">{t.snippetsSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingSnippet({
                  categoryKey: 'hooks_editing',
                  problemPattern: '',
                  titleAr: '',
                  titleEn: '',
                  bodyAr: '',
                  bodyEn: '',
                  impactAr: '',
                  impactEn: '',
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newSnippetBtn}</span>
            </button>
          </div>

          {editingSnippet && (
            <div className="p-5 sm:p-6 rounded-3xl apx-bento-card space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#E2D9F3]/75 mb-1.5 font-bold">
                    {t.categoryLabel}
                  </label>
                  <select
                    value={editingSnippet.categoryKey}
                    onChange={(e) =>
                      setEditingSnippet({
                        ...editingSnippet,
                        categoryKey: e.target.value as AuditCategoryKey,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
                  >
                    {AUDIT_CATEGORY_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {dict.categories[k] || k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#E2D9F3]/75 mb-1.5 font-bold">
                    {t.patternLabel}
                  </label>
                  <input
                    type="text"
                    value={editingSnippet.problemPattern}
                    onChange={(e) =>
                      setEditingSnippet({
                        ...editingSnippet,
                        problemPattern: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#E2D9F3]/75 mb-1.5 font-bold">
                    {t.titleArLabel}
                  </label>
                  <input
                    type="text"
                    value={editingSnippet.titleAr}
                    onChange={(e) =>
                      setEditingSnippet({ ...editingSnippet, titleAr: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#E2D9F3]/75 mb-1.5 font-bold">
                    {t.titleEnLabel}
                  </label>
                  <input
                    dir="ltr"
                    type="text"
                    value={editingSnippet.titleEn}
                    onChange={(e) =>
                      setEditingSnippet({ ...editingSnippet, titleEn: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#E2D9F3]/75 mb-1.5 font-bold">
                    {t.impactArLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={editingSnippet.impactAr}
                    onChange={(e) =>
                      setEditingSnippet({ ...editingSnippet, impactAr: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#E2D9F3]/75 mb-1.5 font-bold">
                    {t.fixArLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={editingSnippet.bodyAr}
                    onChange={(e) =>
                      setEditingSnippet({ ...editingSnippet, bodyAr: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSnippet(null)}
                  className="px-4 py-2 rounded-2xl bg-[#110B1B] text-[#E2D9F3]/75 font-bold text-xs"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    saveSnippetMutation.mutate({
                      ...editingSnippet,
                      titleEn: editingSnippet.titleEn || editingSnippet.titleAr,
                      bodyEn: editingSnippet.bodyEn || editingSnippet.bodyAr,
                    })
                  }
                  className="px-5 py-2 rounded-2xl bg-[#8B5CF6] text-white font-bold text-xs"
                >
                  {t.saveSnippetBtn}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(snippetsQuery.data || []).map((snip) => (
              <div
                key={snip.id}
                className="p-5 rounded-3xl apx-bento-card space-y-2.5 text-sm"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] font-bold">
                    {dict.categories[snip.categoryKey] || snip.categoryKey}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingSnippet(snip)}
                      className="text-[#A78BFA] font-bold hover:underline"
                    >
                      {t.editBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSnippetMutation.mutate({ id: snip.id })}
                      className="text-[#C95D63] font-bold hover:underline"
                    >
                      {t.deleteBtn}
                    </button>
                  </div>
                </div>
                <p className="text-base font-bold text-white">
                  {lang === 'ar' ? snip.titleAr : snip.titleEn}
                </p>
                <p className="text-xs sm:text-sm text-[#E2D9F3]/80 leading-relaxed">
                  {lang === 'ar' ? snip.bodyAr : snip.bodyEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================
          TAB 4: SETTINGS, FOMO & WEIGHTS
         ================================================================ */}
      {activeTab === 'settings' && settingsQuery.data && (
        <SettingsForm
          initial={settingsQuery.data}
          lang={lang}
          onSave={(updated) => saveSettingsMutation.mutate(updated)}
          isSaving={saveSettingsMutation.isLoading}
        />
      )}

      {/* ================================================================
          MODAL: CREATE NEW AUDIT (No APX Logo in Modal Header)
         ================================================================ */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              dir={t.dir}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl apx-glass p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {newAvatarUrl ? (
                    <img
                      src={newAvatarUrl}
                      alt={newDisplayName || newHandle}
                      className="w-11 h-11 rounded-2xl object-cover border border-[#8B5CF6]/50"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] font-bold">
                      @
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white">{t.newModalTitle}</h3>
                    <p className="text-xs text-[#E2D9F3]/60 mt-0.5">{t.newModalSubtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="text-[#E2D9F3]/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDraft} className="space-y-4 text-sm">
                <div className="p-5 rounded-3xl bg-[#110B1B]/95 border border-[#8B5CF6]/35 space-y-4">
                  <div>
                    <label className="block text-xs text-[#E2D9F3]/85 font-bold mb-2">
                      {t.handleLabel} *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        dir="ltr"
                        type="text"
                        required
                        value={newHandle}
                        onChange={(e) => setNewHandle(e.target.value)}
                        placeholder="@username / https://instagram.com/..."
                        className="flex-1 px-4 py-3 rounded-2xl bg-[#080608] border border-[#8B5CF6]/40 text-white font-en text-xs sm:text-sm focus:outline-none focus:border-[#8B5CF6]"
                      />
                      <button
                        type="button"
                        disabled={!newHandle.trim() || scrapeInstagramMutation.isLoading}
                        onClick={handleScrapeInModal}
                        className="py-3 px-5 rounded-2xl bg-[#8B5CF6]/25 hover:bg-[#8B5CF6]/40 border border-[#8B5CF6]/55 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
                      >
                        {scrapeInstagramMutation.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#A78BFA]" />
                            <span>{t.scrapingAccountBtn}</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 text-[#A78BFA]" />
                            <span>{t.scrapeAccountBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {scrapeError && (
                    <p className="text-xs text-[#C95D63] font-bold">
                      {t.scrapeErrorPrefix} {scrapeError}
                    </p>
                  )}

                  {/* Editable Fields & Scraped Preview */}
                  <div className="pt-3 border-t border-[#8B5CF6]/20 space-y-4">
                    {newAvatarUrl && (
                      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#080608]/90 border border-[#4BA37A]/35">
                        <img
                          src={newAvatarUrl}
                          alt={newDisplayName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.35)] shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-[#4BA37A] bg-[#4BA37A]/15 px-2.5 py-0.5 rounded-full border border-[#4BA37A]/35 inline-block">
                              ✓ {t.scrapeSuccessBadge}
                            </span>
                            {newScrapedReels.length > 0 && (
                              <span className="text-xs font-bold text-[#A78BFA] bg-[#8B5CF6]/15 px-2.5 py-0.5 rounded-full border border-[#8B5CF6]/35 inline-block">
                                {lang === 'ar'
                                  ? `تم سحب وتحليل ${newScrapedReels.length} ريلز تلقائياً`
                                  : `${newScrapedReels.length} Reels Scraped & Analyzed`}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-white truncate">
                            {newDisplayName}
                          </p>
                          {newBio && (
                            <p className="text-xs text-[#E2D9F3]/75 line-clamp-2 leading-relaxed">
                              {newBio}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-[#E2D9F3]/80 font-bold mb-1">
                          {t.displayNameLabel}
                        </label>
                        <input
                          type="text"
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          placeholder={lang === 'ar' ? 'اسم العميل' : 'Prospect Name'}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/35 text-white text-xs focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#E2D9F3]/80 font-bold mb-1">
                          {t.nicheLabel}
                        </label>
                        <input
                          type="text"
                          value={newNiche}
                          onChange={(e) => setNewNiche(e.target.value)}
                          placeholder={lang === 'ar' ? 'التخصص أو المجال' : 'Niche'}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/35 text-white text-xs focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#E2D9F3]/80 font-bold mb-1">
                          {t.followersLabel}
                        </label>
                        <input
                          dir="ltr"
                          type="text"
                          inputMode="numeric"
                          value={formatWithCommas(newFollowers)}
                          onChange={(e) =>
                            setNewFollowers(String(parseCommaNumber(e.target.value)))
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/35 text-white font-en text-xs focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-5 py-2.5 rounded-2xl bg-[#110B1B] border border-[#8B5CF6]/20 text-[#E2D9F3]/75 font-bold text-xs"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    disabled={createDraftMutation.isLoading}
                    className="px-6 py-2.5 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-lg shadow-[#8B5CF6]/25 disabled:opacity-50 apx-btn-glow"
                  >
                    {createDraftMutation.isLoading ? t.creatingBtn : t.createAndOpenBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================
          DRAWER: ENGAGEMENT ANALYTICS PER AUDIT
         ================================================================ */}
      <AnimatePresence>
        {analyticsAuditId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start"
          >
            <motion.div
              initial={{ x: lang === 'ar' ? 120 : -120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: lang === 'ar' ? 120 : -120, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              dir={t.dir}
              className="w-full max-w-xl bg-[#080608] border-e border-[#8B5CF6]/30 h-full overflow-y-auto p-6 space-y-6 text-sm"
            >
              <div className="flex items-center justify-between border-b border-[#8B5CF6]/20 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{t.analyticsTitle}</h3>
                  {analyticsDetailQuery.data && (
                    <p className="text-[#A78BFA] font-en mt-0.5" dir="ltr">
                      @{analyticsDetailQuery.data.audit.prospect.handle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAnalyticsAuditId(null)}
                  className="p-2 rounded-2xl bg-[#1A0F2E] text-[#E2D9F3]/75 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {analyticsDetailQuery.isLoading || !analyticsDetailQuery.data ? (
                <div className="py-12 text-center text-[#E2D9F3]/50">
                  <Loader2 className="w-5 h-5 animate-spin inline me-2 text-[#8B5CF6]" />
                  {t.loadingAudits}
                </div>
              ) : (
                (() => {
                  const { audit, analytics } = analyticsDetailQuery.data
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl apx-bento-card">
                          <span className="text-[#E2D9F3]/60 text-xs block">
                            {t.totalOpensCard}
                          </span>
                          <strong className="apx-serif-numeral text-2xl text-white">
                            {analytics.totalOpens}
                          </strong>
                        </div>
                        <div className="p-4 rounded-2xl apx-bento-card">
                          <span className="text-[#E2D9F3]/60 text-xs block">
                            {t.uniqueSessionsCard}
                          </span>
                          <strong className="apx-serif-numeral text-2xl text-white">
                            {analytics.uniqueSessions}
                          </strong>
                        </div>
                        <div className="p-4 rounded-2xl apx-bento-card">
                          <span className="text-[#E2D9F3]/60 text-xs block">
                            {t.avgReadCard}
                          </span>
                          <strong className="apx-serif-numeral text-2xl text-white">
                            {analytics.avgTimeSpentSec} {t.secUnit}
                          </strong>
                        </div>
                        <div className="p-4 rounded-2xl apx-bento-card">
                          <span className="text-[#E2D9F3]/60 text-xs block">
                            {t.ctaClickedLabel}
                          </span>
                          <strong className="apx-serif-numeral text-2xl text-[#4BA37A]">
                            {analytics.ctaClicksCount}
                          </strong>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl apx-bento-card space-y-3">
                        <h4 className="font-bold text-white">{t.scrollFunnelTitle}</h4>
                        {[
                          { label: '25%', count: analytics.scrollFunnel.depth25 },
                          { label: '50%', count: analytics.scrollFunnel.depth50 },
                          { label: '75%', count: analytics.scrollFunnel.depth75 },
                          { label: '100%', count: analytics.scrollFunnel.depth100 },
                        ].map((step) => {
                          const pct =
                            analytics.uniqueSessions > 0
                              ? Math.min(
                                  100,
                                  Math.round((step.count / analytics.uniqueSessions) * 100)
                                )
                              : 0
                          return (
                            <div key={step.label} className="space-y-1">
                              <div className="flex justify-between text-xs font-en">
                                <span>{step.label}</span>
                                <span>
                                  {step.count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2.5 rounded-full bg-[#080608] overflow-hidden">
                                <div
                                  className="h-full bg-[#8B5CF6] rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="p-5 rounded-2xl apx-bento-card space-y-2">
                        <h4 className="font-bold text-white">
                          {t.uploadsTitle} ({audit.uploads.length})
                        </h4>
                        {audit.uploads.length === 0 ? (
                          <p className="text-[#E2D9F3]/55 text-xs">—</p>
                        ) : (
                          <div className="space-y-2">
                            {audit.uploads.map((u) => (
                              <a
                                key={u.id}
                                href={u.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]"
                              >
                                <span className="text-white truncate">{u.fileName}</span>
                                <ExternalLink className="w-4 h-4 text-[#A78BFA] shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SettingsForm({
  initial,
  lang,
  onSave,
  isSaving,
}: {
  initial: AuditSettingsData
  lang: AdminLocale
  onSave: (data: AuditSettingsData) => void
  isSaving: boolean
}) {
  const [form, setForm] = useState<AuditSettingsData>({
    ...initial,
    acceptingClients: initial.acceptingClients ?? true,
    fomoEnabled: initial.fomoEnabled ?? true,
    fomoSeatsLeft: initial.fomoSeatsLeft ?? 3,
    fomoCountdownMinutes: initial.fomoCountdownMinutes ?? 45,
    reelsDisplayMode: initial.reelsDisplayMode || 'ALL',
    fomoUrgencyTextAr:
      initial.fomoUrgencyTextAr ||
      'العرض والأولوية متاحان لفترة محدودة — احجز جلستك الاستراتيجية قبل اكتمال المقاعد',
    fomoUrgencyTextEn:
      initial.fomoUrgencyTextEn ||
      'Priority onboarding is available for a limited time — claim your strategy session before seats fill up',
  })
  const [savedNotice, setSavedNotice] = useState(false)
  const t = ADMIN_DICTIONARY[lang]
  const dict = getDictionary(lang)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
      {/* FOMO & Client Availability Control Card */}
      <div className="p-6 rounded-3xl apx-bento-card space-y-5 border border-[#8B5CF6]/35">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#8B5CF6]/20 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">
              {lang === 'ar'
                ? 'التحكم الكامل في إتاحة الحجز واستراتيجية الـ FOMO'
                : 'Full Control: Client Availability & FOMO Strategy'}
            </h3>
            <p className="text-xs text-[#E2D9F3]/65 mt-0.5">
              {lang === 'ar'
                ? 'تحكم في حالة قبول عملاء جدد، عدد المقاعد المتبقية، ومؤقت العد التنازلي في تقارير الأوديت.'
                : 'Control whether you are currently accepting clients, remaining seats, and the live countdown timer.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30">
              <ApxSwitch
                checked={form.acceptingClients ?? true}
                onChange={(next) => setForm({ ...form, acceptingClients: next })}
              />
              <span className="text-xs font-bold text-white">
                {form.acceptingClients
                  ? lang === 'ar'
                    ? 'متاح لقبول عملاء الآن'
                    : 'Accepting Clients'
                  : lang === 'ar'
                    ? 'الحجز مغلق (قائمة انتظار)'
                    : 'Closed (Waitlist)'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30">
              <ApxSwitch
                checked={form.fomoEnabled ?? true}
                onChange={(next) => setForm({ ...form, fomoEnabled: next })}
                activeColor="bg-[#8B5CF6]"
              />
              <span className="text-xs font-bold text-white">
                {lang === 'ar' ? 'تفعيل مؤقت ومقاعد FOMO' : 'Enable FOMO Bar'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {lang === 'ar'
                ? 'عدد المقاعد المتبقية حالياً (مثلاً: 2 أو 3 مقاعد)'
                : 'Remaining Seats Count (e.g. 2 or 3)'}
            </label>
            <input
              dir="ltr"
              type="number"
              min={0}
              max={50}
              value={form.fomoSeatsLeft ?? 3}
              onChange={(e) => {
                const nextSeats = Math.max(0, parseInt(e.target.value, 10) || 0)
                const prevAr = form.fomoUrgencyTextAr || ''
                const prevEn = form.fomoUrgencyTextEn || ''
                setForm({
                  ...form,
                  fomoSeatsLeft: nextSeats,
                  fomoUrgencyTextAr: prevAr.replace(
                    /(متبقي\s+)[0-9٠-٩]+(\s*(?:مقاعد|مقعد|أماكن|فرص))/g,
                    `$1${nextSeats}$2`
                  ),
                  fomoUrgencyTextEn: prevEn.replace(
                    /(Only\s+)\d+(\s*(?:onboarding\s+)?(?:spots|seats|places))/gi,
                    `$1${nextSeats}$2`
                  ),
                })
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
            />
          </div>

          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {lang === 'ar'
                ? 'مدة العد التنازلي للعرض بالدقائق (مثلاً: 30 أو 45 دقيقة)'
                : 'Countdown Timer Duration in Minutes (e.g. 30 or 45)'}
            </label>
            <input
              dir="ltr"
              type="number"
              min={1}
              max={1440}
              value={form.fomoCountdownMinutes ?? 45}
              onChange={(e) =>
                setForm({
                  ...form,
                  fomoCountdownMinutes: Math.max(1, parseInt(e.target.value, 10) || 45),
                })
              }
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {lang === 'ar' ? 'رسالة الاستعجال (FOMO) بالعربية' : 'Arabic FOMO Urgency Copy'}
            </label>
            <input
              type="text"
              value={form.fomoUrgencyTextAr || ''}
              onChange={(e) => setForm({ ...form, fomoUrgencyTextAr: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {lang === 'ar' ? 'رسالة الاستعجال (FOMO) بالإنجليزية' : 'English FOMO Urgency Copy'}
            </label>
            <input
              dir="ltr"
              type="text"
              value={form.fomoUrgencyTextEn || ''}
              onChange={(e) => setForm({ ...form, fomoUrgencyTextEn: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
            />
          </div>
        </div>
      </div>

      {/* CTA Settings */}
      <div className="p-6 rounded-3xl apx-bento-card space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">{t.settingsTitle}</h3>
          <p className="text-xs text-[#E2D9F3]/65">{t.settingsSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {lang === 'ar'
                ? 'نظام عرض وتشريح الريلز في التقرير النهائي (Reels Display Mode)'
                : 'Reels Breakdown Display Mode in Final Report'}
            </label>
            <select
              value={form.reelsDisplayMode || 'TOP_5'}
              onChange={(e) =>
                setForm({
                  ...form,
                  reelsDisplayMode: e.target.value as
                    | 'ALL'
                    | 'LAST_10'
                    | 'TOP_3'
                    | 'TOP_4'
                    | 'TOP_5',
                })
              }
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
            >
              <option value="TOP_3">
                {lang === 'ar'
                  ? 'أفضل 3 فيديوهات بالترتيب (#1 - #3 Top Performing)'
                  : 'Top 3 Performing Reels (#1 - #3)'}
              </option>
              <option value="TOP_4">
                {lang === 'ar'
                  ? 'أفضل 4 فيديوهات بالترتيب (#1 - #4 Top Performing)'
                  : 'Top 4 Performing Reels (#1 - #4)'}
              </option>
              <option value="TOP_5">
                {lang === 'ar'
                  ? 'أفضل 5 فيديوهات بالترتيب (#1 - #5 Top Performing)'
                  : 'Top 5 Performing Reels (#1 - #5)'}
              </option>
              <option value="LAST_10">
                {lang === 'ar'
                  ? 'آخر 10 فيديوهات منشورة (Last 10 Reels)'
                  : 'Latest 10 Published Reels'}
              </option>
              <option value="ALL">
                {lang === 'ar'
                  ? 'عرض كل الفيديوهات المسحوبة من الحساب (All Account Reels)'
                  : 'Show All Scraped Account Reels'}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {t.ctaTypeLabel}
            </label>
            <select
              value={form.ctaType}
              onChange={(e) =>
                setForm({
                  ...form,
                  ctaType: e.target.value as 'BOOK_CALL' | 'WHATSAPP' | 'DM_KEYWORD',
                })
              }
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
            >
              <option value="BOOK_CALL">{t.ctaCalendly}</option>
              <option value="WHATSAPP">{t.ctaWhatsapp}</option>
              <option value="DM_KEYWORD">{t.ctaDm}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {t.bookingUrlLabel}
            </label>
            <input
              dir="ltr"
              type="text"
              value={form.bookingUrl}
              onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
            />
          </div>

          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {t.whatsappNumberLabel}
            </label>
            <input
              dir="ltr"
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
            />
          </div>

          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {t.dmKeywordLabel} / {t.instagramHandleLabel}
            </label>
            <div className="flex gap-2" dir="ltr">
              <input
                type="text"
                value={form.dmKeyword}
                onChange={(e) => setForm({ ...form, dmKeyword: e.target.value })}
                className="w-1/3 px-3 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
              />
              <input
                type="text"
                value={form.instagramHandle}
                onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                className="w-2/3 px-3 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {t.scarcityArLabel}
            </label>
            <textarea
              rows={2}
              value={form.scarcityTextAr}
              onChange={(e) => setForm({ ...form, scarcityTextAr: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-[#E2D9F3]/75 font-bold mb-1.5">
              {t.scarcityEnLabel}
            </label>
            <textarea
              dir="ltr"
              rows={2}
              value={form.scarcityTextEn}
              onChange={(e) => setForm({ ...form, scarcityTextEn: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080608] border border-[#8B5CF6]/30 text-white font-en"
            />
          </div>
        </div>
      </div>

      {/* Category Weights */}
      <div className="p-6 rounded-3xl apx-bento-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{t.weightsTitle}</h3>
          <button
            type="button"
            onClick={() =>
              setForm({ ...form, weightsJson: { ...DEFAULT_CATEGORY_WEIGHTS } })
            }
            className="text-[#A78BFA] font-bold hover:underline text-xs"
          >
            {t.resetAutoBtn}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AUDIT_CATEGORY_KEYS.map((key) => (
            <div
              key={key}
              className="p-3.5 rounded-2xl bg-[#080608]/85 border border-[#8B5CF6]/20 flex items-center justify-between gap-2"
            >
              <span className="text-xs font-bold text-white truncate">
                {dict.categories[key] || key}
              </span>
              <input
                dir="ltr"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={form.weightsJson[key] ?? DEFAULT_CATEGORY_WEIGHTS[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weightsJson: {
                      ...form.weightsJson,
                      [key]: parseFloat(e.target.value) || 1.0,
                    },
                  })
                }
                className="w-16 px-2.5 py-1.5 rounded-xl bg-[#110B1B] border border-[#8B5CF6]/30 text-center text-white font-en"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs sm:text-sm"
        >
          {t.saveSettingsBtn}
        </button>
        {savedNotice && (
          <span className="text-[#4BA37A] font-bold text-xs">{t.savedSettingsMsg}</span>
        )}
      </div>
    </form>
  )
}

export default AuditsDashboard
