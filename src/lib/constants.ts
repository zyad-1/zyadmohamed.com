export const WHATSAPP_NUMBER = '201007311562'
export const WHATSAPP_URL =
  'https://wa.me/201007311562?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B%20APX%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%85%D9%86%D8%B8%D9%88%D9%85%D8%A9%20%D8%A7%D9%84%D9%80%2090%20%D9%8A%D9%88%D9%85%D8%A7%D9%8B.'

export const INSTAGRAM_URL = 'https://instagram.com/zyadcreative'

export const VSL_VIDEO_URL = process.env.NEXT_PUBLIC_VSL_VIDEO_URL || ''

export const CALENDLY_EMBED_URL =
  'https://calendly.com/zyaddonga/30min?hide_gdpr_banner=1&primary_color=8b5cf6'

export const DEFAULT_UNQUALIFIED_MESSAGE =
  'للأسف حاليًا غير مؤهل للعمل معنا، وده هدية مجانية لك'

export const HERO_METRICS = [
  {
    num: '+80M',
    label: 'مشاهدة أورجانيك',
  },
  {
    num: '+185K',
    label: 'متابع في 5 شهور لحساب واحد',
  },
  {
    num: '+7 سنوات',
    label: 'خبرة في صناعة المحتوى الاستراتيجي',
  },
]

export const PARTNER_BRANDS = [
  { nameAr: 'سلة', nameEn: 'Salla' },
  { nameAr: 'زد', nameEn: 'Zid' },
  { nameAr: 'مزن', nameEn: 'Mozn' },
  { nameAr: 'عطور ريف', nameEn: 'Reef Perfumes' },
]

export const PROBLEM_POINTS = [
  {
    index: '01',
    title: 'ضيق الوقت',
    body: 'يومك مزدحم بإدارة عملك وعملائك، ولا تملك وقتاً لكتابة السكريبتات أو المونتاج كل يوم.',
  },
  {
    index: '02',
    title: 'محتوى بدون مبيعات',
    body: 'نشر فيديوهات عشوائية قد يجمع بعض المشاهدات، لكنه لا يتحول إلى مكالمات أو عملاء يدفعون.',
  },
  {
    index: '03',
    title: 'الحفاظ على المكانة المهنية',
    body: 'تحتاج إلى ظهور رصين يعكس خبرتك ويبني ثقة العميل قبل أن يتواصل معك، بعيداً عن ملاحقة التريندات.',
  },
]

export const SYSTEM_STEPS = [
  {
    index: '01',
    tag: 'Strategy & Scripts',
    title: 'التخطيط والسكريبتات جاهزة لك',
    body: 'نحدد تموضعك في السوق وخطة المحتوى البيعية، ونكتب لك السكريبتات بالكامل مع توجيهات تصوير واضحة وبسيطة.',
  },
  {
    index: '02',
    tag: 'Shoot Easily',
    title: 'صوّر من مكانك في جلسة واحدة',
    body: 'تصوّر الفيديوهات عندك بتوجيهاتنا في أقل وقت ممكن دون تعقيد، وترسل لنا الفيديوهات الخام.',
  },
  {
    index: '03',
    tag: 'Editing & Funnel',
    title: 'المونتاج وربط الـ Funnel علينا',
    body: 'نستلم الفيديوهات ونتولى المونتاج الاحترافي بالكامل، ونربط المحتوى بمسار يحول المشاهدين إلى مكالمات مبيعات.',
  },
]

export const FOUNDER_INFO = {
  nameAr: 'زياد سعدون',
  nameEn: 'Zyad Saadon',
  roleAr: 'المؤسس — Founder of APX',
  photoUrl: '/founder-zyad.jpg',
  bio: 'أسسنا APX لنساعد الخبراء وأصحاب البيزنس في الخليج ومصر على تحويل خبرتهم الحقيقية إلى براند شخصي قوي ومنظومة محتوى تجلب عملاء مؤهلين باستمرار — دون استنزاف وقتهم في التخطيط أو الكتابة أو المونتاج.',
}

export interface ProofCardItem {
  id: string
  metric: string
  unit: string
  desc: string
  visible: boolean
}

export interface TestimonialItem {
  id: string
  clientTag: string
  beforeAfter: string
  quotePreview: string
  imageUrl: string
  visible: boolean
}

export interface PageContent {
  // Section 1: Header, Hero & VSL
  headerCtaText: string
  eyebrowText: string
  heroTitle: string
  heroTitleHighlight: string
  heroSubtitle: string
  vslVideoUrl: string
  vslPosterUrl: string
  vslCaption: string
  heroCtaText: string
  heroSubCtaText: string

  // Section 2: Metrics & Brands
  heroMetrics: Array<{ num: string; label: string }>
  brandsLabel: string
  partnerBrands: Array<{ nameAr: string; nameEn: string }>

  // Section 3: Problem
  problemHeading: string
  problemPoints: Array<{ index: string; title: string; body: string }>

  // Section 4: System Steps & Founder
  systemHeading: string
  systemSubheading: string
  systemSteps: Array<{ index: string; tag: string; title: string; body: string }>
  founderInfo: {
    nameAr: string
    nameEn: string
    roleAr: string
    photoUrl: string
    bio: string
  }

  // Section 5: Proof & Testimonials Headings
  proofHeading: string
  testimonialsSubheading: string
  proofCtaText: string

  // Section 6: Fit / Not Fit
  fitHeading: string
  fitYesTitle: string
  fitForList: string[]
  fitNoTitle: string
  notFitForList: string[]

  // Section 8: FAQ & Footer
  faqHeading: string
  faqItems: Array<{ q: string; a: string }>
  faqCtaText: string
  footerTagline: string
  footerCopyright: string

  // Booked Page (/booked)
  bookedBadge: string
  bookedTitle: string
  bookedSubtitle: string
  bookedWhatsappBtnText: string
  bookedWhatsappMessage: string
  bookedStepsTitle: string
  bookedSteps: Array<{ title: string; desc: string }>
}

export interface SiteSettings {
  showTestimonialsSection: boolean
  showProofCards: boolean
  skipQualificationForm: boolean
  calendlyUrl: string
  unqualifiedMessage: string
  unqualifiedRedirectTarget: string // '' (default magnet) or '/d/slug' or custom URL
  proofCards: ProofCardItem[]
  testimonials: TestimonialItem[]
  pageContent: PageContent
}

export const PROOF_CARDS: ProofCardItem[] = [
  {
    id: 'proof-1',
    metric: '+185,000',
    unit: 'متابع في 5 شهور فقط',
    desc: 'بناء الهوية، كتابة الـ Hooks، ومونتاج الفيديوهات القصيرة لحساب واحد من الصفر.',
    visible: true,
  },
  {
    id: 'proof-2',
    metric: '+80,000,000',
    unit: 'مشاهدة أورجانيك',
    desc: 'محتوى فيديو قصير مبني على الاحتفاظ بانتباه المشاهد من أول ثانية بدون إعلانات.',
    visible: true,
  },
  {
    id: 'proof-3',
    metric: '+7 سنوات',
    unit: 'خبرة في الخليج ومصر',
    desc: 'العمل مع علامات تجارية كبرى مثل: سلة (Salla)، زد (Zid)، مزن (Mozn)، وعطور ريف (Reef Perfumes).',
    visible: true,
  },
]

export const TESTIMONIAL_SCREENSHOTS: TestimonialItem[] = [
  {
    id: 'shot-1',
    clientTag: 'مؤسس شركة استشارية — الرياض',
    beforeAfter: 'قبل: محتوى متقطع ← بعد: حضور مستمر واستفسارات أسبوعية',
    quotePreview:
      '«أكثر شيء فرق معنا هو استلام السكريبتات جاهزة مع توجيهات التصوير، ثم استلام الفيديوهات بعد المونتاج جاهزة للنشر بأعلى جودة.»',
    imageUrl: '',
    visible: true,
  },
  {
    id: 'shot-2',
    clientTag: 'خبير ومدرب High-Ticket — دبي',
    beforeAfter: 'قبل: الاعتماد على الترشيحات فقط ← بعد: محتوى مربوط بحجز مكالمات',
    quotePreview:
      '«من أول شهر التزمنا فيه بالخطة، بدأت تصلنا رسائل من عملاء جاهزين للتعاقد لأنهم شاهدوا الفيديوهات واقتنعوا بطريقة تفكيرنا.»',
    imageUrl: '',
    visible: true,
  },
  {
    id: 'shot-3',
    clientTag: 'طبيب استشاري — الخليج',
    beforeAfter: 'قبل: ضيق الوقت يمنع التصوير ← بعد: جلسة تصوير واحدة تغطي الشهر',
    quotePreview:
      '«تجهيز السكريبتات وتوجيهات التصوير وفر عليّ كل المجهود، وبمجرد إرسال الفيديوهات الخام يتم المونتاج والترتيب بالكامل.»',
    imageUrl: '',
    visible: true,
  },
]

export const FIT_FOR_LIST = [
  'خبير، طبيب، استشاري، مدرب، أو صاحب بيزنس تقدم خدمة عالية القيمة (High-Ticket).',
  'تريد منظومة متكاملة تتولى عنك التخطيط، كتابة السكريبتات، توجيه التصوير، مونتاج الفيديوهات، وربط الـ Funnel.',
  'مستعد للالتزام بمنظومة عمل واضحة لمدة 90 يوماً (الحد الأدنى للتعاقد 3 شهور).',
]

export const NOT_FIT_FOR_LIST = [
  'تبحث عن مونتاج فيديوهات متفرقة بالقطعة بدون استراتيجية أو خطة مبيعات.',
  'ليس لديك خدمة واضحة تبيعها حالياً.',
  'تبحث عن نتائج فورية بين يوم وليلة دون التزام بمسار الـ 90 يوماً.',
]

export const FAQ_ITEMS = [
  {
    q: 'كيف تتم عملية التصوير والمونتاج؟',
    a: 'نرسل لك السكريبتات جاهزة مع توجيهات تصوير واضحة وبسيطة لتصوّر الفيديوهات من مكانك في جلسة واحدة مركزة، ثم نستلم منك الفيديوهات الخام ونتولى مونتاج الفيديوهات وربطها بالـ Funnel بالكامل.',
  },
  {
    q: 'كم من الوقت ستحتاجون مني شهرياً؟',
    a: 'جلسة استراتيجية في البداية، ثم وقت محدد لتصوير الفيديوهات المكتوبة لك مسبقاً. نحن نتولى كل مراحل التخطيط والكتابة والمونتاج.',
  },
  {
    q: 'لماذا الحد الأدنى للتعاقد هو 3 شهور (90 يوماً)؟',
    a: 'لأن بناء الثقة وتحويل المشاهدات إلى مكالمات مبيعات مستمرة يحتاج إلى تأسيس في الشهر الأول، ثم مراكمة النتائج في الشهرين الثاني والثالث.',
  },
  {
    q: 'على أي منصات سننشر المحتوى؟',
    a: 'نركز على منصات الفيديو القصير الأكثر تأثيراً في الخليج ومصر (Instagram Reels · TikTok · YouTube Shorts) حسب تواجد عميلك المثالي.',
  },
]

export const DEFAULT_PAGE_CONTENT: PageContent = {
  headerCtaText: 'احجز مكالمتك الاستراتيجية',
  eyebrowText: 'للخبراء، الأطباء، الاستشاريين، وأصحاب البيزنس في الخليج ومصر',
  heroTitle: 'نحوّل خبرتك إلى براند شخصي قوي ومنظومة فيديوهات قصيرة تجلب لك',
  heroTitleHighlight: 'عملاء مؤهلين خلال 90 يوماً',
  heroSubtitle:
    'نكتب السكريبتات ونعطيك توجيهات التصوير لتصوّر من مكانك في جلسة واحدة — ثم نستلم الفيديوهات ونتولى المونتاج وربط الـ Funnel بالكامل.',
  vslVideoUrl: VSL_VIDEO_URL,
  vslPosterUrl: '',
  vslCaption: 'شاهد في 4 دقائق: كيف نبني منظومة براندك الشخصي في 3 خطوات بسيطة',
  heroCtaText: 'احجز مكالمة استراتيجية مجانية (30 دقيقة)',
  heroSubCtaText: 'Done-For-You · Reels & TikTok & Shorts · الخليج ومصر',

  heroMetrics: HERO_METRICS,
  brandsLabel: 'خبرة عملية مع علامات تجارية رائدة:',
  partnerBrands: PARTNER_BRANDS,

  problemHeading: 'خبرتك قوية على أرض الواقع.. لكن حضورك الرقمي لا يعكسها.',
  problemPoints: PROBLEM_POINTS,

  systemHeading: 'كيف نعمل في APX؟ (أقل خطوات ومجهود منك)',
  systemSubheading: 'منظومة متكاملة (Done-For-You) في 3 خطوات بسيطة فقط:',
  systemSteps: SYSTEM_STEPS,
  founderInfo: FOUNDER_INFO,

  proofHeading: 'نتائج حقيقية وآراء العملاء',
  testimonialsSubheading: 'شهادات ورسائل العملاء',
  proofCtaText: 'احجز مكالمتك الاستراتيجية الآن',

  fitHeading: 'هل هذه المنظومة مناسبة لك؟',
  fitYesTitle: 'مناسبة لك إذا كنت:',
  fitForList: FIT_FOR_LIST,
  fitNoTitle: 'غير مناسبة لك إذا كنت:',
  notFitForList: NOT_FIT_FOR_LIST,

  faqHeading: 'الأسئلة الشائعة',
  faqItems: FAQ_ITEMS,
  faqCtaText: 'ابدأ الآن: احجز مكالمتك الاستراتيجية ↑',
  footerTagline: 'APX Agency · Build. Brand. Grow.',
  footerCopyright: '© 2025 APX — جميع الحقوق محفوظة',

  bookedBadge: 'تم استلام طلبك بنجاح',
  bookedTitle: 'خطوة أخيرة لتأكيد موعد مكالمتك الاستراتيجية',
  bookedSubtitle:
    'اضغط على زر الواتساب بالأسفل لتأكيد حضورك واستلام رابط الاجتماع وتفاصيل التحضير قبل المكالمة.',
  bookedWhatsappBtnText: 'تأكيد الموعد الآن عبر واتساب',
  bookedWhatsappMessage: 'أهلاً APX، قمت بحجز موعد المكالمة الاستراتيجية وأود تأكيد الحضور.',
  bookedStepsTitle: 'ماذا يحدث قبل مكالمتنا؟',
  bookedSteps: [
    {
      title: '1. مراجعة حسابك الحالي',
      desc: 'نقوم بمراجعة حضورك الرقمي الحالي وتجهيز ملاحظات عملية مخصصة لمجالك قبل الموعد.',
    },
    {
      title: '2. رسم خارطة طريق الـ 90 يوماً',
      desc: 'نناقش في المكالمة خطة المحتوى البيعي وكيفية تحويل المشاهدات إلى استفسارات ومكالمات مبيعات.',
    },
    {
      title: '3. الالتزام بالموعد المحدد',
      desc: 'نخصص هذا الوقت بالكامل لتحليل مشروعك، لذا يرجى التواجد في مكان هادئ في الموعد المحدد.',
    },
  ],
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  showTestimonialsSection: true,
  showProofCards: true,
  skipQualificationForm: false,
  calendlyUrl: CALENDLY_EMBED_URL,
  unqualifiedMessage: DEFAULT_UNQUALIFIED_MESSAGE,
  unqualifiedRedirectTarget: '',
  proofCards: PROOF_CARDS,
  testimonials: TESTIMONIAL_SCREENSHOTS,
  pageContent: DEFAULT_PAGE_CONTENT,
}

export interface FormFieldOption {
  id: string
  text: string
  qualified: boolean // true = مؤهل (يفتح التقويم), false = غير مؤهل (يتحول للصفحة البديلة)
}

export const DEFAULT_MAIN_FUNNEL_FORM = {
  id: 'frm_funnel_main',
  slug: 'funnel-qualification',
  title: 'احجز مكالمتك الاستراتيجية (30 دقيقة)',
  description: 'خطوة سريعة واحدة ليظهر لك تقويم المواعيد مباشرة.',
  isMainFunnel: true,
  disqualifyOption: 'أقل من $2,700',
  fields: [
    {
      id: 'fld_phone',
      label: 'رقم الواتساب',
      type: 'tel' as const,
      placeholder: '',
      required: true,
    },
    {
      id: 'fld_budget',
      label: 'ما هي ميزانيتك التسويقية الشهرية المخصصة لبناء براندك الشخصي؟',
      type: 'select' as const,
      required: true,
      options: [
        'أقل من $2,700',
        'من $2,700 إلى $5,000',
        'من $5,000 إلى $10,000',
        'أكتر من $10,000',
      ],
      optionItems: [
        { id: 'opt_1', text: 'أقل من $2,700', qualified: false },
        { id: 'opt_2', text: 'من $2,700 إلى $5,000', qualified: true },
        { id: 'opt_3', text: 'من $5,000 إلى $10,000', qualified: true },
        { id: 'opt_4', text: 'أكتر من $10,000', qualified: true },
      ],
    },
  ],
  buttonText: 'عرض المواعيد المتاحة في Calendly ←',
  successMessage: 'اختر اليوم والساعة المناسبة لك من التقويم بالأسفل.',
  views: 0,
  submissionsCount: 0,
  createdAt: '2026-11-03T00:00:00.000Z',
}
