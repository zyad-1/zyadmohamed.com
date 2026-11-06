import { z } from 'zod'

export const AuditStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
export type AuditStatus = z.infer<typeof AuditStatusSchema>

export const AuditLanguageSchema = z.enum(['ar', 'en'])
export type AuditLanguage = z.infer<typeof AuditLanguageSchema>

export const AuditHookTypeSchema = z.enum([
  'QUESTION',
  'BOLD_CLAIM',
  'STORY',
  'PATTERN_INTERRUPT',
  'WEAK',
  'OTHER',
])
export type AuditHookType = z.infer<typeof AuditHookTypeSchema>

export const STRONG_HOOK_TYPES: readonly AuditHookType[] = [
  'QUESTION',
  'BOLD_CLAIM',
  'STORY',
  'PATTERN_INTERRUPT',
] as const

export const AuditCheckStatusSchema = z.enum(['OK', 'WEAK', 'MISSING'])
export type AuditCheckStatus = z.infer<typeof AuditCheckStatusSchema>

export const AUDIT_PROFILE_CHECK_KEYS = [
  'nameKeyword',
  'bioPromise',
  'singleCta',
  'highlights',
  'pinnedPosts',
  'linkSpeed',
  'offerClarity',
  'leadMagnetOrDmKeyword',
  'contactButton',
  'socialProofVisible',
] as const

export const AuditProfileCheckKeySchema = z.enum(AUDIT_PROFILE_CHECK_KEYS)
export type AuditProfileCheckKey = z.infer<typeof AuditProfileCheckKeySchema>

export const AUDIT_CATEGORY_KEYS = [
  'positioning',
  'profile_bio',
  'hooks_editing',
  'content_system',
  'reach_efficiency',
  'engagement_quality',
  'authority_proof',
  'conversion_funnel',
  'competitor_gap',
] as const

export const AuditCategoryKeySchema = z.enum(AUDIT_CATEGORY_KEYS)
export type AuditCategoryKey = z.infer<typeof AuditCategoryKeySchema>

export const AUTO_SUGGESTED_CATEGORIES: readonly AuditCategoryKey[] = [
  'content_system',
  'reach_efficiency',
  'competitor_gap',
] as const

export const DEFAULT_CATEGORY_WEIGHTS: Record<AuditCategoryKey, number> = {
  positioning: 1.2,
  profile_bio: 1.0,
  hooks_editing: 1.6, // Weighted highest per spec
  content_system: 1.1,
  reach_efficiency: 1.1,
  engagement_quality: 1.0,
  authority_proof: 1.2,
  conversion_funnel: 1.6, // Weighted highest per spec
  competitor_gap: 0.9,
}

export const AuditFindingSeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM'])
export type AuditFindingSeverity = z.infer<typeof AuditFindingSeveritySchema>

export const AuditEventTypeSchema = z.enum([
  'OPEN',
  'SECTION_VIEW',
  'SCROLL_DEPTH',
  'CTA_CLICK',
  'LANGUAGE_TOGGLE',
  'UNLOCK_UPLOAD',
])
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>

export const DEFAULT_UNMEASURED_ITEMS: Array<{
  label: string
  whyItMatters: string
}> = [
  {
    label: 'منحنى الاحتفاظ بالمشاهد (Retention Curve & 3s Skip Rate) — غير قابل للقياس من الخارج',
    whyItMatters:
      'يحدد الثانية الدقيقة التي يغادر فيها المشاهد الفيديو؛ بدونه لا يمكن معرفة هل الهوك البصري أم الإيقاع الداخلي هو سبب توقف انتشار الفيديو.',
  },
  {
    label: 'عمليات الحفظ والإرسال بالخاص (Saves & DM Shares) — غير قابل للقياس من الخارج',
    whyItMatters:
      'أقوى إشارتين في خوارزمية إنستغرام الحالية لفتح الوصول لغير المتابعين (Unconnected Reach)؛ لا تظهر إلا داخل Insights.',
  },
  {
    label: 'نسبة الوصول لغير المتابعين (Non-Follower Reach %) — غير قابل للقياس من الخارج',
    whyItMatters:
      'تكشف هل الحساب ينمو بجمهور جديد أم يدور في نفس الدائرة المغلقة من المتابعين القدامى.',
  },
  {
    label: 'زيارات البروفايل ونقرات الرابط (Profile Visits & Link Clicks) — غير قابل للقياس من الخارج',
    whyItMatters:
      'تقيس كفاءة تحويل المشاهدين من الفيديوهات إلى البايو ثم إلى صفحة الحجز أو الواتساب.',
  },
  {
    label: 'التوزيع الجغرافي والعمري للجمهور الفعلي (Audience Demographics) — غير قابل للقياس من الخارج',
    whyItMatters:
      'يؤكد هل المشاهدات تأتي من السوق المستهدف صاحب القدرة الشرائية (الخليج ومصر) أم من جمهور غير مؤهل شرائياً.',
  },
]

// ============================================================================
// ZOD SCHEMAS FOR WIZARD & TRPC INPUTS
// ============================================================================

export const ProspectInputSchema = z.object({
  handle: z.string().min(1, 'Instagram handle is required').transform((s) => s.replace(/^@/, '').trim()),
  displayName: z.string().min(1, 'Display name is required'),
  niche: z.string().min(1, 'Niche is required'),
  followers: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative().nullable().optional(),
  postsCount: z.number().int().nonnegative().nullable().optional(),
  profileUrl: z.string().default(''),
  linkInBioUrl: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  bioLinks: z
    .array(
      z.object({
        title: z.string().default(''),
        url: z.string(),
      })
    )
    .optional(),
  notes: z.string().default(''),
})

export const ReelInputSchema = z.object({
  id: z.string().optional(),
  shortcode: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  postedAt: z.string().or(z.date()),
  views: z.number().int().nonnegative(),
  viewsEstimated: z.boolean().nullable().optional(),
  likes: z.number().int().nonnegative().default(0),
  comments: z.number().int().nonnegative().default(0),
  shares: z.number().int().nonnegative().nullable().optional(),
  saves: z.number().int().nonnegative().nullable().optional(),
  durationSec: z.number().int().positive().nullable().optional(),
  topic: z.string().nullable().optional(),
  hookType: AuditHookTypeSchema.nullable().optional(),
  hasSubtitles: z.boolean().nullable().optional(),
  hasCta: z.boolean().nullable().optional(),
  isRepost: z.boolean().nullable().optional().default(false),
  demandSignalsCount: z.number().int().nonnegative().default(0),
  pros: z.string().nullable().optional(),
  cons: z.string().nullable().optional(),
  editorNotes: z.string().default(''),
  position: z.number().int().default(0),
})

export const ProfileCheckInputSchema = z.object({
  key: AuditProfileCheckKeySchema,
  status: AuditCheckStatusSchema,
  evidence: z.string().default(''),
  screenshotUrl: z.string().nullable().optional(),
})

export const CategoryScoreInputSchema = z.object({
  categoryKey: AuditCategoryKeySchema,
  score: z.number().int().min(0).max(10),
  autoSuggestedScore: z.number().int().min(0).max(10).nullable().optional(),
  isAutoSuggested: z.boolean().default(false),
  isOverridden: z.boolean().default(false),
  evidence: z.string().default(''),
  recommendation: z.string().default(''),
  weight: z.number().positive().default(1.0),
})

export const FindingInputSchema = z.object({
  rank: z.number().int().min(1).max(20),
  title: z.string().min(1),
  evidence: z.string().min(1),
  businessImpact: z.string().min(1),
  apxFix: z.string().min(1),
  severity: AuditFindingSeveritySchema.default('CRITICAL'),
})

export const CompetitorReelInputSchema = z.object({
  id: z.string().optional(),
  postedAt: z.string().or(z.date()),
  views: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative().default(0),
  comments: z.number().int().nonnegative().default(0),
})

export const CompetitorInputSchema = z.object({
  id: z.string().optional(),
  handle: z.string().min(1).transform((s) => s.replace(/^@/, '').trim()),
  displayName: z.string().default(''),
  followers: z.number().int().positive(),
  medianViews: z.number().int().nonnegative().optional(),
  notes: z.string().default(''),
  reels: z.array(CompetitorReelInputSchema).default([]),
})

export const UnmeasuredInputSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  whyItMatters: z.string().min(1),
  position: z.number().int().default(0),
})

export const SaveFullAuditSchema = z.object({
  id: z.string(),
  language: AuditLanguageSchema.default('ar'),
  summaryOpening: z.string().default(''),
  verdictLine: z.string().default(''),
  expiresAt: z.string().nullable().optional(),
  prospect: ProspectInputSchema,
  reels: z.array(ReelInputSchema),
  profileChecks: z.array(ProfileCheckInputSchema),
  categoryScores: z.array(CategoryScoreInputSchema),
  findings: z.array(FindingInputSchema),
  competitors: z.array(CompetitorInputSchema),
  unmeasuredItems: z.array(UnmeasuredInputSchema),
})

export type SaveFullAuditInput = z.infer<typeof SaveFullAuditSchema>

export const TrackAuditEventSchema = z.object({
  token: z.string().min(8),
  sessionId: z.string().min(8),
  type: AuditEventTypeSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
})

export const RecommendationSnippetInputSchema = z.object({
  id: z.string().optional(),
  categoryKey: AuditCategoryKeySchema,
  problemPattern: z.string().min(1),
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  bodyAr: z.string().min(1),
  bodyEn: z.string().min(1),
  impactAr: z.string().default(''),
  impactEn: z.string().default(''),
})

export const AuditSettingsInputSchema = z.object({
  ctaType: z.enum(['BOOK_CALL', 'WHATSAPP', 'DM_KEYWORD']).default('BOOK_CALL'),
  whatsappNumber: z.string().default('+966500000000'),
  whatsappMessageAr: z.string().default(''),
  whatsappMessageEn: z.string().default(''),
  bookingUrl: z.string().default('https://calendly.com/zyaddonga/30min'),
  dmKeyword: z.string().default('AUDIT'),
  instagramHandle: z.string().default('zyadcreative'),
  scarcityTextAr: z.string().default(''),
  scarcityTextEn: z.string().default(''),
  acceptingClients: z.boolean().default(true).optional(),
  fomoEnabled: z.boolean().default(true).optional(),
  fomoSeatsLeft: z.number().int().min(0).max(50).default(3).optional(),
  fomoCountdownMinutes: z.number().int().min(1).max(1440).default(45).optional(),
  fomoUrgencyTextAr: z
    .string()
    .default('العرض والأولوية متاحان لفترة محدودة — احجز جلستك الاستراتيجية قبل اكتمال المقاعد')
    .optional(),
  fomoUrgencyTextEn: z
    .string()
    .default('Priority onboarding is available for a limited time — claim your strategy session before seats fill up')
    .optional(),
  reelsDisplayMode: z
    .enum(['ALL', 'LAST_10', 'TOP_3', 'TOP_4', 'TOP_5'])
    .default('TOP_3')
    .optional(),
  defaultLanguage: AuditLanguageSchema.default('ar'),
  defaultDigits: z.enum(['western', 'arabic-indic']).default('western'),
  weightsJson: z.record(z.string(), z.number()).default(DEFAULT_CATEGORY_WEIGHTS),
  defaultUnmeasuredJson: z
    .array(
      z.object({
        label: z.string(),
        whyItMatters: z.string(),
      })
    )
    .default(DEFAULT_UNMEASURED_ITEMS),
})
export type AuditSettingsData = z.infer<typeof AuditSettingsInputSchema>
