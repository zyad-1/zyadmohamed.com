import {
  AuditCategoryKey,
  AuditCheckStatus,
  AuditEventType,
  AuditFindingSeverity,
  AuditHookType,
  AuditLanguage,
  AuditProfileCheckKey,
  AuditStatus,
  DEFAULT_CATEGORY_WEIGHTS,
  DEFAULT_UNMEASURED_ITEMS,
} from '../schemas'
import { calculateAuditMetrics, computeWeightedOverallScore } from '../metrics'

export interface FullAuditRecord {
  id: string
  prospectId: string
  status: AuditStatus
  language: AuditLanguage
  shareToken: string
  publishedAt: string | null
  expiresAt: string | null
  overallScore: number
  summaryOpening: string
  verdictLine: string
  createdAt: string
  updatedAt: string
  prospect: {
    id: string
    handle: string
    displayName: string
    niche: string
    followers: number
    followingCount: number | null
    postsCount: number | null
    profileUrl: string
    linkInBioUrl: string | null
    avatarUrl?: string | null
    bio?: string | null
    bioLinks?: Array<{ title: string; url: string }>
    notes: string
    createdAt: string
    updatedAt: string
  }
  reels: Array<{
    id: string
    auditId: string
    shortcode?: string | null
    url: string | null
    thumbnailUrl?: string | null
    caption?: string | null
    postedAt: string
    views: number
    viewsEstimated?: boolean | null
    likes: number
    comments: number
    shares?: number | null
    saves?: number | null
    durationSec: number | null
    topic: string | null
    hookType: AuditHookType | null
    hasSubtitles: boolean | null
    hasCta: boolean | null
    isRepost: boolean | null
    demandSignalsCount: number
    pros?: string | null
    cons?: string | null
    editorNotes: string
    position: number
  }>
  profileChecks: Array<{
    id: string
    auditId: string
    key: AuditProfileCheckKey
    status: AuditCheckStatus
    evidence: string
    screenshotUrl: string | null
  }>
  categoryScores: Array<{
    id: string
    auditId: string
    categoryKey: AuditCategoryKey
    score: number
    autoSuggestedScore: number | null
    isAutoSuggested: boolean
    isOverridden: boolean
    evidence: string
    recommendation: string
    weight: number
  }>
  findings: Array<{
    id: string
    auditId: string
    rank: number
    title: string
    evidence: string
    businessImpact: string
    apxFix: string
    severity: AuditFindingSeverity
  }>
  competitors: Array<{
    id: string
    auditId: string
    handle: string
    displayName: string
    followers: number
    medianViews: number
    notes: string
    reels: Array<{
      id: string
      competitorId: string
      postedAt: string
      views: number
      likes: number
      comments: number
    }>
  }>
  unmeasuredItems: Array<{
    id: string
    auditId: string
    label: string
    whyItMatters: string
    position: number
  }>
  events: Array<{
    id: string
    auditId: string
    sessionId: string
    type: AuditEventType
    payload: Record<string, unknown>
    createdAt: string
  }>
  uploads: Array<{
    id: string
    auditId: string
    fileUrl: string
    fileName: string
    fileSize: number
    mimeType: string
    notes: string | null
    createdAt: string
  }>
}

export interface SnippetRecord {
  id: string
  categoryKey: AuditCategoryKey
  problemPattern: string
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  impactAr: string
  impactEn: string
  createdAt: string
  updatedAt: string
}

export interface AuditStoreSchema {
  audits: FullAuditRecord[]
  snippets: SnippetRecord[]
  settings: {
    id: string
    ctaType: 'BOOK_CALL' | 'WHATSAPP' | 'DM_KEYWORD'
    whatsappNumber: string
    whatsappMessageAr: string
    whatsappMessageEn: string
    bookingUrl: string
    dmKeyword: string
    instagramHandle: string
    scarcityTextAr: string
    scarcityTextEn: string
    acceptingClients?: boolean
    fomoEnabled?: boolean
    fomoSeatsLeft?: number
    fomoCountdownMinutes?: number
    fomoUrgencyTextAr?: string
    fomoUrgencyTextEn?: string
    reelsDisplayMode?: 'ALL' | 'LAST_10' | 'TOP_3' | 'TOP_4' | 'TOP_5'
    defaultLanguage: AuditLanguage
    defaultDigits: 'western' | 'arabic-indic'
    weightsJson: Record<string, number>
    defaultUnmeasuredJson: Array<{ label: string; whyItMatters: string }>
    updatedAt: string
  }
}

export const DEMO_SHARE_TOKEN = 'demo-apx-audit-token-2026-gulf-consultant'

export function createDefaultSnippets(): SnippetRecord[] {
  const now = '2026-10-01T10:00:00.000Z'
  return [
    {
      id: 'snip-hook-slow-intro',
      categoryKey: 'hooks_editing',
      problemPattern: 'Slow / Greeting Intro in First 3 Seconds',
      titleAr: 'ضبط أول 3 ثوانٍ: إلغاء المقدمات الترحيبية والدخول بهوك نتيجة أو مشكلة',
      titleEn: 'First 3-Second Hook Overhaul: Replace Greetings with Problem/Outcome Hooks',
      bodyAr:
        'استبدال جمل الترحيب التقليدية ("السلام عليكم"، "في هذا الفيديو سنتحدث عن...") بهوك مبني على فجوة فضول أو رقم محدد أو خطأ شائع يقع فيه العميل المستهدف، مع حركة بصرية وكابشن واضح من الثانية 0:00.',
      bodyEn:
        'Eliminate generic greetings in seconds 0:00–0:03. Open immediately with a specific costly mistake, contrarian claim, or concrete case metric paired with dynamic visual framing and high-contrast kinetic captions.',
      impactAr:
        'خسارة 65%+ من المشاهدين المؤهلين في أول ثانيتين قبل سماع قيمة خبرتك الحقيقية.',
      impactEn:
        'Losing 65%+ of qualified viewers in the first 2 seconds before they ever hear your core expertise.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'snip-funnel-dead-bio-link',
      categoryKey: 'conversion_funnel',
      problemPattern: 'Multi-link Linktree / No Clear Qualifying Funnel',
      titleAr: 'استبدال تشتيت الروابط المتعددة بمسار تأهيل وحجز واحد (Single VSL + Calendar Funnel)',
      titleEn: 'Replace Multi-Link Clutter with a Single Qualifying VSL + Booking Funnel',
      bodyAr:
        'توحيد دعوة اتخاذ الإجراء (CTA) في البايو والريلز نحو مسار واحد واضح: صفحة هبوط سريعة تحتوي على فيديو تعريفي قصير (VSL) وفورم تأهيل مسبق يقود مباشرة إلى حجز مكالمة استشارية أو محادثة واتساب مؤهلة.',
      bodyEn:
        'Consolidate all profile and Reel CTAs into a single high-converting path: a focused landing page with a short VSL + qualification form routing directly to a calendar booking or qualified WhatsApp flow.',
      impactAr:
        'حتى عندما ينجح فيديو في تحقيق مشاهدات عالية، يخرج الزائر من البروفايل دون حجز أو ترك بياناته.',
      impactEn:
        'Even when a Reel spikes in views, high-intent visitors bounce from the profile without booking or converting.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'snip-content-outlier-dependency',
      categoryKey: 'content_system',
      problemPattern: 'High Outlier Ratio / No Repeatable Series',
      titleAr: 'تحويل النشر العشوائي إلى 3 سلاسل محتوى أسبوعية قابلة للتكرار',
      titleEn: 'Replace Sporadic Topics with 3 Repeatable Weekly Content Pillars',
      bodyAr:
        'بناء مصفوفة محتوى من 3 زوايا ثابتة: (1) تفكيك أخطاء شائعة مكلفة لدى العميل، (2) تحليل حالات ومواقف واقعية، (3) الإجابة عن اعتراضات ما قبل الشراء — بمعدل 3 إلى 4 فيديوهات أسبوعياً.',
      bodyEn:
        'Install a 3-pillar weekly matrix: (1) Costly buyer mistakes, (2) Real-world diagnostic breakdowns, (3) Pre-purchase objection handling — executed at 3–4 Reels/week.',
      impactAr:
        'اعتماد الحساب على "ضربات الحظ" في المشاهدات وعدم القدرة على التنبؤ بعدد العملاء المحتملين شهرياً.',
      impactEn:
        'Reliance on lucky one-off spikes with zero predictability in monthly inbound pipeline.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'snip-positioning-generic-bio',
      categoryKey: 'positioning',
      problemPattern: 'Broad / Generic Bio Title Without ICP + Outcome',
      titleAr: 'إعادة صياغة البايو بمعادلة: (من تخدم + ما النتيجة + الإثبات + خطوة واحدة)',
      titleEn: 'Rewrite Bio Using the Authority Formula: ICP + Concrete Outcome + Single CTA',
      bodyAr:
        'تحويل البايو من توصيف وظيفي عام إلى وعد موجه مباشرة لصاحب القرار، مع إضافة الكلمة المفتاحية التخصصية بجانب الاسم ليظهر الحساب في بحث إنستغرام وجوجل.',
      bodyEn:
        'Transform the bio from a generic job title into an outcome-driven promise aimed at decision-makers, and append the primary searchable keyword to the Instagram Name field.',
      impactAr:
        'الزائر الجديد لا يفهم خلال 3 ثوانٍ لماذا يجب أن يختارك أنت بدلاً من عشرات الحسابات المشابهة.',
      impactEn:
        'First-time profile visitors cannot tell within 3 seconds why you are the category authority.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'snip-pinned-posts-missing',
      categoryKey: 'profile_bio',
      problemPattern: 'Missing or Random Pinned Posts',
      titleAr: 'تثبيت 3 منشورات استراتيجية (مسمار السلطة + دراسة حالة + شرح منهجية العمل)',
      titleEn: 'Pin 3 Strategic Assets: Authority Story, Diagnostic Breakdown, and Offer Mechanism',
      bodyAr:
        'تخصيص الخانات الثلاث المثبتة في أعلى الشبكة لتعمل كصفحة مبيعات مصغرة يستعرضها أي عميل محتمل فور دخوله الحساب.',
      bodyEn:
        'Dedicate the 3 pinned grid slots to act as an instant mini-sales page for every new profile visitor.',
      impactAr:
        'أول 3 فيديوهات يراها الزائر في الشبكة قد تكون أضعف فيديوهاتك أو أقلها صلة بخدمتك الأساسية.',
      impactEn:
        'New visitors judge your brand by whatever random last 3 posts happen to sit at the top of your grid.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'snip-engagement-no-dm-keyword',
      categoryKey: 'engagement_quality',
      problemPattern: 'High Demand Comments Left Uncaptured',
      titleAr: 'تفعيل نظام الكلمة المفتاحية (Comment/DM Keyword) لتحويل التعليقات إلى محادثات بيعية',
      titleEn: 'Deploy a Comment/DM Keyword Trigger to Capture Buyer-Intent Comments',
      bodyAr:
        'إنهاء كل فيديو بدعوة واضحة لكتابة كلمة محددة في التعليقات أو الخاص للحصول على تشخيص أو ملف تطبيقي، مما يضاعف التفاعل ويفتح محادثات مباشرة مع المهتمين.',
      bodyEn:
        'Close each Reel with a specific keyword CTA that triggers a structured DM qualification conversation and boosts algorithmic comment velocity.',
      impactAr:
        'إهدار تعليقات المهتمين الذين يسألون عن التفاصيل دون تحويلهم إلى مكالمات محجوزة.',
      impactEn:
        'Leaving buyer-intent comments sitting publicly in the thread instead of moving them into booked calls.',
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export function createDemoAuditRecord(): FullAuditRecord {
  const auditId = 'demo-audit-001'
  const prospectId = 'demo-prospect-001'
  const now = '2026-11-01T12:00:00.000Z'

  const demoReels: FullAuditRecord['reels'] = [
    {
      id: 'demo-reel-01',
      auditId,
      shortcode: 'DEMO01',
      url: 'https://instagram.com/reel/DEMO01',
      thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=480&auto=format&fit=crop&q=80',
      caption: 'نصيحة سريعة لكل مدير تنفيذي يواجه ضغط الاجتماعات اليومية وكيف ينظم أولوياته.',
      postedAt: '2026-08-02T12:00:00.000Z',
      views: 2400,
      likes: 68,
      comments: 6,
      durationSec: 58,
      topic: '[DEMO] نصيحة إدارية عامة',
      hookType: 'WEAK',
      hasSubtitles: false,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 0,
      pros: 'إضاءة جيدة وصوت واضح ومصداقية في طريقة التحدث.',
      cons: 'يبدأ بمقدمة ترحيبية تقليدية لمدة 4 ثوانٍ بدون هوك، ولا يحتوي على نصوص توضيحية (Subtitles) أو CTA.',
      editorNotes: '0:02 — يبدأ بمقدمة ترحيبية تقليدية بدون هوك | 0:14 — كادر ثابت بدون نصوص توضيحية',
      position: 1,
    },
    {
      id: 'demo-reel-02',
      auditId,
      shortcode: 'DEMO02',
      url: 'https://instagram.com/reel/DEMO02',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=480&auto=format&fit=crop&q=80',
      caption: 'متى تعرف أن شركتك تحتاج استشارة خارجية متخصصة قبل فوات الأوان؟ 3 علامات واضحة.',
      postedAt: '2026-08-14T12:00:00.000Z',
      views: 2950,
      likes: 82,
      comments: 9,
      durationSec: 47,
      topic: '[DEMO] متى تحتاج استشارة متخصصة؟',
      hookType: 'QUESTION',
      hasSubtitles: true,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 2,
      pros: 'سؤال افتتاحي مباشر يلمس صاحب القرار مع وجود ترجمة نصية على الشاشة.',
      cons: 'ينتهي الفيديو فجأة عند الثانية 0:39 بدون توجيه المشاهد لحجز استشارة أو كتابة كلمة مفتاحية.',
      editorNotes: '0:01 — سؤال جيد في البداية | 0:39 — ينتهي الفيديو فجأة بدون توجيه المشاهد للخطوة التالية',
      position: 2,
    },
    {
      id: 'demo-reel-03',
      auditId,
      shortcode: 'DEMO03',
      url: 'https://instagram.com/reel/DEMO03',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=480&auto=format&fit=crop&q=80',
      caption: 'مقتطف من حديثي في ملتقى القيادات التنفيذية حول مستقبل الحوكمة.',
      postedAt: '2026-08-29T12:00:00.000Z',
      views: 1980,
      likes: 49,
      comments: 4,
      durationSec: 72,
      topic: '[DEMO] مقتطف من لقاء سابق',
      hookType: 'WEAK',
      hasSubtitles: false,
      hasCta: false,
      isRepost: true,
      demandSignalsCount: 0,
      pros: 'يعكس مكانة اجتماعية ومهنية كمتحدث في المؤتمرات.',
      cons: 'إعادة نشر بعلامة مائية وجودة صوت قاعة مرتدة مع مدة طويلة (72 ثانية) أضعفت نسبة إكمال الفيديو.',
      editorNotes: '0:00 — إعادة نشر بعلامة مائية وجودة صوت منخفضة | 0:05 — غياب الفكرة الرئيسية',
      position: 3,
    },
    {
      id: 'demo-reel-04',
      auditId,
      shortcode: 'DEMO04',
      url: 'https://instagram.com/reel/DEMO04',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=480&auto=format&fit=crop&q=80',
      caption: 'خطأ مالي وتشغيلي واحد يكلف الشركات المتوسطة 30% من صافي أرباحها سنوياً دون أن يشعر مجلس الإدارة.',
      postedAt: '2026-09-06T12:00:00.000Z',
      views: 38400, // Outlier spike
      likes: 1420,
      comments: 118,
      durationSec: 41,
      topic: '[DEMO] خطأ يكلف الشركات 30% من أرباحها',
      hookType: 'BOLD_CLAIM',
      hasSubtitles: true,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 9,
      pros: 'هوك رقمي قوي جداً في أول ثانيتين جذب 38.4 ألف مشاهدة و9 تعليقات تطلب الاستشارة صراحةً.',
      cons: 'غياب تام لأي CTA في نهاية الفيديو؛ ضاعت فرصة تحويل آلاف المشاهدين المؤهلين إلى مكالمات مبيعات.',
      editorNotes: '0:00 — هوك رقمي قوي جداً جذب 38.4 ألف مشاهدة | 0:38 — غياب تام لأي CTA رغم وجود 9 تعليقات تسأل عن الخدمة!',
      position: 4,
    },
    {
      id: 'demo-reel-05',
      auditId,
      shortcode: 'DEMO05',
      url: 'https://instagram.com/reel/DEMO05',
      thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=480&auto=format&fit=crop&q=80',
      caption: 'كيف تخطط للربع القادم بطريقة منهجية مع فريقك التنفيذي.',
      postedAt: '2026-09-21T12:00:00.000Z',
      views: 3100,
      likes: 94,
      comments: 11,
      durationSec: 63,
      topic: '[DEMO] كيف تخطط للربع القادم',
      hookType: 'OTHER',
      hasSubtitles: true,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 1,
      pros: 'محتوى علمي مرتب في 3 نقاط واضحة.',
      cons: 'نُشر بعد انقطاع 15 يوماً عن النشر مما أضعف زخم الخوارزمية بعد الفيديو الضارب.',
      editorNotes: '0:03 — مدخل عام جداً بعد انقطاع 15 يوماً عن النشر | 0:22 — هبوط في إيقاع المونتاج',
      position: 5,
    },
    {
      id: 'demo-reel-06',
      auditId,
      shortcode: 'DEMO06',
      url: 'https://instagram.com/reel/DEMO06',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=480&auto=format&fit=crop&q=80',
      caption: 'ما الفرق الجوهري بين المستشار الاستراتيجي والمدير التنفيذي داخل المنظمة؟',
      postedAt: '2026-09-28T12:00:00.000Z',
      views: 2700,
      likes: 76,
      comments: 7,
      durationSec: 52,
      topic: '[DEMO] الفرق بين المستشار والتنفيذي',
      hookType: 'WEAK',
      hasSubtitles: false,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 0,
      pros: 'يوضح الفلسفة المهنية للعمل الاستشاري.',
      cons: 'يبدأ بتعريف نظري أكاديمي جاف بدلاً من موقف واقعي يواجهه صاحب الشركة، وبدون كابشن نصي.',
      editorNotes: '0:02 — يبدأ بتعريف نظري أكاديمي بدلاً من لمس ألم العميل',
      position: 6,
    },
    {
      id: 'demo-reel-07',
      auditId,
      shortcode: 'DEMO07',
      url: 'https://instagram.com/reel/DEMO07',
      thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=480&auto=format&fit=crop&q=80',
      caption: 'لماذا تفشل 70% من خطط التوسع الإقليمي في السوق الخليجي خلال السنة الأولى؟',
      postedAt: '2026-10-04T12:00:00.000Z',
      views: 6800,
      likes: 230,
      comments: 29,
      durationSec: 44,
      topic: '[DEMO] لماذا تفشل خطط التوسع في الخليج؟',
      hookType: 'QUESTION',
      hasSubtitles: true,
      hasCta: true,
      isRepost: false,
      demandSignalsCount: 4,
      pros: 'تخصيص جغرافي واضح للسوق الخليجي مع وجود دعوة لاتخاذ إجراء في النهاية.',
      cons: 'الـ CTA يطلب الضغط على رابط البايو، لكن رابط البايو يفتح شجرة روابط مشتتة.',
      editorNotes: '0:01 — سؤال مخصص للسوق الخليجي | 0:40 — CTA واضح لكن الرابط في البايو يقود لصفحة معقدة',
      position: 7,
    },
    {
      id: 'demo-reel-08',
      auditId,
      shortcode: 'DEMO08',
      url: 'https://instagram.com/reel/DEMO08',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=480&auto=format&fit=crop&q=80',
      caption: 'قصة شركة عائلية كادت تخسر حصتها السوقية بسبب غياب 3 مؤشرات قياس أداء أساسية.',
      postedAt: '2026-10-12T12:00:00.000Z',
      views: 3250,
      likes: 102,
      comments: 14,
      durationSec: 55,
      topic: '[DEMO] 3 مؤشرات لقياس كفاءة الفريق',
      hookType: 'STORY',
      hasSubtitles: true,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 2,
      pros: 'مدخل قصصي واقعي يعكس خبرة عملية حقيقية مع الشركات العائلية.',
      cons: 'حجم الخط في الكابشن صغير جداً وغير مريح للقراءة على شاشة الجوال بدون صوت.',
      editorNotes: '0:04 — قصة جيدة لكن حجم الخط في الكابشن صغير وغير مريح على الموبايل',
      position: 8,
    },
    {
      id: 'demo-reel-09',
      auditId,
      shortcode: 'DEMO09',
      url: 'https://instagram.com/reel/DEMO09',
      thumbnailUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=480&auto=format&fit=crop&q=80',
      caption: 'كيف نبني ثقافة التزام ومساءلة عالية داخل الفرق القيادية.',
      postedAt: '2026-10-17T12:00:00.000Z',
      views: 2650,
      likes: 71,
      comments: 8,
      durationSec: 61,
      topic: '[DEMO] ثقافة العمل المؤسسي',
      hookType: 'WEAK',
      hasSubtitles: false,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 0,
      pros: 'طرح هادئ ورزين.',
      cons: 'وقفة صامتة في أول ثانيتين قبل بدء الكلام أدت لتخطي الفيديو من قبل المشاهدين الجدد.',
      editorNotes: '0:02 — وقفة صامتة في أول ثانيتين قبل بدء الكلام',
      position: 9,
    },
    {
      id: 'demo-reel-10',
      auditId,
      shortcode: 'DEMO10',
      url: 'https://instagram.com/reel/DEMO10',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=480&auto=format&fit=crop&q=80',
      caption: 'لماذا تسعّر خدماتك بأقل من قيمتها الحقيقية؟ المعادلة الصحيحة لتسعير العقود الاستشارية.',
      postedAt: '2026-10-22T12:00:00.000Z',
      views: 7400,
      likes: 265,
      comments: 31,
      durationSec: 39,
      topic: '[DEMO] كيف تسعّر خدماتك الاستشارية؟',
      hookType: 'PATTERN_INTERRUPT',
      hasSubtitles: true,
      hasCta: true,
      isRepost: false,
      demandSignalsCount: 5,
      pros: 'مدة مثالية (39 ثانية) وكسر نمط بصري في البداية ولّد 5 طلبات تواصل في التعليقات.',
      cons: 'التعليقات الخمسة التي طلبت تفاصيل الحجز لم يتم الرد عليها أو تحويلها للخاص تلقائياً.',
      editorNotes: '0:00 — كسر نمط بصري ممتاز | 0:34 — 5 تعليقات تطلب تفاصيل الحجز دون رد تلقائي',
      position: 10,
    },
    {
      id: 'demo-reel-11',
      auditId,
      shortcode: 'DEMO11',
      url: 'https://instagram.com/reel/DEMO11',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=480&auto=format&fit=crop&q=80',
      caption: 'قاعدة بسيطة لإدارة وقت المدير التنفيذي وسط المهام المتزاحمة.',
      postedAt: '2026-10-26T12:00:00.000Z',
      views: 3150,
      likes: 89,
      comments: 10,
      durationSec: 49,
      topic: '[DEMO] إدارة الوقت للمدير التنفيذي',
      hookType: 'WEAK',
      hasSubtitles: true,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 1,
      pros: 'مونتاج نظيف وترجمة واضحة.',
      cons: 'موضوع "إدارة الوقت" عام ومستهلك ولا يبرز تخصصك الدقيق في استشارات نمو الشركات.',
      editorNotes: '0:01 — موضوع عام مستهلك لا يبرز تخصصك الدقيق',
      position: 11,
    },
    {
      id: 'demo-reel-12',
      auditId,
      shortcode: 'DEMO12',
      url: 'https://instagram.com/reel/DEMO12',
      thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=480&auto=format&fit=crop&q=80',
      caption: 'ملخص أهم الدروس الإدارية من هذا الأسبوع.',
      postedAt: '2026-10-30T12:00:00.000Z',
      views: 3050,
      likes: 88,
      comments: 9,
      durationSec: 53,
      topic: '[DEMO] ملخص أسبوعي',
      hookType: 'OTHER',
      hasSubtitles: false,
      hasCta: false,
      isRepost: false,
      demandSignalsCount: 0,
      pros: 'استمرارية في الظهور الأسبوعي.',
      cons: 'عنوان "ملخص أسبوعي" لا يخلق أي فضول لدى غير المتابعين، وإضاءة الفيديو غير متوازنة.',
      editorNotes: '0:03 — إضاءة غير متوازنة وغياب كامل للعناصر البصرية الداعمة',
      position: 12,
    },
  ]

  const demoCompetitors: FullAuditRecord['competitors'] = [
    {
      id: 'demo-comp-01',
      auditId,
      handle: 'demo.advisor.ksa',
      displayName: '[DEMO] مستشار نمو أعمال - الرياض',
      followers: 36000,
      medianViews: 9400,
      notes: 'ينشر 4 فيديوهات أسبوعياً بهوك قصصي واضح وبايو يقود مباشرة لحجز جلسة تشخيصية.',
      reels: [
        { id: 'cr-1', competitorId: 'demo-comp-01', postedAt: '2026-10-15T12:00:00.000Z', views: 8900, likes: 340, comments: 42 },
        { id: 'cr-2', competitorId: 'demo-comp-01', postedAt: '2026-10-20T12:00:00.000Z', views: 9400, likes: 380, comments: 51 },
        { id: 'cr-3', competitorId: 'demo-comp-01', postedAt: '2026-10-25T12:00:00.000Z', views: 11200, likes: 460, comments: 64 },
      ],
    },
    {
      id: 'demo-comp-02',
      auditId,
      handle: 'demo.strategy.ae',
      displayName: '[DEMO] استشاري استراتيجي - دبي',
      followers: 29000,
      medianViews: 8100,
      notes: 'يعتمد على 3 سلاسل ثابتة مع نظام الكلمة المفتاحية في التعليقات.',
      reels: [
        { id: 'cr-4', competitorId: 'demo-comp-02', postedAt: '2026-10-14T12:00:00.000Z', views: 7600, likes: 290, comments: 33 },
        { id: 'cr-5', competitorId: 'demo-comp-02', postedAt: '2026-10-19T12:00:00.000Z', views: 8100, likes: 315, comments: 39 },
        { id: 'cr-6', competitorId: 'demo-comp-02', postedAt: '2026-10-27T12:00:00.000Z', views: 9800, likes: 410, comments: 48 },
      ],
    },
  ]

  const computed = calculateAuditMetrics({
    followers: 42000,
    reels: demoReels,
    competitors: demoCompetitors,
  })

  const categoryScores: FullAuditRecord['categoryScores'] = [
    {
      id: 'cs-1',
      auditId,
      categoryKey: 'positioning',
      score: 5,
      autoSuggestedScore: null,
      isAutoSuggested: false,
      isOverridden: false,
      evidence:
        '[DEMO] الخبرة المهنية واضحة عند الاستماع للفيديو بالكامل، لكن العنوان في البايو عام ("مستشار أعمال ومدرب") ولا يحدد فئة العملاء المستهدفة أو النتيجة الملموسة.',
      recommendation:
        'تخصيص التموضع في البايو والمحتوى ليتحدث مباشرة إلى مؤسسي الشركات والمديرين التنفيذيين في الخليج ومصر.',
      weight: DEFAULT_CATEGORY_WEIGHTS.positioning,
    },
    {
      id: 'cs-2',
      auditId,
      categoryKey: 'profile_bio',
      score: 4,
      autoSuggestedScore: null,
      isAutoSuggested: false,
      isOverridden: false,
      evidence:
        '[DEMO] غياب الكلمة المفتاحية من حقل الاسم، وعدم وجود منشورات مثبتة (Pinned Posts) تشرح منهجية العمل أو تعرض دراسات حالة.',
      recommendation:
        'إعادة هيكلة البايو من 4 أسطر (الوعد + الإثبات + CTA واحد) وتثبيت 3 فيديوهات استراتيجية في أعلى الحساب.',
      weight: DEFAULT_CATEGORY_WEIGHTS.profile_bio,
    },
    {
      id: 'cs-3',
      auditId,
      categoryKey: 'hooks_editing',
      score: 4,
      autoSuggestedScore: null,
      isAutoSuggested: false,
      isOverridden: false,
      evidence:
        '[DEMO] 7 من أصل 12 فيديو تبدأ بمقدمات بطيئة أو ترحيب تقليدي، و42% من الفيديوهات تفتقر إلى ترجمة نصية (Subtitles) واضحة للمشاهدة الصامتة.',
      recommendation:
        'تطبيق هيكل الهوك المزدوج (بصري + لفظي في أول ثانيتين) مع مونتاج احتفاظ (Retention Editing) وكابشن ديناميكي واضح.',
      weight: DEFAULT_CATEGORY_WEIGHTS.hooks_editing,
    },
    {
      id: 'cs-4',
      auditId,
      categoryKey: 'content_system',
      score: computed.autoSuggestedScores.content_system.score,
      autoSuggestedScore: computed.autoSuggestedScores.content_system.score,
      isAutoSuggested: true,
      isOverridden: false,
      evidence: `[DEMO] ${computed.autoSuggestedScores.content_system.evidenceAr}`,
      recommendation: computed.autoSuggestedScores.content_system.recommendationAr,
      weight: DEFAULT_CATEGORY_WEIGHTS.content_system,
    },
    {
      id: 'cs-5',
      auditId,
      categoryKey: 'reach_efficiency',
      score: computed.autoSuggestedScores.reach_efficiency.score,
      autoSuggestedScore: computed.autoSuggestedScores.reach_efficiency.score,
      isAutoSuggested: true,
      isOverridden: false,
      evidence: `[DEMO] ${computed.autoSuggestedScores.reach_efficiency.evidenceAr}`,
      recommendation: computed.autoSuggestedScores.reach_efficiency.recommendationAr,
      weight: DEFAULT_CATEGORY_WEIGHTS.reach_efficiency,
    },
    {
      id: 'cs-6',
      auditId,
      categoryKey: 'engagement_quality',
      score: 6,
      autoSuggestedScore: null,
      isAutoSuggested: false,
      isOverridden: false,
      evidence:
        '[DEMO] تم رصد 24 إشارة طلب شرائي صريحة في التعليقات ("كيف نتواصل؟"، "بكم الاستشارة؟") خاصة في الفيديوهات المتخصصة، مما يثبت وجود طلب حقيقي غير مستغل.',
      recommendation:
        'تحويل إشارات الطلب في التعليقات إلى محادثات مؤهلة عبر نظام الكلمة المفتاحية ومسار الحجز المباشر.',
      weight: DEFAULT_CATEGORY_WEIGHTS.engagement_quality,
    },
    {
      id: 'cs-7',
      auditId,
      categoryKey: 'authority_proof',
      score: 6,
      autoSuggestedScore: null,
      isAutoSuggested: false,
      isOverridden: false,
      evidence:
        '[DEMO] حضور قوي وثقة عالية أمام الكاميرا، لكن الإثبات الاجتماعي ونتائج العملاء غير موثقة في Highlights أو منشورات مثبتة.',
      recommendation:
        'تحويل قصص نجاح العملاء ومواقفهم الواقعية إلى سلسلة فيديوهات تشخيصية وهايلاتس منظمة.',
      weight: DEFAULT_CATEGORY_WEIGHTS.authority_proof,
    },
    {
      id: 'cs-8',
      auditId,
      categoryKey: 'conversion_funnel',
      score: 2,
      autoSuggestedScore: null,
      isAutoSuggested: false,
      isOverridden: false,
      evidence:
        '[DEMO] 83% من الفيديوهات تنتهي بدون أي CTA، والرابط في البايو يحتوي على 6 روابط متفرقة تشتت الزائر ولا تقوده لخطوة حجز واضحة.',
      recommendation:
        'بناء قمع تحويل مباشر (VSL + نموذج تأهيل + تقويم حجز) مرتبط بكل فيديو وبوعد البايو.',
      weight: DEFAULT_CATEGORY_WEIGHTS.conversion_funnel,
    },
    {
      id: 'cs-9',
      auditId,
      categoryKey: 'competitor_gap',
      score: computed.autoSuggestedScores.competitor_gap.score,
      autoSuggestedScore: computed.autoSuggestedScores.competitor_gap.score,
      isAutoSuggested: true,
      isOverridden: false,
      evidence: `[DEMO] ${computed.autoSuggestedScores.competitor_gap.evidenceAr}`,
      recommendation: computed.autoSuggestedScores.competitor_gap.recommendationAr,
      weight: DEFAULT_CATEGORY_WEIGHTS.competitor_gap,
    },
  ]

  const overallScore = computeWeightedOverallScore(categoryScores)

  return {
    id: auditId,
    prospectId,
    status: 'PUBLISHED',
    language: 'ar',
    shareToken: DEMO_SHARE_TOKEN,
    publishedAt: now,
    expiresAt: null,
    overallScore,
    summaryOpening:
      '[نموذج تجريبي — DEMO] تمتلك حضوراً قيادياً واضحاً أمام الكاميرا ومصداقية مهنية عالية؛ الدليل الأقوى هو أن الفيديوهات التي لمست مشكلة مالية محددة (مثل فيديو الـ 38.4 ألف مشاهدة) ولّدت 24 تعليقاً يسأل صراحةً عن طريقة العمل معك. المشكلة ليست في خبرتك، بل في غياب منظومة المحتوى ومسار التحويل الذي يلتقط هذا الطلب.',
    verdictLine:
      '[DEMO] خبرة استشارية قوية، لكن 92% من جمهورك لا يرى محتواك ومسار التحويل في البايو يسرّب العملاء الجاهزين للشراء.',
    createdAt: now,
    updatedAt: now,
    prospect: {
      id: prospectId,
      handle: 'demo.consultant',
      displayName: '[DEMO] د. طارق المنصور (نموذج تجريبي)',
      niche: 'استشارات نمو الشركات والقيادة التنفيذية — الخليج (DEMO)',
      followers: 42000,
      followingCount: 380,
      postsCount: 145,
      profileUrl: 'https://instagram.com/demo.consultant',
      linkInBioUrl: 'https://linktr.ee/demo_consultant_example',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=240&auto=format&fit=crop&q=80',
      bio: 'مستشار استراتيجي لتطوير الأعمال والحوكمة المؤسسية في الخليج 🇸🇦🇦🇪 | خبرة +15 عاماً مع مجالس الإدارة | متحدث في منتديات القيادة التنفيذية',
      bioLinks: [
        { title: 'Linktree — جميع الروابط', url: 'https://linktr.ee/demo_consultant_example' },
      ],
      notes: 'DEMO SEED RECORD — جميع البيانات في هذا السجل هي بيانات نموذجية توضيحية (DEMO) وليست لعميل حقيقي.',
      createdAt: now,
      updatedAt: now,
    },
    reels: demoReels,
    profileChecks: [
      {
        id: 'pc-1',
        auditId,
        key: 'nameKeyword',
        status: 'MISSING',
        evidence: '[DEMO] الاسم يظهر فقط كـ "د. طارق المنصور" بدون كلمة مفتاحية بحثية مثل "مستشار نمو شركات | Executive Advisor".',
        screenshotUrl: null,
      },
      {
        id: 'pc-2',
        auditId,
        key: 'bioPromise',
        status: 'WEAK',
        evidence: '[DEMO] البايو يذكر الألقاب المهنية العامة دون تحديد النتيجة المباشرة التي يحصل عليها العميل.',
        screenshotUrl: null,
      },
      {
        id: 'pc-3',
        auditId,
        key: 'singleCta',
        status: 'MISSING',
        evidence: '[DEMO] لا يوجد سطر توجيهي واضح (CTA) قبل الرابط في البايو.',
        screenshotUrl: null,
      },
      {
        id: 'pc-4',
        auditId,
        key: 'highlights',
        status: 'WEAK',
        evidence: '[DEMO] الهايلاتس تحتوي على تغطيات مؤتمرات قديمة منذ 2023 و2024 بدون قسم يوضح الخدمة أو آلية العمل.',
        screenshotUrl: null,
      },
      {
        id: 'pc-5',
        auditId,
        key: 'pinnedPosts',
        status: 'MISSING',
        evidence: '[DEMO] لا توجد أي منشورات مثبتة (Pinned Reels) في أعلى الحساب لتعريف الزائر الجديد.',
        screenshotUrl: null,
      },
      {
        id: 'pc-6',
        auditId,
        key: 'linkSpeed',
        status: 'WEAK',
        evidence: '[DEMO] الرابط يفتح قائمة Linktree تحتوي على 6 أزرار متفرقة (يوتيوب، بودكاست، مقالة قديمة، واتساب عام).',
        screenshotUrl: null,
      },
      {
        id: 'pc-7',
        auditId,
        key: 'offerClarity',
        status: 'MISSING',
        evidence: '[DEMO] عند الضغط على الرابط لا توجد صفحة تشرح العرض الاستشاري أو لمن هو مخصص.',
        screenshotUrl: null,
      },
      {
        id: 'pc-8',
        auditId,
        key: 'leadMagnetOrDmKeyword',
        status: 'MISSING',
        evidence: '[DEMO] لا يوجد نظام كلمة مفتاحية بالخاص أو أصل رقمي مجاني لالتقاط بيانات المهتمين.',
        screenshotUrl: null,
      },
      {
        id: 'pc-9',
        auditId,
        key: 'contactButton',
        status: 'OK',
        evidence: '[DEMO] أزرار التواصل الأساسية في الحساب التجاري مفعلة.',
        screenshotUrl: null,
      },
      {
        id: 'pc-10',
        auditId,
        key: 'socialProofVisible',
        status: 'WEAK',
        evidence: '[DEMO] الخبرات مذكورة شفهياً داخل بعض الفيديوهات فقط وغير مبرزة بصرياً للزائر السريع.',
        screenshotUrl: null,
      },
    ],
    categoryScores,
    findings: [
      {
        id: 'find-1',
        auditId,
        rank: 1,
        title: 'نزيف أول 3 ثوانٍ: 58% من الفيديوهات تبدأ بمقدمات ترحيبية تقتل الوصول',
        evidence:
          '[DEMO] وسيط المشاهدات الحالي 3,025 مشاهدة فقط (7.2% من المتابعين)، بينما عندما استخدمت هوك رقمي مباشر في الفيديو رقم #4 قفزت المشاهدات إلى 38,400 مشاهدة (معامل تذبذب 12.7x).',
        businessImpact:
          'الفجوة بين وسيط مشاهداتك الحالي والربع الأعلى لفيديوهاتك أنت تساوي آلاف المشاهدات المستهدفة الضائعة في كل فيديو تنشره.',
        apxFix:
          'في منظومة APX نقوم بكتابة سكريبتات مخصصة بهوك مزدوج (بصري + لفظي) محسوب بالثانية مع توجيه تصوير ومونتاج احتفاظ يرفع متوسط الوصول بشكل مستدام.',
        severity: 'CRITICAL',
      },
      {
        id: 'find-2',
        auditId,
        rank: 2,
        title: 'قمع تحويل مفقود: 24 إشارة طلب شرائي في التعليقات بدون مسار حجز',
        evidence:
          '[DEMO] رصدنا 24 تعليقاً من متابعين يسألون عن التفاصيل والاستشارات، لكن 10 من أصل 12 فيديو لا تحتوي على CTA، ورابط البايو يقود لـ Linktree مشتت بـ 6 روابط.',
        businessImpact:
          'العميل المحتمل ذو الملاءة المالية العالية لا يملك وقتاً للبحث عن طريقة الحجز؛ التشتيت في البايو يعني خسارة صفقات جاهزة أسبوعياً.',
        apxFix:
          'نبني لك مسار تحويل متكامل (Content → DM/Bio → VSL + Qualification → Booked Call) بحيث يتحول المشاهد المهتم إلى موعد مؤهل في تقويمك تلقائياً.',
        severity: 'CRITICAL',
      },
      {
        id: 'find-3',
        auditId,
        rank: 3,
        title: 'فجوة الكفاءة التنافسية: المنافسون يحققون 3.7x مشاهدات أكثر لكل متابع',
        evidence:
          '[DEMO] حسابك يحقق 7.2% كفاءة وصول للمتابعين، بينما الحسابات المماثلة في الرياض ودبي (@demo.advisor.ksa و @demo.strategy.ae) تحقق 26.1% و27.9% بفضل انتظام السلاسل الأسبوعية.',
        businessImpact:
          'الحسابات المنافسة تستحوذ على الحصة الذهنية (Share of Voice) لنفس الشريحة من العملاء رغم أن خبرتك العملية أعمق.',
        apxFix:
          'نثبت لك إيقاع نشر Done-For-You (من الاستراتيجية والسكريبت حتى المونتاج والنشر) مبني على 3 سلاسل سلطوية تغلق الفجوة التنافسية خلال 90 يوماً.',
        severity: 'HIGH',
      },
    ],
    competitors: demoCompetitors,
    unmeasuredItems: DEFAULT_UNMEASURED_ITEMS.map((item, idx) => ({
      id: `unm-${idx + 1}`,
      auditId,
      label: item.label,
      whyItMatters: item.whyItMatters,
      position: idx + 1,
    })),
    events: [
      {
        id: 'ev-demo-1',
        auditId,
        sessionId: 'demo-session-alpha',
        type: 'OPEN',
        payload: { elapsedSec: 5, userAgent: 'iPhone Safari (DEMO)' },
        createdAt: '2026-11-02T14:10:00.000Z',
      },
      {
        id: 'ev-demo-2',
        auditId,
        sessionId: 'demo-session-alpha',
        type: 'SCROLL_DEPTH',
        payload: { depth: 100, elapsedSec: 185 },
        createdAt: '2026-11-02T14:13:05.000Z',
      },
      {
        id: 'ev-demo-3',
        auditId,
        sessionId: 'demo-session-alpha',
        type: 'SECTION_VIEW',
        payload: { section: 'problems', elapsedSec: 140 },
        createdAt: '2026-11-02T14:12:20.000Z',
      },
      {
        id: 'ev-demo-4',
        auditId,
        sessionId: 'demo-session-beta',
        type: 'OPEN',
        payload: { elapsedSec: 10, userAgent: 'Desktop Chrome (DEMO)' },
        createdAt: '2026-11-03T09:30:00.000Z',
      },
      {
        id: 'ev-demo-5',
        auditId,
        sessionId: 'demo-session-beta',
        type: 'CTA_CLICK',
        payload: { ctaType: 'BOOK_CALL', elapsedSec: 210 },
        createdAt: '2026-11-03T09:33:30.000Z',
      },
    ],
    uploads: [],
  }
}

export function createInitialAuditStore(): AuditStoreSchema {
  return {
    audits: [createDemoAuditRecord()],
    snippets: createDefaultSnippets(),
    settings: {
      id: 'default',
      ctaType: 'BOOK_CALL',
      whatsappNumber: '+966500000000',
      whatsappMessageAr: 'مرحباً فريق APX، اطلعت على تقرير تدقيق حسابي وأود حجز جلسة استراتيجية.',
      whatsappMessageEn:
        'Hi APX team, I reviewed my Instagram audit report and would like to book a strategy session.',
      bookingUrl: 'https://calendly.com/zyaddonga/30min',
      dmKeyword: 'AUDIT',
      instagramHandle: 'zyadcreative',
      scarcityTextAr:
        'نقبل عدداً محدوداً من الشركاء في كل دفعة لضمان جودة التنفيذ الكامل (Done-For-You) خلال 90 يوماً.',
      scarcityTextEn:
        'We onboard a limited number of partners per cohort to guarantee full Done-For-You 90-day execution quality.',
      acceptingClients: true,
      fomoEnabled: true,
      fomoSeatsLeft: 3,
      fomoCountdownMinutes: 45,
      fomoUrgencyTextAr:
        'العرض والأولوية متاحان لفترة محدودة — احجز جلستك الاستراتيجية قبل اكتمال المقاعد',
      fomoUrgencyTextEn:
        'Priority onboarding is available for a limited time — claim your strategy session before seats fill up',
      defaultLanguage: 'ar',
      defaultDigits: 'western',
      weightsJson: { ...DEFAULT_CATEGORY_WEIGHTS },
      defaultUnmeasuredJson: [...DEFAULT_UNMEASURED_ITEMS],
      updatedAt: '2026-11-01T12:00:00.000Z',
    },
  }
}
