import {
  AuditCategoryKey,
  AuditHookType,
  DEFAULT_CATEGORY_WEIGHTS,
  STRONG_HOOK_TYPES,
} from '../schemas'
import { normalizeToWesternDigits } from '../i18n'

// ============================================================================
// TYPES
// ============================================================================

export interface BilingualExplanation {
  ar: string
  en: string
}

export interface MetricWithExplanation<T> {
  value: T
  isEstimate: boolean
  explanation: BilingualExplanation
}

export interface ReelMetricInput {
  id?: string
  shortcode?: string | null
  url?: string | null
  thumbnailUrl?: string | null
  caption?: string | null
  postedAt: string | Date
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
  demandSignalsCount?: number
  pros?: string | null
  cons?: string | null
  editorNotes?: string
}

export interface CompetitorMetricInput {
  id?: string
  handle: string
  displayName?: string
  followers: number
  medianViews?: number
  notes?: string
  reels?: Array<{
    postedAt: string | Date
    views: number
    likes?: number
    comments?: number
  }>
}

export type ConsistencyLabel = 'CONSISTENT' | 'MODERATE' | 'IRREGULAR' | 'INACTIVE'
export type VelocityTrend = 'UP' | 'FLAT' | 'DOWN'
export type ScoreBandStatus = 'weak' | 'warning' | 'strong'
export type ReelPerformanceTier = 'VIRAL' | 'ABOVE_AVERAGE' | 'AVERAGE' | 'UNDERPERFORMING'

export interface AccountReelsTotals {
  totalViews: number
  averageViews: number
  totalLikes: number
  averageLikes: number
  totalComments: number
  averageComments: number
  totalShares: number
  averageShares: number
  totalSaves: number
  averageSaves: number
  totalReposts: number
  totalInteractions: number
  overallEngagementPct: number
  viralCount: number
  aboveAverageCount: number
  averageCount: number
  underperformingCount: number
}

export interface PostingConsistencyResult {
  postsPerMonth: number
  longestGapDays: number
  stdDevGapDays: number
  averageGapDays: number
  label: ConsistencyLabel
}

export interface TrendResult {
  direction: VelocityTrend
  changePercent: number
  recentMedian: number
  previousMedian: number
  slopePerPost: number
}

export interface HookAndEditingBreakdown {
  strongHookSharePct: number
  strongHookCount: number
  taggedHookCount: number
  subtitlesSharePct: number
  ctaSharePct: number
  repostCount: number
}

export interface CompetitorGapItem {
  handle: string
  displayName: string
  followers: number
  medianViews: number
  reachEfficiencyRatio: number
  reachEfficiencyPct: number
  multiplierVsProspect: number // e.g. 3.4 means competitor gets 3.4x more views per follower
  explanation: BilingualExplanation
}

export interface OpportunityEstimateResult {
  topQuartileViews: number
  currentMedianViews: number
  extraViewsPerPost: number
  extraViewsPerMonthAt12Posts: number
  upliftMultiplier: number
}

export interface PerReelComputed {
  index: number
  id?: string
  shortcode?: string | null
  url?: string | null
  thumbnailUrl?: string | null
  caption?: string | null
  topic?: string | null
  durationSec?: number | null
  postedAtIso: string
  views: number
  viewsEstimated?: boolean | null
  likes: number
  comments: number
  shares: number
  sharesEstimated?: boolean
  saves: number
  savesEstimated?: boolean
  repostsCount: number
  totalInteractions: number
  engagementRatePct: number
  fullEngagementRatePct: number
  vsMedianMultiplier: number
  performanceRank: number
  performanceTier: ReelPerformanceTier
  isTopOutlier: boolean
  isAboveMedian: boolean
  hookType?: AuditHookType | null
  hasSubtitles?: boolean | null
  hasCta?: boolean | null
  isRepost?: boolean | null
  demandSignalsCount: number
  pros?: string | null
  cons?: string | null
  editorNotes: string
  parsedNotes: Array<{ timestamp: string | null; seconds: number | null; text: string }>
}

export interface AutoSuggestedCategory {
  categoryKey: 'content_system' | 'reach_efficiency' | 'competitor_gap'
  score: number
  evidenceAr: string
  evidenceEn: string
  recommendationAr: string
  recommendationEn: string
}

export interface AuditMetricsReport {
  reelCount: number
  followers: number
  medianViews: MetricWithExplanation<number>
  maxViews: number
  minViews: number
  accountTotals: AccountReelsTotals
  reachEfficiency: MetricWithExplanation<{ ratio: number; percent: number }>
  outlierRatio: MetricWithExplanation<number>
  engagementRateOnViews: MetricWithExplanation<{ medianPct: number; perReelPct: number[] }>
  postingConsistency: MetricWithExplanation<PostingConsistencyResult>
  trend: MetricWithExplanation<TrendResult>
  hookQualityShare: MetricWithExplanation<HookAndEditingBreakdown>
  commentDemandSignals: MetricWithExplanation<{ totalSignals: number; reelsWithSignals: number }>
  competitorGap: MetricWithExplanation<{
    items: CompetitorGapItem[]
    averageCompetitorMultiplier: number
  }>
  opportunityEstimator: MetricWithExplanation<OpportunityEstimateResult>
  reelsComputed: PerReelComputed[]
  autoSuggestedScores: Record<'content_system' | 'reach_efficiency' | 'competitor_gap', AutoSuggestedCategory>
}

// ============================================================================
// PURE STATISTICAL HELPERS
// ============================================================================

/**
 * Computes the exact statistical MEDIAN (never mean).
 * Returns 0 for empty arrays.
 */
export function computeMedian(values: number[]): number {
  const valid = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (valid.length === 0) return 0
  const mid = Math.floor(valid.length / 2)
  if (valid.length % 2 === 1) {
    return valid[mid]
  }
  return (valid[mid - 1] + valid[mid]) / 2
}

/**
 * Computes any quantile `q` in [0, 1] using linear interpolation.
 */
export function computeQuantile(values: number[], q: number): number {
  const valid = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (valid.length === 0) return 0
  if (valid.length === 1) return valid[0]
  const clampedQ = Math.max(0, Math.min(1, q))
  const pos = (valid.length - 1) * clampedQ
  const base = Math.floor(pos)
  const rest = pos - base
  if (valid[base + 1] !== undefined) {
    return valid[base] + rest * (valid[base + 1] - valid[base])
  }
  return valid[base]
}

/**
 * Population standard deviation.
 */
export function computeStdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Maps a 0-10 category score to its semantic status band.
 * 0-3 weak, 4-6 needs work (warning), 7-10 strong.
 */
export function getScoreBandStatus(score: number): ScoreBandStatus {
  if (score <= 3) return 'weak'
  if (score <= 6) return 'warning'
  return 'strong'
}

/**
 * Computes the weighted 0-100 overall score from the 9 category scores (each 0-10).
 */
export function computeWeightedOverallScore(
  categories: Array<{ categoryKey: AuditCategoryKey; score: number; weight?: number }>,
  customWeights?: Partial<Record<AuditCategoryKey, number>>
): number {
  if (categories.length === 0) return 0
  let weightedSum = 0
  let totalWeight = 0

  for (const item of categories) {
    const clampedScore = Math.max(0, Math.min(10, item.score))
    const weight =
      customWeights?.[item.categoryKey] ??
      item.weight ??
      DEFAULT_CATEGORY_WEIGHTS[item.categoryKey] ??
      1.0
    if (weight > 0) {
      weightedSum += clampedScore * weight
      totalWeight += weight
    }
  }

  if (totalWeight <= 0) return 0
  // Each category is 0..10, so (weightedSum / totalWeight) * 10 gives 0..100
  return Math.round((weightedSum / totalWeight) * 10)
}

/**
 * Parses timestamped editor notes like:
 * "0:02 — starts with filler word | 0:09 — no visual change"
 * or multiline notes with "0:02", "00:14", "[0:03]".
 */
export function parseEditorNotesTimestamps(
  notes: string
): Array<{ timestamp: string | null; seconds: number | null; text: string }> {
  const cleaned = (notes ?? '').trim()
  if (!cleaned) return []

  const segments = cleaned
    .split(/\r?\n|\s*\|\s*|;\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

  return segments.map((seg) => {
    const match = seg.match(/^\[?(\d{1,2}):(\d{2})\]?\s*[-—:–]?\s*(.*)$/)
    if (!match) {
      return { timestamp: null, seconds: null, text: seg }
    }
    const mins = parseInt(match[1], 10)
    const secs = parseInt(match[2], 10)
    const formattedTs = `${mins}:${ String(secs).padStart(2, '0') }`
    return {
      timestamp: formattedTs,
      seconds: mins * 60 + secs,
      text: match[3].trim() || seg,
    }
  })
}

// ============================================================================
// CORE METRICS ENGINE
// ============================================================================

export function calculateAuditMetrics(params: {
  followers: number
  reels: ReelMetricInput[]
  competitors?: CompetitorMetricInput[]
}): AuditMetricsReport {
  const followers = Math.max(0, Math.round(params.followers || 0))

  // Sort all account reels chronologically (oldest -> newest) up to 50 reels,
  // and take the latest 10 reels (`sortedReels`) as the natural baseline telemetry window
  const allSortedReels = [...(params.reels || [])]
    .map((r) => ({
      ...r,
      parsedDate: new Date(r.postedAt),
      views: Math.max(0, Math.round(Number(r.views) || 0)),
      likes: Math.max(0, Math.round(Number(r.likes) || 0)),
      comments: Math.max(0, Math.round(Number(r.comments) || 0)),
      demandSignalsCount: Math.max(0, Math.round(Number(r.demandSignalsCount) || 0)),
    }))
    .filter((r) => !Number.isNaN(r.parsedDate.getTime()))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
    .slice(-50)

  const sortedReels = allSortedReels.slice(-10)

  const reelCount = sortedReels.length
  const viewsList = sortedReels.map((r) => r.views)

  // 1. Median Views (Strictly MEDIAN, never mean)
  const rawMedianViews = Math.round(computeMedian(viewsList))
  const maxViews = viewsList.length > 0 ? Math.max(...viewsList) : 0
  const minViews = viewsList.length > 0 ? Math.min(...viewsList) : 0

  const medianViews: MetricWithExplanation<number> = {
    value: rawMedianViews,
    isEstimate: false,
    explanation: {
      ar: `تم ترتيب مشاهدات آخر ${reelCount} ريلز تصاعدياً وأخذ القيمة الوسطى الفعلية (Median = ${rawMedianViews.toLocaleString('en-US')}) بدلاً من المتوسط الحسابي لأن فيديو واحد ضخم قد يرفع المتوسط بشكل مضلل.`,
      en: `Calculated as the true statistical median across the last ${reelCount} Reels (${rawMedianViews.toLocaleString('en-US')} views), avoiding the mean which gets skewed by single viral outliers.`,
    },
  }

  // 2. Reach Efficiency = medianViews / followers
  const reachRatio = followers > 0 ? rawMedianViews / followers : 0
  const reachPercent = Number((reachRatio * 100).toFixed(2))
  const reachEfficiency: MetricWithExplanation<{ ratio: number; percent: number }> = {
    value: { ratio: Number(reachRatio.toFixed(4)), percent: reachPercent },
    isEstimate: false,
    explanation: {
      ar: `حاصل قسمة وسيط المشاهدات (${rawMedianViews.toLocaleString('en-US')}) على إجمالي المتابعين (${followers.toLocaleString('en-US')}) = ${reachPercent}%. الحسابات الصحية في مجال الخبراء تحقق عادةً بين 15% إلى 35%+.`,
      en: `Computed as Median Views (${rawMedianViews.toLocaleString('en-US')}) ÷ Followers (${followers.toLocaleString('en-US')}) = ${reachPercent}%. Healthy expert accounts typically achieve 15%–35%+.`,
    },
  }

  // 3. Outlier Ratio = maxViews / medianViews
  const rawOutlierRatio = rawMedianViews > 0 ? Number((maxViews / rawMedianViews).toFixed(2)) : 0
  const outlierRatio: MetricWithExplanation<number> = {
    value: rawOutlierRatio,
    isEstimate: false,
    explanation: {
      ar: `حاصل قسمة أعلى فيديو مشاهدات (${maxViews.toLocaleString('en-US')}) على وسيط المشاهدات (${rawMedianViews.toLocaleString('en-US')}) = ${rawOutlierRatio}x. النسبة العالية تعني أن النجاح حدث بالصدفة وليس عبر صيغة محتوى قابلة للتكرار.`,
      en: `Max Reel Views (${maxViews.toLocaleString('en-US')}) ÷ Median Views (${rawMedianViews.toLocaleString('en-US')}) = ${rawOutlierRatio}x. A high ratio (>3.5x) indicates reliance on one-off spikes rather than a repeatable content system.`,
    },
  }

  // 4. Engagement Rate on Views = (likes + comments) / views
  const perReelEngPct = sortedReels.map((r) => {
    if (r.views <= 0) return 0
    return Number((((r.likes + r.comments) / r.views) * 100).toFixed(2))
  })
  const medianEngPct = Number(computeMedian(perReelEngPct).toFixed(2))
  const engagementRateOnViews: MetricWithExplanation<{ medianPct: number; perReelPct: number[] }> = {
    value: { medianPct: medianEngPct, perReelPct: perReelEngPct },
    isEstimate: false,
    explanation: {
      ar: `نسبة (الإعجابات + التعليقات) مقسومة على مشاهدات كل فيديو، ثم أخذ الوسيط الحسابي = ${medianEngPct}%. (ملاحظة: الحفظ والمشاركة لا يظهران من الخارج).`,
      en: `Per-Reel (Likes + Comments) ÷ Views, aggregated via the median (${medianEngPct}%). Note: Saves and DM Shares are not publicly visible outside Instagram Insights.`,
    },
  }

  // 5. Posting Consistency
  let postsPerMonth = 0
  let longestGapDays = 0
  let stdDevGapDays = 0
  let averageGapDays = 0
  let consistencyLabel: ConsistencyLabel = 'INACTIVE'

  if (sortedReels.length >= 2) {
    const gapsDays: number[] = []
    for (let i = 1; i < sortedReels.length; i++) {
      const diffMs = sortedReels[i].parsedDate.getTime() - sortedReels[i - 1].parsedDate.getTime()
      const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24))
      gapsDays.push(diffDays)
    }
    longestGapDays = Number(Math.max(...gapsDays).toFixed(1))
    averageGapDays = Number((gapsDays.reduce((a, b) => a + b, 0) / gapsDays.length).toFixed(1))
    stdDevGapDays = Number(computeStdDev(gapsDays).toFixed(1))

    const totalSpanMs =
      sortedReels[sortedReels.length - 1].parsedDate.getTime() - sortedReels[0].parsedDate.getTime()
    const totalSpanDays = Math.max(1, totalSpanMs / (1000 * 60 * 60 * 24))
    postsPerMonth = Number(((sortedReels.length / totalSpanDays) * 30).toFixed(1))

    if (postsPerMonth >= 12 && longestGapDays <= 7) {
      consistencyLabel = 'CONSISTENT'
    } else if (postsPerMonth >= 6 && longestGapDays <= 14) {
      consistencyLabel = 'MODERATE'
    } else {
      consistencyLabel = 'IRREGULAR'
    }
  } else if (sortedReels.length === 1) {
    postsPerMonth = 1
    consistencyLabel = 'IRREGULAR'
  }

  const postingConsistency: MetricWithExplanation<PostingConsistencyResult> = {
    value: {
      postsPerMonth,
      longestGapDays,
      stdDevGapDays,
      averageGapDays,
      label: consistencyLabel,
    },
    isEstimate: false,
    explanation: {
      ar: `معدل النشر ${postsPerMonth} فيديو/شهر عبر الفيديوهات المرصودة، وأطول انقطاع بين فيديوهين بلغ ${longestGapDays} يوماً (الانحراف المعياري للفواصل: ${stdDevGapDays} يوم).`,
      en: `Calculated from timestamps across ${reelCount} Reels: ${postsPerMonth} posts/month cadence, longest posting gap of ${longestGapDays} days (gap std-dev: ${stdDevGapDays} days).`,
    },
  }

  // 6. Trend: views over time (last 90 days vs previous, or newer half vs older half)
  let direction: VelocityTrend = 'FLAT'
  let changePercent = 0
  let recentMedian = rawMedianViews
  let previousMedian = rawMedianViews
  let slopePerPost = 0

  if (sortedReels.length >= 4) {
    const newestMs = sortedReels[sortedReels.length - 1].parsedDate.getTime()
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
    const recent90 = sortedReels.filter((r) => newestMs - r.parsedDate.getTime() <= ninetyDaysMs)
    const older90 = sortedReels.filter((r) => newestMs - r.parsedDate.getTime() > ninetyDaysMs)

    if (recent90.length >= 2 && older90.length >= 2) {
      recentMedian = Math.round(computeMedian(recent90.map((r) => r.views)))
      previousMedian = Math.round(computeMedian(older90.map((r) => r.views)))
    } else {
      const half = Math.floor(sortedReels.length / 2)
      const olderHalf = sortedReels.slice(0, half)
      const newerHalf = sortedReels.slice(half)
      previousMedian = Math.round(computeMedian(olderHalf.map((r) => r.views)))
      recentMedian = Math.round(computeMedian(newerHalf.map((r) => r.views)))
    }

    if (previousMedian > 0) {
      changePercent = Number((((recentMedian - previousMedian) / previousMedian) * 100).toFixed(1))
    }

    // Ordinary least squares slope on index (0..N-1)
    const n = sortedReels.length
    const meanX = (n - 1) / 2
    const meanY = viewsList.reduce((a, b) => a + b, 0) / n
    let num = 0
    let den = 0
    for (let i = 0; i < n; i++) {
      num += (i - meanX) * (viewsList[i] - meanY)
      den += Math.pow(i - meanX, 2)
    }
    slopePerPost = den > 0 ? Math.round(num / den) : 0

    if (changePercent >= 15) {
      direction = 'UP'
    } else if (changePercent <= -15) {
      direction = 'DOWN'
    } else {
      direction = 'FLAT'
    }
  }

  const trend: MetricWithExplanation<TrendResult> = {
    value: {
      direction,
      changePercent,
      recentMedian,
      previousMedian,
      slopePerPost,
    },
    isEstimate: false,
    explanation: {
      ar: `مقارنة وسيط المشاهدات للفيديوهات الأحدث (${recentMedian.toLocaleString('en-US')}) بالفترة الأقدم (${previousMedian.toLocaleString('en-US')}) = تغير بنسبة ${changePercent > 0 ? '+' : ''}${changePercent}%.`,
      en: `Compares recent Reel median (${recentMedian.toLocaleString('en-US')}) against prior period median (${previousMedian.toLocaleString('en-US')}) = ${changePercent > 0 ? '+' : ''}${changePercent}% shift.`,
    },
  }

  // 7. Hook Quality Share & Editing Breakdown
  const taggedReels = sortedReels.filter((r) => Boolean(r.hookType))
  const strongHookCount = taggedReels.filter(
    (r) => r.hookType && STRONG_HOOK_TYPES.includes(r.hookType)
  ).length
  const denominatorForHooks = taggedReels.length > 0 ? taggedReels.length : reelCount
  const strongHookSharePct =
    denominatorForHooks > 0 ? Math.round((strongHookCount / denominatorForHooks) * 100) : 0

  const subtitlesCount = sortedReels.filter((r) => r.hasSubtitles === true).length
  const subtitlesSharePct = reelCount > 0 ? Math.round((subtitlesCount / reelCount) * 100) : 0

  const ctaCount = sortedReels.filter((r) => r.hasCta === true).length
  const ctaSharePct = reelCount > 0 ? Math.round((ctaCount / reelCount) * 100) : 0

  const repostCount = sortedReels.filter((r) => r.isRepost === true).length

  const hookQualityShare: MetricWithExplanation<HookAndEditingBreakdown> = {
    value: {
      strongHookSharePct,
      strongHookCount,
      taggedHookCount: taggedReels.length,
      subtitlesSharePct,
      ctaSharePct,
      repostCount,
    },
    isEstimate: false,
    explanation: {
      ar: `${strongHookCount} من أصل ${denominatorForHooks} فيديو تستخدم هوك قوي في أول 3 ثوانٍ (${strongHookSharePct}%)، بينما ${ctaSharePct}% فقط تحتوي على دعوة صريحة لاتخاذ إجراء (CTA).`,
      en: `${strongHookCount} of ${denominatorForHooks} evaluated Reels use a structured strong hook (${strongHookSharePct}%), while ${ctaSharePct}% include an explicit Call-To-Action.`,
    },
  }

  // 8. Comment Demand Signals
  const totalSignals = sortedReels.reduce((acc, r) => acc + (r.demandSignalsCount || 0), 0)
  const reelsWithSignals = sortedReels.filter((r) => (r.demandSignalsCount || 0) > 0).length
  const commentDemandSignals: MetricWithExplanation<{
    totalSignals: number
    reelsWithSignals: number
  }> = {
    value: { totalSignals, reelsWithSignals },
    isEstimate: false,
    explanation: {
      ar: `عدد التعليقات العلنية التي تحمل نية شراء أو استفسار مباشر عن الخدمة ("بكم؟"، "كيف أحجز؟"، "تفاصيل") المرصودة يدوياً = ${totalSignals} تعليق في ${reelsWithSignals} فيديو.`,
      en: `Manual count of public high-intent buyer comments ("how much?", "how do I book?", "details") across analyzed Reels = ${totalSignals} signals across ${reelsWithSignals} Reels.`,
    },
  }

  // 9. Competitor Gap
  const competitorItems: CompetitorGapItem[] = (params.competitors || []).map((comp) => {
    const compFollowers = Math.max(1, Math.round(comp.followers || 1))
    const compReelViews = (comp.reels || [])
      .map((r) => Math.max(0, Number(r.views) || 0))
      .filter((v) => v > 0)
    const compMedian =
      compReelViews.length > 0
        ? Math.round(computeMedian(compReelViews))
        : Math.max(0, Math.round(comp.medianViews || 0))

    const compEfficiencyRatio = compMedian / compFollowers
    const compEfficiencyPct = Number((compEfficiencyRatio * 100).toFixed(2))
    const multiplierVsProspect =
      reachRatio > 0 ? Number((compEfficiencyRatio / reachRatio).toFixed(2)) : 0

    return {
      handle: comp.handle.replace(/^@/, ''),
      displayName: comp.displayName || `@${comp.handle.replace(/^@/, '')}`,
      followers: compFollowers,
      medianViews: compMedian,
      reachEfficiencyRatio: Number(compEfficiencyRatio.toFixed(4)),
      reachEfficiencyPct: compEfficiencyPct,
      multiplierVsProspect,
      explanation: {
        ar: `حساب @${comp.handle.replace(/^@/, '')} يحقق وسيط مشاهدات ${compMedian.toLocaleString('en-US')} لكل ${compFollowers.toLocaleString('en-US')} متابع (${compEfficiencyPct}%)، أي ${multiplierVsProspect}x ضعف كفاءة وصول حسابك للمتابعين.`,
        en: `@${comp.handle.replace(/^@/, '')} achieves ${compMedian.toLocaleString('en-US')} median views on ${compFollowers.toLocaleString('en-US')} followers (${compEfficiencyPct}% efficiency) — ${multiplierVsProspect}x your views-per-follower efficiency.`,
      },
    }
  })

  const validMultipliers = competitorItems
    .map((c) => c.multiplierVsProspect)
    .filter((m) => m > 0)
  const averageCompetitorMultiplier =
    validMultipliers.length > 0
      ? Number((validMultipliers.reduce((a, b) => a + b, 0) / validMultipliers.length).toFixed(2))
      : 1

  const competitorGap: MetricWithExplanation<{
    items: CompetitorGapItem[]
    averageCompetitorMultiplier: number
  }> = {
    value: {
      items: competitorItems,
      averageCompetitorMultiplier,
    },
    isEstimate: false,
    explanation: {
      ar: `مقارنة كفاءة الوصول (وسيط المشاهدات ÷ المتابعين) لحسابك (${reachPercent}%) مقابل المنافسين المباشرين في نفس التخصص.`,
      en: `Compares your Reach Efficiency (Median Views ÷ Followers = ${reachPercent}%) directly against peers in your niche.`,
    },
  }

  // 10. Opportunity Estimator (STRICTLY LABELED AS ESTIMATE)
  const topQuartileViews = Math.round(computeQuantile(viewsList, 0.75))
  const extraViewsPerPost = Math.max(0, topQuartileViews - rawMedianViews)
  const extraViewsPerMonthAt12Posts = extraViewsPerPost * 12
  const upliftMultiplier =
    rawMedianViews > 0 ? Number((topQuartileViews / rawMedianViews).toFixed(2)) : 1

  const opportunityEstimator: MetricWithExplanation<OpportunityEstimateResult> = {
    value: {
      topQuartileViews,
      currentMedianViews: rawMedianViews,
      extraViewsPerPost,
      extraViewsPerMonthAt12Posts,
      upliftMultiplier,
    },
    isEstimate: true, // Always true per Hard Rule #2
    explanation: {
      ar: `[تقديري] إذا ارتفع وسيط مشاهداتك الحالي (${rawMedianViews.toLocaleString('en-US')}) إلى مستوى الربع الأعلى من فيديوهاتك أنت الفعلية (P75 = ${topQuartileViews.toLocaleString('en-US')})، فهذا يعني ~${extraViewsPerPost.toLocaleString('en-US')} مشاهدة إضافية لكل فيديو (~${extraViewsPerMonthAt12Posts.toLocaleString('en-US')} مشاهدة إضافية شهرياً عند نشر 12 فيديو).`,
      en: `[ESTIMATE] If your median views (${rawMedianViews.toLocaleString('en-US')}) rose to the level of your own existing top-quartile Reels (75th percentile = ${topQuartileViews.toLocaleString('en-US')}), that represents ~${extraViewsPerPost.toLocaleString('en-US')} additional views per Reel (~${extraViewsPerMonthAt12Posts.toLocaleString('en-US')} extra views/month at 12 Reels/month).`,
    },
  }

  // Per-Reel Computed Breakdown across all scraped account reels
  const prelimReels = allSortedReels.map((r, idx) => {
    const hasExplicitShares = r.shares !== null && r.shares !== undefined
    const effectiveShares = hasExplicitShares
      ? Math.max(0, Math.round(Number(r.shares) || 0))
      : r.likes > 0 || r.comments > 0
        ? Math.max(1, Math.round(r.likes * 0.14 + r.comments * 0.85))
        : 0

    const hasExplicitSaves = r.saves !== null && r.saves !== undefined
    const effectiveSaves = hasExplicitSaves
      ? Math.max(0, Math.round(Number(r.saves) || 0))
      : r.likes > 0 || r.comments > 0
        ? Math.max(1, Math.round(r.likes * 0.22 + r.comments * 0.65))
        : 0

    const repostsCount = r.isRepost
      ? Math.max(1, Math.round(r.likes * 0.05 + r.comments * 0.3))
      : r.likes > 0 || r.comments > 0
        ? Math.max(0, Math.round(r.likes * 0.04 + r.comments * 0.2))
        : 0

    const totalInteractions =
      r.likes + r.comments + effectiveShares + effectiveSaves + repostsCount

    const engPct = r.views > 0 ? Number((((r.likes + r.comments) / r.views) * 100).toFixed(2)) : 0
    const fullEngPct =
      r.views > 0 ? Number(((totalInteractions / r.views) * 100).toFixed(2)) : 0

    const vsMedianMultiplier =
      rawMedianViews > 0 ? Number((r.views / rawMedianViews).toFixed(2)) : 1
    const allMaxViews = allSortedReels.length > 0 ? Math.max(...allSortedReels.map((x) => x.views)) : maxViews
    const isTopOutlier = allMaxViews > 0 && r.views === allMaxViews && rawOutlierRatio >= 1.8

    const performanceTier: ReelPerformanceTier =
      isTopOutlier || vsMedianMultiplier >= 1.6
        ? 'VIRAL'
        : vsMedianMultiplier >= 1.05
          ? 'ABOVE_AVERAGE'
          : vsMedianMultiplier >= 0.8
            ? 'AVERAGE'
            : 'UNDERPERFORMING'

    const compositeScore =
      r.views +
      r.likes * 15 +
      r.comments * 40 +
      effectiveShares * 50 +
      effectiveSaves * 45

    return {
      index: idx + 1,
      id: r.id,
      shortcode: r.shortcode ?? null,
      url: r.url,
      thumbnailUrl: r.thumbnailUrl ?? null,
      caption: r.caption ?? null,
      topic: r.topic ?? null,
      durationSec: r.durationSec ?? null,
      postedAtIso: r.parsedDate.toISOString(),
      views: r.views,
      viewsEstimated: r.viewsEstimated ?? false,
      likes: r.likes,
      comments: r.comments,
      shares: effectiveShares,
      sharesEstimated: !hasExplicitShares,
      saves: effectiveSaves,
      savesEstimated: !hasExplicitSaves,
      repostsCount,
      totalInteractions,
      engagementRatePct: engPct,
      fullEngagementRatePct: fullEngPct,
      vsMedianMultiplier,
      compositeScore,
      performanceTier,
      isTopOutlier,
      isAboveMedian: r.views >= rawMedianViews,
      hookType: r.hookType,
      hasSubtitles: r.hasSubtitles,
      hasCta: r.hasCta,
      isRepost: r.isRepost,
      demandSignalsCount: r.demandSignalsCount,
      pros: r.pros ?? null,
      cons: r.cons ?? null,
      editorNotes: r.editorNotes || '',
      parsedNotes: parseEditorNotesTimestamps(r.editorNotes || ''),
    }
  })

  // Compute 1-based performanceRank across all account reels (#1 = highest impact reel)
  const rankOrder = [...prelimReels].sort((a, b) => b.compositeScore - a.compositeScore)
  const indexToRank = new Map<number, number>()
  rankOrder.forEach((item, rankIdx) => {
    indexToRank.set(item.index, rankIdx + 1)
  })

  const reelsComputed: PerReelComputed[] = prelimReels.map(
    ({ compositeScore: _cs, ...rest }) => ({
      ...rest,
      performanceRank: indexToRank.get(rest.index) || rest.index,
    })
  )

  const totalViews = reelsComputed.reduce((acc, r) => acc + r.views, 0)
  const totalLikes = reelsComputed.reduce((acc, r) => acc + r.likes, 0)
  const totalComments = reelsComputed.reduce((acc, r) => acc + r.comments, 0)
  const totalShares = reelsComputed.reduce((acc, r) => acc + r.shares, 0)
  const totalSaves = reelsComputed.reduce((acc, r) => acc + r.saves, 0)
  const totalReposts = reelsComputed.reduce((acc, r) => acc + r.repostsCount, 0)
  const totalInteractions = reelsComputed.reduce((acc, r) => acc + r.totalInteractions, 0)

  const accountTotals: AccountReelsTotals = {
    totalViews,
    averageViews: reelCount > 0 ? Math.round(totalViews / reelCount) : 0,
    totalLikes,
    averageLikes: reelCount > 0 ? Math.round(totalLikes / reelCount) : 0,
    totalComments,
    averageComments: reelCount > 0 ? Math.round(totalComments / reelCount) : 0,
    totalShares,
    averageShares: reelCount > 0 ? Math.round(totalShares / reelCount) : 0,
    totalSaves,
    averageSaves: reelCount > 0 ? Math.round(totalSaves / reelCount) : 0,
    totalReposts,
    totalInteractions,
    overallEngagementPct:
      totalViews > 0 ? Number(((totalInteractions / totalViews) * 100).toFixed(2)) : 0,
    viralCount: reelsComputed.filter((r) => r.performanceTier === 'VIRAL').length,
    aboveAverageCount: reelsComputed.filter((r) => r.performanceTier === 'ABOVE_AVERAGE').length,
    averageCount: reelsComputed.filter((r) => r.performanceTier === 'AVERAGE').length,
    underperformingCount: reelsComputed.filter(
      (r) => r.performanceTier === 'UNDERPERFORMING'
    ).length,
  }

  // Auto-Suggested Scores for Categories 4, 5, and 9
  const autoSuggestedScores = computeAutoSuggestedCategories({
    postsPerMonth,
    longestGapDays,
    outlierRatio: rawOutlierRatio,
    reachPercent,
    averageCompetitorMultiplier,
    hasCompetitors: competitorItems.length > 0,
  })

  return {
    reelCount,
    followers,
    medianViews,
    maxViews,
    minViews,
    accountTotals,
    reachEfficiency,
    outlierRatio,
    engagementRateOnViews,
    postingConsistency,
    trend,
    hookQualityShare,
    commentDemandSignals,
    competitorGap,
    opportunityEstimator,
    reelsComputed,
    autoSuggestedScores,
  }
}

// ============================================================================
// AUTO-SUGGESTED SCORECARD CALCULATORS (Categories 4, 5, 9)
// ============================================================================

export function computeAutoSuggestedCategories(params: {
  postsPerMonth: number
  longestGapDays: number
  outlierRatio: number
  reachPercent: number
  averageCompetitorMultiplier: number
  hasCompetitors: boolean
}): Record<'content_system' | 'reach_efficiency' | 'competitor_gap', AutoSuggestedCategory> {
  // Category 4: Content System (cadence + gap discipline + formula repeatability)
  let contentScore = 3
  if (params.postsPerMonth >= 14 && params.longestGapDays <= 5) {
    contentScore = 9
  } else if (params.postsPerMonth >= 10 && params.longestGapDays <= 8) {
    contentScore = 7
  } else if (params.postsPerMonth >= 6 && params.longestGapDays <= 14) {
    contentScore = 5
  } else if (params.postsPerMonth >= 3) {
    contentScore = 4
  } else {
    contentScore = 2
  }
  if (params.outlierRatio > 4.5) {
    contentScore = Math.max(1, contentScore - 1)
  }

  // Category 5: Reach Efficiency (medianViews / followers %)
  let reachScore = 3
  if (params.reachPercent >= 35) {
    reachScore = 9
  } else if (params.reachPercent >= 22) {
    reachScore = 8
  } else if (params.reachPercent >= 14) {
    reachScore = 6
  } else if (params.reachPercent >= 8) {
    reachScore = 4
  } else if (params.reachPercent >= 4) {
    reachScore = 3
  } else {
    reachScore = 2
  }

  // Category 9: Competitor Gap
  let compScore = 5
  if (!params.hasCompetitors) {
    compScore = 5
  } else if (params.averageCompetitorMultiplier <= 0.8) {
    compScore = 9
  } else if (params.averageCompetitorMultiplier <= 1.2) {
    compScore = 7
  } else if (params.averageCompetitorMultiplier <= 2.0) {
    compScore = 5
  } else if (params.averageCompetitorMultiplier <= 3.5) {
    compScore = 3
  } else {
    compScore = 2
  }

  return {
    content_system: {
      categoryKey: 'content_system',
      score: contentScore,
      evidenceAr: `معدل النشر الحالي ${params.postsPerMonth} فيديو/شهر مع أطول انقطاع ${params.longestGapDays} يوماً ومعامل تذبذب ${params.outlierRatio}x.`,
      evidenceEn: `Current cadence is ${params.postsPerMonth} Reels/month with a longest gap of ${params.longestGapDays} days and an outlier ratio of ${params.outlierRatio}x.`,
      recommendationAr:
        'تثبيت إيقاع نشر منتظم (3 إلى 4 فيديوهات أسبوعياً) مبني على 3 سلاسل محتوى واضحة تخدم قرار الشراء.',
      recommendationEn:
        'Install a predictable 3–4 Reels/week cadence built around 3 repeatable content pillars tied to buyer objections.',
    },
    reach_efficiency: {
      categoryKey: 'reach_efficiency',
      score: reachScore,
      evidenceAr: `كفاءة الوصول الحالية تبلغ ${params.reachPercent}% من إجمالي المتابعين (متوسط المشاهدات مقارنة بحجم الجمهور).`,
      evidenceEn: `Reach efficiency sits at ${params.reachPercent}% of total follower base (Median Views ÷ Followers).`,
      recommendationAr:
        'إعادة هيكلة أول 3 ثوانٍ (Visual + Verbal Hook) ورفع قابلية المشاركة والحفظ لفتح الوصول لغير المتابعين.',
      recommendationEn:
        'Re-engineer the first 3 seconds (visual + verbal hook) and build save-worthy frameworks to unlock non-follower distribution.',
    },
    competitor_gap: {
      categoryKey: 'competitor_gap',
      score: compScore,
      evidenceAr: params.hasCompetitors
        ? `المنافسون في نفس الفئة يحققون في المتوسط ${params.averageCompetitorMultiplier}x أضعاف المشاهدات لكل متابع مقارنة بحسابك.`
        : 'تم التقييم المبدئي بناءً على معايير السوق الإقليمي لحين إضافة بيانات المنافسين.',
      evidenceEn: params.hasCompetitors
        ? `Direct niche competitors achieve an average of ${params.averageCompetitorMultiplier}x more views per follower than your account.`
        : 'Baseline benchmark applied until direct competitor accounts are entered.',
      recommendationAr:
        'تبني زوايا طرح أكثر حدة وتفصيلاً (Case-driven hooks) لسد فجوة الانتشار مع المنافسين في السوق.',
      recommendationEn:
        'Deploy sharper authority angles and case-driven hooks to close the reach-per-follower gap against category peers.',
    },
  }
}

// ============================================================================
// CSV / TSV PASTE PARSER FOR REELS ENTRY
// ============================================================================

function parseShorthandNumber(raw: string): number {
  const normalized = normalizeToWesternDigits(raw || '')
    .replace(/,/g, '')
    .trim()
    .toUpperCase()
  if (!normalized) return 0
  const match = normalized.match(/^([0-9]*\.?[0-9]+)\s*([KM])?$/)
  if (!match) {
    const fallback = parseFloat(normalized.replace(/[^0-9.]/g, ''))
    return Number.isFinite(fallback) ? Math.round(fallback) : 0
  }
  const num = parseFloat(match[1])
  const suffix = match[2]
  if (suffix === 'M') return Math.round(num * 1_000_000)
  if (suffix === 'K') return Math.round(num * 1_000)
  return Math.round(num)
}

function normalizeHookType(raw: string): AuditHookType | null {
  const val = (raw || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (
    val === 'QUESTION' ||
    val === 'BOLD_CLAIM' ||
    val === 'STORY' ||
    val === 'PATTERN_INTERRUPT' ||
    val === 'WEAK' ||
    val === 'OTHER'
  ) {
    return val
  }
  if (val.includes('سؤال') || val.includes('QUESTION')) return 'QUESTION'
  if (val.includes('تصريح') || val.includes('CLAIM') || val.includes('BOLD')) return 'BOLD_CLAIM'
  if (val.includes('قص') || val.includes('STORY')) return 'STORY'
  if (val.includes('نمط') || val.includes('INTERRUPT')) return 'PATTERN_INTERRUPT'
  if (val.includes('ضعيف') || val.includes('WEAK')) return 'WEAK'
  return null
}

function parseBoolFlag(raw: string): boolean | null {
  const val = (raw || '').trim().toLowerCase()
  if (!val) return null
  if (['true', 'yes', '1', 'y', 'نعم', 'صح'].includes(val)) return true
  if (['false', 'no', '0', 'n', 'لا', 'خطأ'].includes(val)) return false
  return null
}

/**
 * Parses pasted CSV or TSV rows from Excel / Google Sheets / manual paste into ReelMetricInput[].
 * Expected columns (with or without header row):
 * postedAt, views, likes, comments, hookType, hasSubtitles, hasCta, demandSignalsCount, topic, editorNotes, url
 */
export function parseReelsCsvOrPaste(rawText: string): ReelMetricInput[] {
  const lines = (rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const splitRow = (line: string): string[] => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.trim())
    }
    const cols: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cols.push(current.trim())
    return cols
  }

  const firstRow = splitRow(lines[0]).map((c) => c.toLowerCase())
  const hasHeader =
    firstRow.some((h) => h.includes('view') || h.includes('date') || h.includes('مشاهد') || h.includes('تاريخ'))

  const dataLines = hasHeader ? lines.slice(1) : lines
  const results: ReelMetricInput[] = []

  dataLines.forEach((line, idx) => {
    const cols = splitRow(line)
    if (cols.length < 2) return

    const dateCandidate = new Date(normalizeToWesternDigits(cols[0]))
    const postedAt = !Number.isNaN(dateCandidate.getTime())
      ? dateCandidate.toISOString().slice(0, 10)
      : new Date(Date.now() - (dataLines.length - idx) * 4 * 86400000).toISOString().slice(0, 10)

    const views = parseShorthandNumber(cols[1] || '0')
    const likes = parseShorthandNumber(cols[2] || '0')
    const comments = parseShorthandNumber(cols[3] || '0')
    const hookType = normalizeHookType(cols[4] || '')
    const hasSubtitles = parseBoolFlag(cols[5] || '') ?? true
    const hasCta = parseBoolFlag(cols[6] || '') ?? false
    const demandSignalsCount = parseShorthandNumber(cols[7] || '0')
    const topic = cols[8] || ''
    const editorNotes = cols[9] || ''
    const url = cols[10] || ''

    results.push({
      postedAt,
      views,
      likes,
      comments,
      hookType,
      hasSubtitles,
      hasCta,
      isRepost: false,
      demandSignalsCount,
      topic,
      editorNotes,
      url: url || null,
    })
  })

  return results
}
