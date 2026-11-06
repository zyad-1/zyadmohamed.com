import crypto from 'crypto'
import {
  AUDIT_CATEGORY_KEYS,
  AUDIT_PROFILE_CHECK_KEYS,
  AuditCategoryKey,
  AuditEventType,
  AuditSettingsData,
  AUTO_SUGGESTED_CATEGORIES,
  DEFAULT_CATEGORY_WEIGHTS,
  RecommendationSnippetInputSchema,
  SaveFullAuditInput,
} from '../schemas'
import {
  AuditMetricsReport,
  calculateAuditMetrics,
  computeMedian,
  computeWeightedOverallScore,
} from '../metrics'
import { readAuditStore, writeAuditStore } from './db'
import { createDemoAuditRecord, FullAuditRecord, SnippetRecord } from './demoSeed'
import { ReelInputSchema } from '../schemas'
import { getDatabase, saveDatabase } from '@/lib/storage'
import { z } from 'zod'

async function getUnifiedAuditSettings(baseSettings: AuditSettingsData): Promise<AuditSettingsData> {
  try {
    const db = await getDatabase()
    const s = db.siteSettings
    if (!s) return baseSettings
    return {
      ...baseSettings,
      fomoEnabled: typeof s.fomoEnabled === 'boolean' ? s.fomoEnabled : baseSettings.fomoEnabled,
      acceptingClients:
        typeof s.acceptingClients === 'boolean'
          ? s.acceptingClients
          : baseSettings.acceptingClients,
      fomoSeatsLeft:
        typeof s.fomoSeatsLeft === 'number' ? s.fomoSeatsLeft : baseSettings.fomoSeatsLeft,
      fomoCountdownMinutes:
        typeof s.fomoCountdownMinutes === 'number'
          ? s.fomoCountdownMinutes
          : baseSettings.fomoCountdownMinutes,
      fomoUrgencyTextAr:
        typeof s.fomoTextAr === 'string' && s.fomoTextAr.trim()
          ? s.fomoTextAr.trim()
          : baseSettings.fomoUrgencyTextAr,
      fomoUrgencyTextEn:
        typeof s.fomoTextEn === 'string' && s.fomoTextEn.trim()
          ? s.fomoTextEn.trim()
          : baseSettings.fomoUrgencyTextEn,
    }
  } catch {
    return baseSettings
  }
}

export function generateAuditShareToken(): string {
  // 24 bytes -> 32 base64url chars (unguessable, >24 chars per spec)
  return crypto.randomBytes(24).toString('base64url')
}

function generateId(prefix = 'aud'): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`
}

export interface AuditEngagementSummary {
  lastOpenedAt: string | null
  totalOpens: number
  uniqueSessions: number
  avgTimeSpentSec: number
  maxScrollDepth: number
  ctaClicked: boolean
  ctaClicksCount: number
  isHotLead: boolean
  uploadsCount: number
  scrollFunnel: {
    depth25: number
    depth50: number
    depth75: number
    depth100: number
  }
  sectionViews: Record<string, { views: number; totalSec: number }>
  languageToggles: number
}

export function computeEngagementSummary(audit: FullAuditRecord): AuditEngagementSummary {
  const events = audit.events || []
  const openEvents = events.filter((e) => e.type === 'OPEN')
  const totalOpens = openEvents.length

  const sortedOpens = [...openEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const lastOpenedAt = sortedOpens[0]?.createdAt ?? null

  const sessionMap = new Map<string, { maxElapsed: number; maxDepth: number }>()
  const sectionViews: Record<string, { views: number; totalSec: number }> = {}
  let ctaClicksCount = 0
  let languageToggles = 0

  for (const ev of events) {
    const sess = sessionMap.get(ev.sessionId) || { maxElapsed: 0, maxDepth: 0 }
    const elapsed = Number(ev.payload?.elapsedSec ?? 0)
    if (Number.isFinite(elapsed) && elapsed > sess.maxElapsed) {
      sess.maxElapsed = elapsed
    }

    if (ev.type === 'SCROLL_DEPTH') {
      const depth = Number(ev.payload?.depth ?? 0)
      if (Number.isFinite(depth) && depth > sess.maxDepth) {
        sess.maxDepth = depth
      }
    }

    if (ev.type === 'SECTION_VIEW') {
      const secName = String(ev.payload?.section || 'overview')
      const dwell = Number(ev.payload?.dwellSec ?? 8)
      if (!sectionViews[secName]) {
        sectionViews[secName] = { views: 0, totalSec: 0 }
      }
      sectionViews[secName].views += 1
      sectionViews[secName].totalSec += Number.isFinite(dwell) ? dwell : 8
    }

    if (ev.type === 'CTA_CLICK') {
      ctaClicksCount += 1
    }

    if (ev.type === 'LANGUAGE_TOGGLE') {
      languageToggles += 1
    }

    sessionMap.set(ev.sessionId, sess)
  }

  const sessions = Array.from(sessionMap.values())
  const uniqueSessions = sessions.length
  const avgTimeSpentSec =
    uniqueSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.maxElapsed, 0) / uniqueSessions)
      : 0

  const maxScrollDepth =
    sessions.length > 0 ? Math.max(...sessions.map((s) => s.maxDepth), 0) : 0

  const depth25 = sessions.filter((s) => s.maxDepth >= 25).length
  const depth50 = sessions.filter((s) => s.maxDepth >= 50).length
  const depth75 = sessions.filter((s) => s.maxDepth >= 75).length
  const depth100 = sessions.filter((s) => s.maxDepth >= 100).length

  const ctaClicked = ctaClicksCount > 0
  const uploadsCount = (audit.uploads || []).length

  // Hot Lead criteria (Section 8A): opens 2+ times OR reaches 100% depth OR clicks CTA OR uploads Insights
  const isHotLead = totalOpens >= 2 || maxScrollDepth >= 100 || ctaClicked || uploadsCount > 0

  return {
    lastOpenedAt,
    totalOpens,
    uniqueSessions,
    avgTimeSpentSec,
    maxScrollDepth,
    ctaClicked,
    ctaClicksCount,
    isHotLead,
    uploadsCount,
    scrollFunnel: {
      depth25,
      depth50,
      depth75,
      depth100,
    },
    sectionViews,
    languageToggles,
  }
}

export async function listAuditsWithAnalytics(filter?: {
  search?: string
  status?: string
}) {
  const store = await readAuditStore()
  const q = (filter?.search || '').trim().toLowerCase()
  const statusFilter = filter?.status && filter.status !== 'ALL' ? filter.status : null

  return store.audits
    .filter((a) => {
      if (statusFilter && a.status !== statusFilter) return false
      if (!q) return true
      return (
        a.prospect.handle.toLowerCase().includes(q) ||
        a.prospect.displayName.toLowerCase().includes(q) ||
        a.prospect.niche.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((audit) => ({
      id: audit.id,
      status: audit.status,
      language: audit.language,
      shareToken: audit.shareToken,
      overallScore: audit.overallScore,
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
      publishedAt: audit.publishedAt,
      expiresAt: audit.expiresAt,
      prospect: audit.prospect,
      analytics: computeEngagementSummary(audit),
    }))
}

export async function getAuditById(id: string): Promise<{
  audit: FullAuditRecord
  metrics: AuditMetricsReport
  analytics: AuditEngagementSummary
  settings: AuditSettingsData
} | null> {
  const store = await readAuditStore()
  const audit = store.audits.find((a) => a.id === id)
  if (!audit) return null

  // Backfill visual demo fields if loading an older demo audit snapshot
  if (audit.id === 'demo-audit-001' && !audit.prospect.avatarUrl) {
    const freshDemo = createDemoAuditRecord()
    audit.prospect.avatarUrl = freshDemo.prospect.avatarUrl
    audit.prospect.bio = audit.prospect.bio || freshDemo.prospect.bio
    audit.prospect.bioLinks = audit.prospect.bioLinks || freshDemo.prospect.bioLinks
    audit.reels = audit.reels.map((r, idx) => {
      const demoReel = freshDemo.reels[idx]
      if (!demoReel) return r
      return {
        ...r,
        thumbnailUrl: r.thumbnailUrl || demoReel.thumbnailUrl,
        caption: r.caption || demoReel.caption,
        pros: r.pros || demoReel.pros,
        cons: r.cons || demoReel.cons,
      }
    })
  }

  const metrics = calculateAuditMetrics({
    followers: audit.prospect.followers,
    reels: audit.reels,
    competitors: audit.competitors,
  })

  return {
    audit,
    metrics,
    analytics: computeEngagementSummary(audit),
    settings: await getUnifiedAuditSettings(store.settings),
  }
}

/**
 * Returns public report data by shareToken.
 * Strictly strips internal admin notes (`prospect.notes`) per Hard Rule #4.
 */
export async function getPublicAuditByToken(
  token: string,
  options?: { allowPreview?: boolean }
) {
  const store = await readAuditStore()
  const audit = store.audits.find((a) => a.shareToken === token || a.id === token)
  if (!audit) {
    return { status: 'NOT_FOUND' as const, data: null }
  }

  if (!options?.allowPreview) {
    if (audit.status !== 'PUBLISHED') {
      return { status: 'UNPUBLISHED' as const, data: null }
    }

    if (audit.expiresAt && new Date(audit.expiresAt).getTime() < Date.now()) {
      return { status: 'EXPIRED' as const, data: null }
    }
  }

  // Backfill visual demo fields if loading an older demo audit snapshot
  if (audit.id === 'demo-audit-001' && !audit.prospect.avatarUrl) {
    const freshDemo = createDemoAuditRecord()
    audit.prospect.avatarUrl = freshDemo.prospect.avatarUrl
    audit.prospect.bio = audit.prospect.bio || freshDemo.prospect.bio
    audit.prospect.bioLinks = audit.prospect.bioLinks || freshDemo.prospect.bioLinks
    audit.reels = audit.reels.map((r, idx) => {
      const demoReel = freshDemo.reels[idx]
      if (!demoReel) return r
      return {
        ...r,
        thumbnailUrl: r.thumbnailUrl || demoReel.thumbnailUrl,
        caption: r.caption || demoReel.caption,
        pros: r.pros || demoReel.pros,
        cons: r.cons || demoReel.cons,
      }
    })
  }

  const metrics = calculateAuditMetrics({
    followers: audit.prospect.followers,
    reels: audit.reels,
    competitors: audit.competitors,
  })

  // Sanitize prospect so admin-only notes are never exposed publicly
  const publicProspect = {
    handle: audit.prospect.handle,
    displayName: audit.prospect.displayName,
    niche: audit.prospect.niche,
    followers: audit.prospect.followers,
    followingCount: audit.prospect.followingCount,
    postsCount: audit.prospect.postsCount,
    profileUrl: audit.prospect.profileUrl,
    linkInBioUrl: audit.prospect.linkInBioUrl,
    avatarUrl: audit.prospect.avatarUrl ?? null,
    bio: audit.prospect.bio ?? null,
    bioLinks: audit.prospect.bioLinks ?? [],
  }

  return {
    status: 'OK' as const,
    data: {
      id: audit.id,
      shareToken: audit.shareToken,
      language: audit.language,
      overallScore: audit.overallScore,
      summaryOpening: audit.summaryOpening,
      verdictLine: audit.verdictLine,
      publishedAt: audit.publishedAt,
      prospect: publicProspect,
      profileChecks: audit.profileChecks,
      categoryScores: audit.categoryScores,
      findings: [...audit.findings].sort((a, b) => a.rank - b.rank),
      competitors: audit.competitors,
      unmeasuredItems: [...audit.unmeasuredItems].sort((a, b) => a.position - b.position),
      metrics,
      settings: await getUnifiedAuditSettings(store.settings),
    },
  }
}

export async function createDraftAudit(input: {
  handle: string
  displayName: string
  niche: string
  followers: number
  followingCount?: number | null
  postsCount?: number | null
  linkInBioUrl?: string | null
  avatarUrl?: string | null
  bio?: string | null
  bioLinks?: Array<{ title: string; url: string }>
  reels?: Array<z.infer<typeof ReelInputSchema>>
}): Promise<FullAuditRecord> {
  const store = await readAuditStore()
  const cleanHandle = input.handle.replace(/^@/, '').trim()

  // Prevent duplicate audit creation on double-submit or rapid clicks within 15 seconds
  const recentDuplicate = store.audits.find(
    (a) =>
      a.prospect.handle.toLowerCase() === cleanHandle.toLowerCase() &&
      Date.now() - new Date(a.createdAt).getTime() < 15000
  )
  if (recentDuplicate) {
    return recentDuplicate
  }

  const now = new Date().toISOString()
  const defaultSevenDaysExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const auditId = generateId('audit')
  const prospectId = generateId('prosp')

  const initialReels: FullAuditRecord['reels'] = (input.reels || []).map((r, rIdx) => ({
    id: r.id || generateId('reel'),
    auditId,
    shortcode: r.shortcode ?? null,
    url: r.url || null,
    thumbnailUrl: r.thumbnailUrl ?? null,
    caption: r.caption ?? null,
    postedAt: typeof r.postedAt === 'string' ? r.postedAt : new Date(r.postedAt).toISOString(),
    views: Math.max(0, Math.round(r.views || 0)),
    viewsEstimated: r.viewsEstimated ?? false,
    likes: Math.max(0, Math.round(r.likes || 0)),
    comments: Math.max(0, Math.round(r.comments || 0)),
    shares: r.shares ?? null,
    saves: r.saves ?? null,
    durationSec: r.durationSec ?? null,
    topic: r.topic ?? null,
    hookType: r.hookType ?? null,
    hasSubtitles: r.hasSubtitles ?? null,
    hasCta: r.hasCta ?? null,
    isRepost: r.isRepost ?? false,
    demandSignalsCount: Math.max(0, Math.round(r.demandSignalsCount || 0)),
    pros: r.pros ?? null,
    cons: r.cons ?? null,
    editorNotes: r.editorNotes || '',
    position: r.position || rIdx + 1,
  }))

  const initialMetrics = calculateAuditMetrics({
    followers: input.followers,
    reels: initialReels,
    competitors: [],
  })

  const categoryScores: FullAuditRecord['categoryScores'] = AUDIT_CATEGORY_KEYS.map((key) => {
    const isAuto = AUTO_SUGGESTED_CATEGORIES.includes(key)
    const autoObj = isAuto
      ? initialMetrics.autoSuggestedScores[
          key as 'content_system' | 'reach_efficiency' | 'competitor_gap'
        ]
      : null
    return {
      id: generateId('cs'),
      auditId,
      categoryKey: key,
      score: autoObj ? autoObj.score : 5,
      autoSuggestedScore: autoObj ? autoObj.score : null,
      isAutoSuggested: isAuto,
      isOverridden: false,
      evidence: autoObj
        ? autoObj.evidenceAr
        : 'تم تقييم هذا المحور بناءً على الفحص الخارجي للحساب ومؤشرات الأداء المرصودة.',
      recommendation: autoObj
        ? autoObj.recommendationAr
        : 'بناء مسار واضح وممنهج لرفع كفاءة هذا المحور ضمن الـ System خلال 90 يوماً.',
      weight: store.settings.weightsJson[key] ?? DEFAULT_CATEGORY_WEIGHTS[key] ?? 1.0,
    }
  })

  const profileChecks: FullAuditRecord['profileChecks'] = AUDIT_PROFILE_CHECK_KEYS.map((key) => ({
    id: generateId('pc'),
    auditId,
    key,
    status: 'WEAK',
    evidence: '',
    screenshotUrl: null,
  }))

  const findings: FullAuditRecord['findings'] = [1, 2, 3].map((rank) => ({
    id: generateId('find'),
    auditId,
    rank,
    title: `المشكلة الرئيسية #${rank}`,
    evidence: 'أدخل الدليل الرقمي المرصود من الحساب هنا...',
    businessImpact: 'أدخل تأثير هذه المشكلة على المبيعات والعملاء المحتملين...',
    apxFix: 'أدخل كيف تقوم منظومة APX بحل هذه المشكلة خلال 90 يوماً...',
    severity: rank === 1 ? 'CRITICAL' : 'HIGH',
  }))

  const unmeasuredItems: FullAuditRecord['unmeasuredItems'] = (
    store.settings.defaultUnmeasuredJson || []
  ).map((u, idx) => ({
    id: generateId('unm'),
    auditId,
    label: u.label,
    whyItMatters: u.whyItMatters,
    position: idx + 1,
  }))

  const overallScore = computeWeightedOverallScore(categoryScores, store.settings.weightsJson)

  const newAudit: FullAuditRecord = {
    id: auditId,
    prospectId,
    status: 'DRAFT',
    language: store.settings.defaultLanguage || 'ar',
    shareToken: generateAuditShareToken(),
    publishedAt: null,
    expiresAt: defaultSevenDaysExpiry,
    overallScore,
    summaryOpening:
      'تمتلك خبرة واضحة وحضوراً مهنياً قوياً أمام الكاميرا، لكن الحساب حالياً يعمل بدون منظومة تحويل تلتقط المشاهدين المهتمين.',
    verdictLine:
      'خبرة مهنية حقيقية، لكن منظومة المحتوى ومسار التحويل في البايو يسربان عملاء محتملين يومياً.',
    createdAt: now,
    updatedAt: now,
    prospect: {
      id: prospectId,
      handle: cleanHandle,
      displayName: input.displayName,
      niche: input.niche,
      followers: input.followers,
      followingCount: input.followingCount ?? null,
      postsCount: input.postsCount ?? null,
      profileUrl: `https://instagram.com/${cleanHandle}`,
      linkInBioUrl: input.linkInBioUrl ?? null,
      avatarUrl: input.avatarUrl ?? null,
      bio: input.bio ?? null,
      bioLinks: input.bioLinks ?? [],
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
    reels: initialReels,
    profileChecks,
    categoryScores,
    findings,
    competitors: [],
    unmeasuredItems,
    events: [],
    uploads: [],
  }

  store.audits.unshift(newAudit)
  await writeAuditStore(store)
  return newAudit
}

export async function saveFullAudit(input: SaveFullAuditInput): Promise<{
  audit: FullAuditRecord
  metrics: AuditMetricsReport
}> {
  const store = await readAuditStore()
  const idx = store.audits.findIndex((a) => a.id === input.id)
  if (idx === -1) {
    throw new Error('Audit not found')
  }

  const existing = store.audits[idx]
  const now = new Date().toISOString()

  // Normalize competitors and compute their medianViews from their reels if present
  const updatedCompetitors: FullAuditRecord['competitors'] = input.competitors.map((c) => {
    const compId = c.id || generateId('comp')
    const compReels = (c.reels || []).map((r) => ({
      id: r.id || generateId('creel'),
      competitorId: compId,
      postedAt:
        typeof r.postedAt === 'string' ? r.postedAt : new Date(r.postedAt).toISOString(),
      views: Math.max(0, Math.round(r.views || 0)),
      likes: Math.max(0, Math.round(r.likes || 0)),
      comments: Math.max(0, Math.round(r.comments || 0)),
    }))
    const computedCompMedian =
      compReels.length > 0
        ? Math.round(computeMedian(compReels.map((r) => r.views)))
        : Math.max(0, Math.round(c.medianViews || 0))

    return {
      id: compId,
      auditId: existing.id,
      handle: c.handle.replace(/^@/, '').trim(),
      displayName: c.displayName || `@${c.handle.replace(/^@/, '').trim()}`,
      followers: Math.max(1, Math.round(c.followers || 1)),
      medianViews: computedCompMedian,
      notes: c.notes || '',
      reels: compReels,
    }
  })

  const updatedReels: FullAuditRecord['reels'] = input.reels.map((r, rIdx) => ({
    id: r.id || generateId('reel'),
    auditId: existing.id,
    shortcode: r.shortcode ?? null,
    url: r.url || null,
    thumbnailUrl: r.thumbnailUrl ?? null,
    caption: r.caption ?? null,
    postedAt: typeof r.postedAt === 'string' ? r.postedAt : new Date(r.postedAt).toISOString(),
    views: Math.max(0, Math.round(r.views || 0)),
    viewsEstimated: r.viewsEstimated ?? false,
    likes: Math.max(0, Math.round(r.likes || 0)),
    comments: Math.max(0, Math.round(r.comments || 0)),
    shares: r.shares ?? null,
    saves: r.saves ?? null,
    durationSec: r.durationSec ?? null,
    topic: r.topic ?? null,
    hookType: r.hookType ?? null,
    hasSubtitles: r.hasSubtitles ?? null,
    hasCta: r.hasCta ?? null,
    isRepost: r.isRepost ?? false,
    demandSignalsCount: Math.max(0, Math.round(r.demandSignalsCount || 0)),
    pros: r.pros ?? null,
    cons: r.cons ?? null,
    editorNotes: r.editorNotes || '',
    position: r.position || rIdx + 1,
  }))

  // Run metrics engine to refresh auto-suggested categories 4, 5, 9
  const metrics = calculateAuditMetrics({
    followers: input.prospect.followers,
    reels: updatedReels,
    competitors: updatedCompetitors,
  })

  const updatedCategoryScores: FullAuditRecord['categoryScores'] = input.categoryScores.map(
    (cs) => {
      const isAutoKey = AUTO_SUGGESTED_CATEGORIES.includes(cs.categoryKey)
      const autoSuggestion = isAutoKey
        ? metrics.autoSuggestedScores[
            cs.categoryKey as 'content_system' | 'reach_efficiency' | 'competitor_gap'
          ]
        : null

      const autoScore = autoSuggestion ? autoSuggestion.score : null
      const finalScore =
        isAutoKey && !cs.isOverridden && autoScore !== null ? autoScore : cs.score
      const isOverridden = isAutoKey && autoScore !== null && finalScore !== autoScore

      return {
        id: generateId('cs'),
        auditId: existing.id,
        categoryKey: cs.categoryKey,
        score: finalScore,
        autoSuggestedScore: autoScore,
        isAutoSuggested: isAutoKey,
        isOverridden,
        evidence:
          cs.evidence?.trim() ||
          (autoSuggestion ? autoSuggestion.evidenceAr : ''),
        recommendation:
          cs.recommendation?.trim() ||
          (autoSuggestion ? autoSuggestion.recommendationAr : ''),
        weight:
          store.settings.weightsJson[cs.categoryKey] ??
          cs.weight ??
          DEFAULT_CATEGORY_WEIGHTS[cs.categoryKey] ??
          1.0,
      }
    }
  )

  const overallScore = computeWeightedOverallScore(
    updatedCategoryScores,
    store.settings.weightsJson
  )

  const updatedAudit: FullAuditRecord = {
    ...existing,
    language: input.language,
    summaryOpening: input.summaryOpening,
    verdictLine: input.verdictLine,
    expiresAt: input.expiresAt || null,
    overallScore,
    updatedAt: now,
    prospect: {
      ...existing.prospect,
      handle: input.prospect.handle.replace(/^@/, '').trim(),
      displayName: input.prospect.displayName,
      niche: input.prospect.niche,
      followers: input.prospect.followers,
      followingCount: input.prospect.followingCount ?? null,
      postsCount: input.prospect.postsCount ?? null,
      profileUrl:
        input.prospect.profileUrl ||
        `https://instagram.com/${input.prospect.handle.replace(/^@/, '').trim()}`,
      linkInBioUrl: input.prospect.linkInBioUrl ?? null,
      avatarUrl: input.prospect.avatarUrl ?? existing.prospect.avatarUrl ?? null,
      bio: input.prospect.bio ?? existing.prospect.bio ?? null,
      bioLinks: input.prospect.bioLinks ?? existing.prospect.bioLinks ?? [],
      notes: input.prospect.notes || '',
      updatedAt: now,
    },
    reels: updatedReels,
    profileChecks: input.profileChecks.map((pc) => ({
      id: generateId('pc'),
      auditId: existing.id,
      key: pc.key,
      status: pc.status,
      evidence: pc.evidence || '',
      screenshotUrl: pc.screenshotUrl ?? null,
    })),
    categoryScores: updatedCategoryScores,
    findings: input.findings.map((f) => ({
      id: generateId('find'),
      auditId: existing.id,
      rank: f.rank,
      title: f.title,
      evidence: f.evidence,
      businessImpact: f.businessImpact,
      apxFix: f.apxFix,
      severity: f.severity,
    })),
    competitors: updatedCompetitors,
    unmeasuredItems: input.unmeasuredItems.map((u, uIdx) => ({
      id: u.id || generateId('unm'),
      auditId: existing.id,
      label: u.label,
      whyItMatters: u.whyItMatters,
      position: u.position || uIdx + 1,
    })),
  }

  store.audits[idx] = updatedAudit
  await writeAuditStore(store)

  return { audit: updatedAudit, metrics }
}

export async function publishAudit(params: {
  id: string
  expiresAt?: string | null
}): Promise<FullAuditRecord> {
  const store = await readAuditStore()
  const audit = store.audits.find((a) => a.id === params.id)
  if (!audit) throw new Error('Audit not found')

  // Auto-fill default evidence if any category has empty evidence so publishing never fails
  audit.categoryScores = audit.categoryScores.map((cs) => ({
    ...cs,
    evidence:
      cs.evidence && cs.evidence.trim().length >= 3
        ? cs.evidence
        : 'تم التقييم بناءً على الفحص الخارجي للحساب ومؤشرات الأداء المرصودة.',
    recommendation:
      cs.recommendation && cs.recommendation.trim().length >= 3
        ? cs.recommendation
        : 'تطوير هذا المحور ضمن الـ System المتكامل لرفع كفاءة التحويل.',
  }))

  const now = new Date().toISOString()
  audit.status = 'PUBLISHED'
  audit.publishedAt = now
  audit.updatedAt = now
  if (params.expiresAt !== undefined) {
    audit.expiresAt = params.expiresAt
  } else if (!audit.expiresAt) {
    audit.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  await writeAuditStore(store)
  return audit
}

export async function unpublishAudit(id: string): Promise<FullAuditRecord> {
  const store = await readAuditStore()
  const audit = store.audits.find((a) => a.id === id)
  if (!audit) throw new Error('Audit not found')

  audit.status = 'DRAFT'
  audit.updatedAt = new Date().toISOString()
  await writeAuditStore(store)
  return audit
}

export async function regenerateShareToken(id: string): Promise<FullAuditRecord> {
  const store = await readAuditStore()
  const audit = store.audits.find((a) => a.id === id)
  if (!audit) throw new Error('Audit not found')

  audit.shareToken = generateAuditShareToken()
  audit.updatedAt = new Date().toISOString()
  await writeAuditStore(store)
  return audit
}

export async function duplicateAudit(id: string): Promise<FullAuditRecord> {
  const store = await readAuditStore()
  const source = store.audits.find((a) => a.id === id)
  if (!source) throw new Error('Audit not found')

  const now = new Date().toISOString()
  const newAuditId = generateId('audit')
  const newProspectId = generateId('prosp')

  const cloned: FullAuditRecord = {
    ...JSON.parse(JSON.stringify(source)),
    id: newAuditId,
    prospectId: newProspectId,
    status: 'DRAFT',
    shareToken: generateAuditShareToken(),
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    prospect: {
      ...source.prospect,
      id: newProspectId,
      displayName: `${source.prospect.displayName} (Copy)`,
      createdAt: now,
      updatedAt: now,
    },
    events: [],
    uploads: [],
  }

  store.audits.unshift(cloned)
  await writeAuditStore(store)
  return cloned
}

export async function archiveAudit(id: string): Promise<FullAuditRecord> {
  const store = await readAuditStore()
  const audit = store.audits.find((a) => a.id === id)
  if (!audit) throw new Error('Audit not found')
  audit.status = audit.status === 'ARCHIVED' ? 'DRAFT' : 'ARCHIVED'
  audit.updatedAt = new Date().toISOString()
  await writeAuditStore(store)
  return audit
}

export async function deleteAudit(id: string): Promise<{ success: boolean }> {
  const store = await readAuditStore()
  store.audits = store.audits.filter((a) => a.id !== id)
  await writeAuditStore(store)
  return { success: true }
}

export async function trackAuditEvent(params: {
  token: string
  sessionId: string
  type: AuditEventType
  payload: Record<string, unknown>
}): Promise<{ recorded: boolean }> {
  const store = await readAuditStore()
  const audit = store.audits.find((a) => a.shareToken === params.token)
  if (!audit || audit.status !== 'PUBLISHED') {
    return { recorded: false }
  }

  // Cap at 150 events per session to prevent beacon spam
  const sessionEventsCount = audit.events.filter((e) => e.sessionId === params.sessionId).length
  if (sessionEventsCount >= 150) {
    return { recorded: false }
  }

  audit.events.push({
    id: generateId('ev'),
    auditId: audit.id,
    sessionId: params.sessionId,
    type: params.type,
    payload: params.payload || {},
    createdAt: new Date().toISOString(),
  })

  await writeAuditStore(store)
  return { recorded: true }
}

export async function recordAuditUpload(params: {
  token: string
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  notes?: string
  sessionId?: string
}) {
  const store = await readAuditStore()
  const audit = store.audits.find((a) => a.shareToken === params.token)
  if (!audit) throw new Error('Audit not found')

  const now = new Date().toISOString()
  const upload = {
    id: generateId('upl'),
    auditId: audit.id,
    fileUrl: params.fileUrl,
    fileName: params.fileName,
    fileSize: params.fileSize,
    mimeType: params.mimeType,
    notes: params.notes || null,
    createdAt: now,
  }

  audit.uploads.push(upload)
  audit.events.push({
    id: generateId('ev'),
    auditId: audit.id,
    sessionId: params.sessionId || 'upload-session',
    type: 'UNLOCK_UPLOAD',
    payload: { fileName: params.fileName, fileUrl: params.fileUrl },
    createdAt: now,
  })

  await writeAuditStore(store)
  return upload
}

export async function listSnippets(): Promise<SnippetRecord[]> {
  const store = await readAuditStore()
  return store.snippets
}

export async function saveSnippet(
  input: z.infer<typeof RecommendationSnippetInputSchema>
): Promise<SnippetRecord> {
  const store = await readAuditStore()
  const now = new Date().toISOString()
  if (input.id) {
    const idx = store.snippets.findIndex((s) => s.id === input.id)
    if (idx !== -1) {
      store.snippets[idx] = {
        ...store.snippets[idx],
        ...input,
        id: input.id,
        updatedAt: now,
      }
      await writeAuditStore(store)
      return store.snippets[idx]
    }
  }

  const created: SnippetRecord = {
    id: generateId('snip'),
    categoryKey: input.categoryKey,
    problemPattern: input.problemPattern,
    titleAr: input.titleAr,
    titleEn: input.titleEn,
    bodyAr: input.bodyAr,
    bodyEn: input.bodyEn,
    impactAr: input.impactAr || '',
    impactEn: input.impactEn || '',
    createdAt: now,
    updatedAt: now,
  }
  store.snippets.unshift(created)
  await writeAuditStore(store)
  return created
}

export async function deleteSnippet(id: string): Promise<{ success: boolean }> {
  const store = await readAuditStore()
  store.snippets = store.snippets.filter((s) => s.id !== id)
  await writeAuditStore(store)
  return { success: true }
}

export async function getAuditSettings(): Promise<AuditSettingsData> {
  const store = await readAuditStore()
  return getUnifiedAuditSettings(store.settings)
}

export async function saveAuditSettings(input: AuditSettingsData): Promise<AuditSettingsData> {
  const store = await readAuditStore()
  store.settings = {
    ...store.settings,
    ...input,
    id: 'default',
    updatedAt: new Date().toISOString(),
  }
  await writeAuditStore(store)

  // Synchronize FOMO settings to main siteSettings so Main Page & Audit Page are always 100% unified
  try {
    const db = await getDatabase()
    if (db.siteSettings) {
      db.siteSettings = {
        ...db.siteSettings,
        fomoEnabled: store.settings.fomoEnabled ?? db.siteSettings.fomoEnabled,
        acceptingClients: store.settings.acceptingClients ?? db.siteSettings.acceptingClients,
        fomoSeatsLeft: store.settings.fomoSeatsLeft ?? db.siteSettings.fomoSeatsLeft,
        fomoCountdownMinutes:
          store.settings.fomoCountdownMinutes ?? db.siteSettings.fomoCountdownMinutes,
        fomoTextAr: store.settings.fomoUrgencyTextAr || db.siteSettings.fomoTextAr,
        fomoTextEn: store.settings.fomoUrgencyTextEn || db.siteSettings.fomoTextEn,
      }
      await saveDatabase(db)
    }
  } catch (e) {
    console.error('Failed to sync FOMO settings to siteSettings:', e)
  }

  return store.settings
}
