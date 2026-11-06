import { describe, it, expect } from 'vitest'
import {
  calculateAuditMetrics,
  computeMedian,
  computeQuantile,
  computeWeightedOverallScore,
  getScoreBandStatus,
  parseEditorNotesTimestamps,
  parseReelsCsvOrPaste,
  ReelMetricInput,
} from './index'

describe('APX Audit Metrics Engine (Pure TypeScript)', () => {
  it('computes the exact statistical MEDIAN (never mean) for odd and even counts', () => {
    // Mean would be (1000 + 1200 + 1400 + 1600 + 95000) / 5 = 20,040
    // Median MUST be 1,400
    expect(computeMedian([1000, 95000, 1400, 1200, 1600])).toBe(1400)
    // Even count: [1000, 2000, 3000, 10000] -> (2000 + 3000) / 2 = 2500
    expect(computeMedian([10000, 1000, 3000, 2000])).toBe(2500)
    expect(computeMedian([])).toBe(0)
  })

  it('computes quantiles accurately for opportunity estimator (P75)', () => {
    const sample = [1000, 2000, 3000, 4000, 5000]
    expect(computeQuantile(sample, 0.5)).toBe(3000)
    expect(computeQuantile(sample, 0.75)).toBe(4000)
  })

  it('calculates full metrics report with explanations and enforces ESTIMATE flag on opportunityEstimator', () => {
    const sampleReels: ReelMetricInput[] = [
      {
        postedAt: '2026-08-01',
        views: 2200,
        likes: 65,
        comments: 8,
        hookType: 'WEAK',
        hasSubtitles: false,
        hasCta: false,
        demandSignalsCount: 0,
        editorNotes: '0:02 — starts with slow greeting | 0:08 — no subtitle contrast',
      },
      {
        postedAt: '2026-08-10',
        views: 2600,
        likes: 80,
        comments: 11,
        hookType: 'WEAK',
        hasSubtitles: true,
        hasCta: false,
        demandSignalsCount: 1,
      },
      {
        postedAt: '2026-08-22',
        views: 3000,
        likes: 95,
        comments: 15,
        hookType: 'QUESTION',
        hasSubtitles: true,
        hasCta: false,
        demandSignalsCount: 2,
      },
      {
        postedAt: '2026-09-05',
        views: 3400,
        likes: 110,
        comments: 14,
        hookType: 'BOLD_CLAIM',
        hasSubtitles: true,
        hasCta: true,
        demandSignalsCount: 3,
      },
      {
        postedAt: '2026-09-18',
        views: 18500, // Viral outlier
        likes: 740,
        comments: 62,
        hookType: 'PATTERN_INTERRUPT',
        hasSubtitles: true,
        hasCta: false,
        demandSignalsCount: 6,
      },
    ]

    const report = calculateAuditMetrics({
      followers: 25000,
      reels: sampleReels,
      competitors: [
        {
          handle: 'comp_alpha',
          followers: 20000,
          reels: [{ postedAt: '2026-09-01', views: 12000 }],
        },
      ],
    })

    // 1. Median Views must be 3000 (not the mean 5940)
    expect(report.medianViews.value).toBe(3000)
    expect(report.medianViews.isEstimate).toBe(false)
    expect(report.medianViews.explanation.ar).toContain('3,000')
    expect(report.medianViews.explanation.en).toContain('3,000')

    // 2. Reach Efficiency = 3000 / 25000 = 0.12 (12%)
    expect(report.reachEfficiency.value.ratio).toBe(0.12)
    expect(report.reachEfficiency.value.percent).toBe(12)

    // 3. Outlier Ratio = 18500 / 3000 = 6.17
    expect(report.outlierRatio.value).toBeCloseTo(6.17, 2)

    // 4. Hook Quality Share: 3 strong hooks out of 5 tagged = 60%
    expect(report.hookQualityShare.value.strongHookCount).toBe(3)
    expect(report.hookQualityShare.value.strongHookSharePct).toBe(60)
    expect(report.hookQualityShare.value.subtitlesSharePct).toBe(80)
    expect(report.hookQualityShare.value.ctaSharePct).toBe(20)

    // 5. Demand signals: 0 + 1 + 2 + 3 + 6 = 12 across 4 reels
    expect(report.commentDemandSignals.value.totalSignals).toBe(12)
    expect(report.commentDemandSignals.value.reelsWithSignals).toBe(4)

    // 6. Competitor gap: competitor has 12000 / 20000 = 60% vs prospect 12% -> 5x
    expect(report.competitorGap.value.items[0].multiplierVsProspect).toBe(5)

    // 7. Opportunity estimator MUST be marked as an estimate
    expect(report.opportunityEstimator.isEstimate).toBe(true)
    expect(report.opportunityEstimator.value.currentMedianViews).toBe(3000)
    expect(report.opportunityEstimator.value.topQuartileViews).toBe(3400)
    expect(report.opportunityEstimator.value.extraViewsPerPost).toBe(400)
    expect(report.opportunityEstimator.explanation.en).toContain('[ESTIMATE]')
    expect(report.opportunityEstimator.explanation.ar).toContain('[تقديري]')

    // 8. Auto-suggested scores exist for categories 4, 5, 9
    expect(report.autoSuggestedScores.content_system.score).toBeGreaterThanOrEqual(1)
    expect(report.autoSuggestedScores.reach_efficiency.score).toBeGreaterThanOrEqual(1)
    expect(report.autoSuggestedScores.competitor_gap.score).toBeGreaterThanOrEqual(1)
  })

  it('parses timestamped editor notes accurately', () => {
    const notes = '0:02 — starts with filler word | 0:11 - hook lost before main point'
    const parsed = parseEditorNotesTimestamps(notes)
    expect(parsed).toHaveLength(2)
    expect(parsed[0]).toEqual({
      timestamp: '0:02',
      seconds: 2,
      text: 'starts with filler word',
    })
    expect(parsed[1]).toEqual({
      timestamp: '0:11',
      seconds: 11,
      text: 'hook lost before main point',
    })
  })

  it('parses CSV/TSV pasted reels with shorthand numbers and Arabic-Indic digits', () => {
    const csv = [
      'date,views,likes,comments,hook,subtitles,cta,demand,topic,notes',
      '2026-09-01,12.5K,420,35,QUESTION,yes,no,4,Pricing mistakes,"0:03 — slow intro"',
      '2026-09-05,٣٢٠٠,110,12,WEAK,no,no,0,General advice,"0:01 — no hook"',
    ].join('\n')

    const reels = parseReelsCsvOrPaste(csv)
    expect(reels).toHaveLength(2)
    expect(reels[0].views).toBe(12500)
    expect(reels[0].hookType).toBe('QUESTION')
    expect(reels[0].hasSubtitles).toBe(true)
    expect(reels[0].hasCta).toBe(false)
    expect(reels[0].demandSignalsCount).toBe(4)
    expect(reels[1].views).toBe(3200)
    expect(reels[1].hookType).toBe('WEAK')
  })

  it('maps score bands and computes weighted 0-100 overall score accurately', () => {
    expect(getScoreBandStatus(2)).toBe('weak')
    expect(getScoreBandStatus(5)).toBe('warning')
    expect(getScoreBandStatus(8)).toBe('strong')

    const score = computeWeightedOverallScore([
      { categoryKey: 'positioning', score: 5 },
      { categoryKey: 'hooks_editing', score: 5 },
      { categoryKey: 'conversion_funnel', score: 5 },
    ])
    expect(score).toBe(50)
  })
})
