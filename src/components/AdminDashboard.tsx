'use client'

import React, { useState, useEffect, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Users,
  Download,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Plus,
  MessageCircle,
  AlertCircle,
  FolderOpen,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Settings,
  LayoutTemplate,
  Search,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  CheckCircle2,
  XCircle,
  BarChart3,
  Globe,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  TrendingUp,
  FileSignature,
  Clapperboard,
  Upload,
} from 'lucide-react'
import '@/modules/audit/theme/tokens.css'
import { apxFontVariables } from '@/modules/audit/theme/fonts'
import AuditsDashboard from '@/modules/audit/components/admin/AuditsDashboard'
import AdminInsightsView from '@/components/admin/AdminInsightsView'
import AdminFormFactoryView from '@/components/admin/AdminFormFactoryView'
import AdminDocumentStudioView, {
  type StudioDocItem,
  type StudioBridgeApi,
} from '@/components/admin/AdminDocumentStudioView'
import type { AdminLocale } from '@/modules/audit/i18n/adminDict'
import {
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PAGE_CONTENT,
  DEFAULT_MAIN_FUNNEL_FORM,
  DEFAULT_UNQUALIFIED_MESSAGE,
  type SiteSettings,
  type PageContent,
  type FormFieldOption,
} from '@/lib/constants'
import type {
  LeadMagnet,
  CapturedLead,
  CustomForm,
  FormSubmission,
  FormField,
} from '@/lib/storage'

interface Props {
  initialAuth: boolean
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

function randomHex(len = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

type AdminSection =
  | 'audits'
  | 'contracts'
  | 'scripts'
  | 'insights'
  | 'leads'
  | 'custom_forms'
  | 'form'
  | 'content'
  | 'magnets'
  | 'settings'

type ContentSubTab =
  | 'sec1_hero'
  | 'sec2_metrics'
  | 'sec3_problem'
  | 'sec4_system'
  | 'sec5_testimonials'
  | 'sec6_fit'
  | 'sec8_faq_booked'

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
}

const MAIN_ADMIN_TEXT = {
  ar: {
    dir: 'rtl' as const,
    fontClass: 'font-ar',
    switchLang: 'English',
    osBadge: 'نظام الإدارة التشغيلي',
    loginSub: 'بوابة الإدارة المركزية',
    loginTitle: 'تسجيل الدخول للنظام',
    loginDesc: 'أدخل كلمة المرور للوصول إلى استوديو فحص الحسابات، الطلبات، وإدارة المحتوى.',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور...',
    loginBtn: 'دخول للوحة التحكم',
    loggingIn: 'جاري الدخول...',
    storageCloud: 'التخزين السحابي متصل',
    storageLocal: 'تخزين محلي مؤقت',
    refreshData: 'تحديث البيانات',
    viewLiveSite: 'معاينة الموقع الحي',
    logout: 'تسجيل الخروج',
    // Sidebar
    navAudits: 'فحص الحسابات',
    navLeads: 'الطلبات والعملاء',
    navCustomForms: 'مصنع النماذج',
    navForm: 'نموذج التأهيل',
    navContent: 'محتوى الموقع',
    navMagnets: 'الملفات المجانية',
    navSettings: 'الإعدادات والتقويم',
    // Leads section
    leadsTitle: 'الطلبات والعملاء المحتملون',
    leadsSub: 'جميع طلبات نموذج التأهيل وتحميلات الملفات المجانية مع الفلترة والتصدير الفوري.',
    exportCsvBtn: 'تصدير الجدول',
    kpiTotalLeads: 'إجمالي الطلبات',
    kpiQualified: 'عملاء مؤهلون',
    kpiUnqualified: 'غير مؤهلين',
    kpiDownloads: 'تحميلات الملفات',
    filterAll: 'الكل',
    filterQualified: 'مؤهل فقط',
    filterUnqualified: 'غير مؤهل فقط',
    filterMagnets: 'تحميلات الملفات',
    searchLeadsPlaceholder: 'ابحث بالرقم، الاسم، البريد، أو الإجابة...',
    emptyLeadsTitle: 'لا توجد طلبات مطابقة حالياً',
    emptyLeadsSub: 'ستظهر هنا جميع طلبات النموذج وتحميلات الملفات فور تسجيلها.',
    colStatus: 'الحالة',
    colPhone: 'رقم التواصل',
    colDetails: 'الإجابات والتفاصيل',
    colDate: 'التاريخ',
    colAction: 'إجراء',
    badgeQualified: 'مؤهل',
    badgeUnqualified: 'غير مؤهل',
    badgeMagnet: 'تحميل ملف',
    whatsappBtn: 'واتساب',
    deleteTitle: 'حذف',
    // Form section
    formTitle: 'إدارة خيارات نموذج التأهيل',
    formSub: 'أضف أو عدّل أو رتّب أسئلة النموذج، وحدد لكل خيار ما إذا كان مؤهلاً أو غير مؤهل.',
    saveFormBtn: 'حفظ إعدادات النموذج',
    savingBtn: 'جاري الحفظ...',
    formHeadersTitle: 'عناوين قسم الحجز والنموذج',
    bookingTitleLabel: 'عنوان قسم الحجز',
    bookingSubLabel: 'الوصف الفرعي تحت العنوان',
    submitBtnLabel: 'نص زر الإرسال والمتابعة',
    questionsTitle: 'أسئلة وخيارات النموذج',
    addQuestionBtn: 'إضافة سؤال جديد',
    fieldTypeTel: 'حقل رقم التواصل مع رمز الدولة',
    fieldTypeSelect: 'سؤال اختيارات مع تحديد التأهيل',
    fieldTypeText: 'حقل إدخال نصي',
    questionLabel: 'عنوان السؤال',
    questionTypeLabel: 'نوع الحقل',
    optSelectType: 'قائمة خيارات (مؤهل أو غير مؤهل)',
    optTelType: 'رقم هاتف مع رمز الدولة',
    optTextType: 'نص قصير',
    optEmailType: 'بريد إلكتروني',
    optTextareaType: 'نص طويل',
    optionsHeader: 'خيارات السؤال (حدد مؤهل لفتح تقويم الحجز أو غير مؤهل للتحويل لصفحة الهدية):',
    qualifiedToggleYes: 'مؤهل (يفتح التقويم)',
    qualifiedToggleNo: 'غير مؤهل (يحوّل للهدية)',
    newOptionPlaceholder: 'اكتب نص الخيار الجديد هنا...',
    addOptionBtn: 'إضافة خيار',
    unqualifiedCardTitle: 'إعدادات تحويل العميل غير المؤهل',
    unqualifiedCardSub: 'تظهر هذه الرسالة للعميل الذي يختار خياراً غير مؤهل ويتم تحويله تلقائياً للصفحة المختارة.',
    unqualifiedMsgLabel: 'الرسالة التي تظهر لغير المؤهل',
    unqualifiedTargetLabel: 'الصفحة التي يتحوّل لها غير المؤهل',
    defaultMagnetOption: 'أول ملف مجاني متاح تلقائياً (الافتراضي)',
    customRedirectPlaceholder: 'أو اكتب رابطاً مخصصاً...',
    // Content section
    contentTitle: 'إدارة محتوى ونصوص الموقع',
    contentSub: 'تحكم كامل في نصوص جميع أقسام الصفحة الرئيسية، الفيديو التقديمي، الشهادات، والأسئلة الشائعة.',
    restoreDefaultBtn: 'استرجاع الافتراضي',
    saveNowBtn: 'حفظ التغييرات فوراً',
    tabHero: '١. المقدمة والفيديو',
    tabMetrics: '٢. الأرقام والشركاء',
    tabProblem: '٣. قسم المشكلة',
    tabSystem: '٤. خطوات العمل والمؤسس',
    tabTestimonials: '٥. النتائج والشهادات',
    tabFit: '٦. معايير الملاءمة',
    tabFaq: '٧. الأسئلة الشائعة وتأكيد الحجز',
    // Magnets section
    magnetsTitle: 'الملفات المجانية والروابط المخصصة',
    magnetsSub: 'ارفع ملفات الهدايا المجانية لجمهورك المستهدف أو اربطها بتحويل العملاء غير المؤهلين.',
    addMagnetTitle: 'إضافة ملف مجاني جديد',
    magnetTitleLabel: 'عنوان الملف',
    magnetDescLabel: 'وصف مختصر للملف',
    sourceUpload: 'رفع ملف من جهازك',
    sourceExternal: 'رابط خارجي مباشر',
    requireLeadLabel: 'طلب بيانات العميل قبل التحميل',
    fieldName: 'الاسم',
    fieldEmail: 'البريد الإلكتروني',
    fieldPhone: 'رقم التواصل',
    uploadMagnetBtn: 'رفع الملف وتوليد الرابط',
    emptyMagnets: 'لا توجد ملفات مرفوعة حالياً',
    copyLink: 'نسخ الرابط',
    copiedLink: 'تم النسخ',
    downloadsCount: 'تحميل',
    // Settings section
    settingsTitle: 'إعدادات الموقع وتقويم الحجز',
    settingsSub: 'تحكم في رابط تقويم الحجز المدمج، طريقة العرض، وإظهار أو إخفاء الأقسام.',
    saveSettingsBtn: 'حفظ الإعدادات',
    calendarUrlLabel: 'رابط تقويم الحجز المدمج في الصفحة الرئيسية',
    calendarModeTitle: 'طريقة عرض تقويم الحجز',
    calendarModeDesc: 'اختر بين عرض نموذج التأهيل أولاً أو فتح تقويم الحجز مباشرة للعميل.',
    calendarModeDirect: 'الوضع الحالي: عرض التقويم مباشرة',
    calendarModeForm: 'الوضع الحالي: نموذج التأهيل ثم التقويم',
    testimonialsVisTitle: 'قسم شهادات العملاء',
    testimonialsVisDesc: 'إظهار أو إخفاء قسم شهادات ورسائل العملاء بالكامل من الصفحة الرئيسية.',
    proofVisTitle: 'بطاقات الأرقام والنتائج',
    proofVisDesc: 'إظهار أو إخفاء بطاقات الأرقام الإحصائية الثلاثة.',
    visibleOnSite: 'ظاهر في الموقع',
    hiddenFromSite: 'مخفي من الموقع',
  },
  en: {
    dir: 'ltr' as const,
    fontClass: 'font-en',
    switchLang: 'العربية',
    osBadge: 'APX Agency OS',
    loginSub: 'Executive Control Center',
    loginTitle: 'Admin Studio Sign In',
    loginDesc: 'Enter your administrator password to access the Audit Studio, Leads, and Website CMS.',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter admin password...',
    loginBtn: 'Sign In to Studio',
    loggingIn: 'Signing in...',
    storageCloud: 'Vercel Blob Cloud Active',
    storageLocal: 'Local Storage Mode',
    refreshData: 'Refresh Data',
    viewLiveSite: 'View Live Website',
    logout: 'Sign Out',
    // Sidebar
    navAudits: 'Account Audits',
    navLeads: 'Captured Leads',
    navCustomForms: 'Form Factory',
    navForm: 'Qualification Form',
    navContent: 'Web Content',
    navMagnets: 'Lead Magnets',
    navSettings: 'Booking & Settings',
    // Leads section
    leadsTitle: 'Captured Leads & Submissions',
    leadsSub: 'All qualification form applications and lead magnet downloads with instant filtering and CSV export.',
    exportCsvBtn: 'Export CSV',
    kpiTotalLeads: 'Total Leads',
    kpiQualified: 'Qualified Prospects',
    kpiUnqualified: 'Unqualified',
    kpiDownloads: 'Magnet Downloads',
    filterAll: 'All Records',
    filterQualified: 'Qualified Only',
    filterUnqualified: 'Unqualified Only',
    filterMagnets: 'Magnet Downloads',
    searchLeadsPlaceholder: 'Search by phone, name, email, or answer...',
    emptyLeadsTitle: 'No matching leads found',
    emptyLeadsSub: 'Form submissions and lead magnet downloads will appear here automatically.',
    colStatus: 'Status',
    colPhone: 'Phone / WhatsApp',
    colDetails: 'Submitted Answers',
    colDate: 'Date',
    colAction: 'Action',
    badgeQualified: 'Qualified',
    badgeUnqualified: 'Unqualified',
    badgeMagnet: 'Magnet Download',
    whatsappBtn: 'WhatsApp',
    deleteTitle: 'Delete',
    // Form section
    formTitle: 'Qualification Form Builder',
    formSub: 'Add, edit, or reorder form questions and mark each option as Qualified or Unqualified.',
    saveFormBtn: 'Save Form Configuration',
    savingBtn: 'Saving...',
    formHeadersTitle: 'Booking Section Headlines',
    bookingTitleLabel: 'Section Headline',
    bookingSubLabel: 'Section Subtitle',
    submitBtnLabel: 'Submit Button Text',
    questionsTitle: 'Qualification Questions & Options',
    addQuestionBtn: 'Add New Question',
    fieldTypeTel: 'Phone / WhatsApp Field (with country code)',
    fieldTypeSelect: 'Multiple Choice Question (with qualification routing)',
    fieldTypeText: 'Text Input Field',
    questionLabel: 'Question Prompt',
    questionTypeLabel: 'Field Type',
    optSelectType: 'Multiple Choice (Qualified / Unqualified)',
    optTelType: 'Phone Number (with country code)',
    optTextType: 'Short Text',
    optEmailType: 'Email Address',
    optTextareaType: 'Long Paragraph',
    optionsHeader: 'Answer Options (Mark Qualified to open Calendar or Unqualified to redirect to gift):',
    qualifiedToggleYes: 'Qualified (Opens Calendar)',
    qualifiedToggleNo: 'Unqualified (Redirects to Gift)',
    newOptionPlaceholder: 'Type new option text here...',
    addOptionBtn: 'Add Option',
    unqualifiedCardTitle: 'Unqualified Prospect Routing',
    unqualifiedCardSub: 'Shown when a prospect selects an unqualified option before redirecting them to a free resource.',
    unqualifiedMsgLabel: 'Unqualified Notice Message',
    unqualifiedTargetLabel: 'Redirect Destination',
    defaultMagnetOption: 'First available Lead Magnet (Default)',
    customRedirectPlaceholder: 'Or enter a custom path / URL...',
    // Content section
    contentTitle: 'Website Content Manager',
    contentSub: 'Full control over homepage copy, VSL video, partner brands, proof cards, and FAQ.',
    restoreDefaultBtn: 'Restore Defaults',
    saveNowBtn: 'Save Changes Now',
    tabHero: '1. Hero & VSL Video',
    tabMetrics: '2. Metrics & Brands',
    tabProblem: '3. Problem Section',
    tabSystem: '4. System Steps & Founder',
    tabTestimonials: '5. Proof & Testimonials',
    tabFit: '6. Fit Criteria',
    tabFaq: '7. FAQ & Booked Page',
    // Magnets section
    magnetsTitle: 'Lead Magnets & Share Links',
    magnetsSub: 'Upload free resources for your audience or link them to unqualified prospect routing.',
    addMagnetTitle: 'Create New Lead Magnet',
    magnetTitleLabel: 'Resource Title',
    magnetDescLabel: 'Short Description',
    sourceUpload: 'Upload File',
    sourceExternal: 'External Link',
    requireLeadLabel: 'Require contact info before download',
    fieldName: 'Full Name',
    fieldEmail: 'Email Address',
    fieldPhone: 'Phone Number',
    uploadMagnetBtn: 'Save & Generate Share Link',
    emptyMagnets: 'No lead magnets uploaded yet',
    copyLink: 'Copy Link',
    copiedLink: 'Copied',
    downloadsCount: 'downloads',
    // Settings section
    settingsTitle: 'Website & Booking Configuration',
    settingsSub: 'Configure the embedded booking calendar URL, qualification flow, and section visibility.',
    saveSettingsBtn: 'Save Configuration',
    calendarUrlLabel: 'Embedded Calendar Booking URL',
    calendarModeTitle: 'Booking Flow Mode',
    calendarModeDesc: 'Choose between showing the qualification form first or opening the calendar directly.',
    calendarModeDirect: 'Current: Direct Calendar',
    calendarModeForm: 'Current: Qualification Form First',
    testimonialsVisTitle: 'Client Testimonials Section',
    testimonialsVisDesc: 'Show or hide the client testimonials section on the homepage.',
    proofVisTitle: 'Key Metric Proof Cards',
    proofVisDesc: 'Show or hide the 3 statistical proof cards on the homepage.',
    visibleOnSite: 'Visible on Website',
    hiddenFromSite: 'Hidden from Website',
  },
}

export default function AdminDashboard({ initialAuth }: Props) {
  const [isAuthed, setIsAuthed] = useState(initialAuth)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Language state: 100% pure Arabic or 100% pure English
  const [adminLang, setAdminLang] = useState<AdminLocale>('ar')
  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? (localStorage.getItem('apx_admin_lang') as AdminLocale | null)
        : null
    if (saved === 'ar' || saved === 'en') {
      setAdminLang(saved)
    }
  }, [])

  const toggleAdminLang = () => {
    const next: AdminLocale = adminLang === 'ar' ? 'en' : 'ar'
    setAdminLang(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('apx_admin_lang', next)
    }
  }

  const ui = MAIN_ADMIN_TEXT[adminLang]
  const isRtl = adminLang === 'ar'

  // Sidebar navigation state (default to 'audits' so Audit Studio is front and center)
  const [activeSection, setActiveSection] = useState<AdminSection>('audits')
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>('sec1_hero')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  // Core data from DB
  const [magnets, setMagnets] = useState<LeadMagnet[]>([])
  const [leads, setLeads] = useState<CapturedLead[]>([])
  const [forms, setForms] = useState<CustomForm[]>([])
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [storageMode, setStorageMode] = useState<'vercel-blob' | 'vercel-tmp' | 'local'>('local')
  const [loadingData, setLoadingData] = useState(false)

  // Toast / Confirmation Banner
  const [toastMsg, setToastMsg] = useState('')
  const [toastError, setToastError] = useState('')

  const showSuccessToast = (msg: string) => {
    setToastError('')
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  const showErrorToast = (msg: string) => {
    setToastMsg('')
    setToastError(msg)
    setTimeout(() => setToastError(''), 5000)
  }

  // ==================== 1) ORDERS / LEADS FILTER & SEARCH ====================
  const [leadStatusFilter, setLeadStatusFilter] = useState<
    'all' | 'qualified' | 'unqualified' | 'magnets'
  >('all')
  const [leadSearchQuery, setLeadSearchQuery] = useState('')

  // ==================== 2) MAIN QUALIFICATION FORM EDITOR ====================
  const [mainForm, setMainForm] = useState<CustomForm>(DEFAULT_MAIN_FUNNEL_FORM)
  const [savingMainForm, setSavingMainForm] = useState(false)
  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({})

  // ==================== 3) PAGE CONTENT & TESTIMONIALS EDITOR ====================
  const [savingSettings, setSavingSettings] = useState(false)
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null)
  const [tClientTag, setTClientTag] = useState('')
  const [tBeforeAfter, setTBeforeAfter] = useState('')
  const [tQuotePreview, setTQuotePreview] = useState('')
  const [tImageUrl, setTImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // ==================== 4) LEAD MAGNETS UPLOAD ====================
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sourceType, setSourceType] = useState<'upload' | 'external'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [requireLead, setRequireLead] = useState(false)
  const [collectName, setCollectName] = useState(true)
  const [collectPhone, setCollectPhone] = useState(true)
  const [collectEmail, setCollectEmail] = useState(true)
  const [buttonText, setButtonText] = useState('تحميل الملف الآن')
  const [submittingMagnet, setSubmittingMagnet] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [insightsData, setInsightsData] = useState<any>(null)
  const [insightsTier, setInsightsTier] = useState<'overall' | 'website' | 'audits'>('overall')
  const [studioDocs, setStudioDocs] = useState<StudioDocItem[]>([])
  const [activeStudioDocId, setActiveStudioDocId] = useState<string | null>(null)
  const studioApiRef = useRef<StudioBridgeApi | null>(null)
  const [globalCmdOpen, setGlobalCmdOpen] = useState(false)
  const [globalCmdQuery, setGlobalCmdQuery] = useState('')
  const [globalShortcutsOpen, setGlobalShortcutsOpen] = useState(false)

  useEffect(() => {
    if (!isAuthed) return
    fetch('/api/studio', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(res => {
        if (res?.store?.docs) {
          try {
            const parsed = JSON.parse(res.store.docs)
            const list: StudioDocItem[] = Object.keys(parsed)
              .map(k => parsed[k])
              .filter(Boolean)
              .map((d): StudioDocItem => ({
                id: String(d.id || ''),
                type: d.type === 'scripts' ? 'scripts' : 'contract',
                name: String(d.name || d.customName || (d.type === 'scripts' ? 'السكربتات' : 'عقد')),
                lang: d.lang === 'en' ? 'en' : 'ar',
                folder: d.folder || null,
                pinned: Boolean(d.pinned),
                updated: Number(d.updated || Date.now()),
              }))
              .sort((a, b) => b.updated - a.updated)
            setStudioDocs(list)
          } catch {}
        }
      })
      .catch(() => {})
  }, [isAuthed])

  const pageContent: PageContent = {
    ...DEFAULT_PAGE_CONTENT,
    ...(siteSettings.pageContent || {}),
    founderInfo: {
      ...DEFAULT_PAGE_CONTENT.founderInfo,
      ...(siteSettings.pageContent?.founderInfo || {}),
    },
  }

  const updatePageContent = (patch: Partial<PageContent>) => {
    setSiteSettings(prev => ({
      ...prev,
      pageContent: {
        ...DEFAULT_PAGE_CONTENT,
        ...(prev.pageContent || {}),
        ...patch,
      },
    }))
  }

  const fetchDashboardData = async () => {
    setLoadingData(true)
    try {
      const [res, insRes] = await Promise.all([
        fetch('/api/admin/magnets', { cache: 'no-store' }),
        fetch('/api/insights', { cache: 'no-store' }).catch(() => null),
      ])
      if (res.status === 401) {
        setIsAuthed(false)
        return
      }
      const data = await res.json()
      if (res.ok) {
        setMagnets(data.magnets || [])
        setLeads(data.leads || [])
        const loadedForms: CustomForm[] = data.forms || []
        setForms(loadedForms)
        const foundMain =
          loadedForms.find(
            f => f.id === 'frm_funnel_main' || f.slug === 'funnel-qualification' || f.isMainFunnel
          ) || DEFAULT_MAIN_FUNNEL_FORM
        setMainForm(foundMain)
        setFormSubmissions(data.formSubmissions || [])
        if (data.siteSettings) {
          setSiteSettings(data.siteSettings)
        }
        if (data.storageMode) setStorageMode(data.storageMode)
      }
      if (insRes && insRes.ok) {
        const insJson = await insRes.json()
        setInsightsData(insJson)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAuthed) {
      fetchDashboardData()
    }
  }, [isAuthed])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthError(
          data.error || (isRtl ? 'كلمة المرور غير صحيحة' : 'Invalid administrator password')
        )
      } else {
        setIsAuthed(true)
        setPassword('')
      }
    } catch {
      setAuthError(isRtl ? 'حدث خطأ في الاتصال' : 'Network connection error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' })
    setIsAuthed(false)
  }

  // ==================== UPLOAD IMAGE HELPER ====================
  const uploadMediaFile = async (file: File): Promise<string | null> => {
    setUploadingImage(true)
    try {
      if (storageMode === 'vercel-blob') {
        const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : ''
        const safePath = `zyad-magnets/media_${Date.now()}_${randomHex(8)}${ext}`
        const blob = await upload(safePath, file, {
          access: 'public',
          handleUploadUrl: '/api/admin/blob-upload',
        })
        return blob.url
      } else {
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: fd,
        })
        const upData = await upRes.json()
        if (upRes.ok && upData.fileUrl) {
          return upData.fileUrl
        }
      }
    } catch (e) {
      console.error(e)
      showErrorToast(isRtl ? 'تعذر رفع الصورة، حاول مرة أخرى.' : 'Failed to upload image.')
    } finally {
      setUploadingImage(false)
    }
    return null
  }

  // ==================== SAVE SITE SETTINGS / PAGE CONTENT ====================
  const saveSiteSettingsToServer = async (
    nextSettings: SiteSettings,
    successText = isRtl
      ? 'تم حفظ التعديلات بنجاح وتطبيقها في الموقع!'
      : 'Changes saved and published to website!'
  ) => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextSettings),
      })
      const data = await res.json()
      if (res.ok && data.siteSettings) {
        setSiteSettings(data.siteSettings)
        showSuccessToast(successText)
      } else {
        showErrorToast(data.error || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Failed to save changes'))
      }
    } catch {
      showErrorToast(isRtl ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleRestoreDefaultPageContent = async () => {
    if (
      !window.confirm(
        isRtl
          ? 'هل أنت متأكد من استرجاع النصوص الافتراضية لجميع أقسام الصفحة؟'
          : 'Restore default website copy for all sections?'
      )
    ) {
      return
    }
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...siteSettings,
          restoreDefaultPageContent: true,
        }),
      })
      const data = await res.json()
      if (res.ok && data.siteSettings) {
        setSiteSettings(data.siteSettings)
        showSuccessToast(
          isRtl ? 'تم استرجاع النصوص الافتراضية للموقع بنجاح!' : 'Default copy restored!'
        )
      }
    } catch {
      showErrorToast(isRtl ? 'تعذر استرجاع الافتراضي' : 'Failed to restore defaults')
    } finally {
      setSavingSettings(false)
    }
  }

  // ==================== MAIN QUALIFICATION FORM HANDLERS ====================
  const getFieldOptionItems = (field: FormField): FormFieldOption[] => {
    if (Array.isArray(field.optionItems) && field.optionItems.length > 0) {
      return field.optionItems
    }
    return (field.options || []).map((txt, idx) => ({
      id: `opt_${idx + 1}`,
      text: txt,
      qualified: !txt.includes('أقل من'),
    }))
  }

  const updateMainFormField = (fieldId: string, patch: Partial<FormField>) => {
    setMainForm(prev => ({
      ...prev,
      fields: prev.fields.map(f => (f.id === fieldId ? { ...f, ...patch } : f)),
    }))
  }

  const handleAddOptionToField = (fieldId: string) => {
    const text = (newOptionInputs[fieldId] || '').trim()
    if (!text) return
    const field = mainForm.fields.find(f => f.id === fieldId)
    if (!field) return
    const currentItems = getFieldOptionItems(field)
    const updatedItems: FormFieldOption[] = [
      ...currentItems,
      {
        id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        text,
        qualified: true,
      },
    ]
    updateMainFormField(fieldId, {
      optionItems: updatedItems,
      options: updatedItems.map(i => i.text),
    })
    setNewOptionInputs(prev => ({ ...prev, [fieldId]: '' }))
  }

  const handleUpdateOptionItem = (
    fieldId: string,
    optId: string,
    patch: Partial<FormFieldOption>
  ) => {
    const field = mainForm.fields.find(f => f.id === fieldId)
    if (!field) return
    const updatedItems = getFieldOptionItems(field).map(item =>
      item.id === optId ? { ...item, ...patch } : item
    )
    updateMainFormField(fieldId, {
      optionItems: updatedItems,
      options: updatedItems.map(i => i.text),
    })
  }

  const handleDeleteOptionItem = (fieldId: string, optId: string) => {
    const field = mainForm.fields.find(f => f.id === fieldId)
    if (!field) return
    const updatedItems = getFieldOptionItems(field).filter(item => item.id !== optId)
    updateMainFormField(fieldId, {
      optionItems: updatedItems,
      options: updatedItems.map(i => i.text),
    })
  }

  const handleMoveOptionItem = (fieldId: string, index: number, direction: -1 | 1) => {
    const field = mainForm.fields.find(f => f.id === fieldId)
    if (!field) return
    const items = [...getFieldOptionItems(field)]
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= items.length) return
    const temp = items[index]
    items[index] = items[targetIdx]
    items[targetIdx] = temp
    updateMainFormField(fieldId, {
      optionItems: items,
      options: items.map(i => i.text),
    })
  }

  const handleAddFieldToMainForm = () => {
    const newField: FormField = {
      id: `fld_${Date.now()}`,
      label: isRtl ? 'سؤال جديد' : 'New Question',
      type: 'select',
      required: true,
      options: isRtl ? ['خيار 1', 'خيار 2'] : ['Option 1', 'Option 2'],
      optionItems: [
        {
          id: `opt_1_${Date.now()}`,
          text: isRtl ? 'خيار 1' : 'Option 1',
          qualified: true,
        },
        {
          id: `opt_2_${Date.now()}`,
          text: isRtl ? 'خيار 2' : 'Option 2',
          qualified: true,
        },
      ],
    }
    setMainForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
  }

  const handleDeleteFieldFromMainForm = (fieldId: string) => {
    if (mainForm.fields.length <= 1) {
      showErrorToast(
        isRtl
          ? 'يجب الإبقاء على حقل واحد على الأقل في النموذج'
          : 'At least one question is required'
      )
      return
    }
    setMainForm(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }))
  }

  const handleMoveFieldInMainForm = (index: number, direction: -1 | 1) => {
    const nextFields = [...mainForm.fields]
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= nextFields.length) return
    const temp = nextFields[index]
    nextFields[index] = nextFields[targetIdx]
    nextFields[targetIdx] = temp
    setMainForm(prev => ({ ...prev, fields: nextFields }))
  }

  const handleSaveMainForm = async () => {
    setSavingMainForm(true)
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mainForm.id || 'frm_funnel_main',
          title: mainForm.title,
          description: mainForm.description,
          buttonText: mainForm.buttonText,
          successMessage: mainForm.successMessage,
          fields: mainForm.fields,
          unqualifiedMessage: siteSettings.unqualifiedMessage,
          unqualifiedRedirectTarget: siteSettings.unqualifiedRedirectTarget,
        }),
      })
      const data = await res.json()
      if (res.ok && data.form) {
        setMainForm(data.form)
        if (data.siteSettings) {
          setSiteSettings(data.siteSettings)
        }
        showSuccessToast(
          isRtl
            ? 'تم حفظ خيارات وإعدادات نموذج التأهيل بنجاح!'
            : 'Qualification form settings saved!'
        )
      } else {
        showErrorToast(data.error || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Failed to save form'))
      }
    } catch {
      showErrorToast(isRtl ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error')
    } finally {
      setSavingMainForm(false)
    }
  }

  // ==================== TESTIMONIALS HANDLERS ====================
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tClientTag.trim() && !tQuotePreview.trim() && !tImageUrl.trim()) return

    const currentList = [...(siteSettings.testimonials || [])]
    if (editingTestimonialId) {
      const idx = currentList.findIndex(t => t.id === editingTestimonialId)
      if (idx !== -1) {
        currentList[idx] = {
          ...currentList[idx],
          clientTag: tClientTag.trim() || 'عميل APX',
          beforeAfter: tBeforeAfter.trim(),
          quotePreview: tQuotePreview.trim(),
          imageUrl: tImageUrl.trim(),
        }
      }
    } else {
      currentList.unshift({
        id: `shot-${Date.now()}`,
        clientTag: tClientTag.trim() || 'عميل APX',
        beforeAfter: tBeforeAfter.trim(),
        quotePreview: tQuotePreview.trim(),
        imageUrl: tImageUrl.trim(),
        visible: true,
      })
    }

    setEditingTestimonialId(null)
    setTClientTag('')
    setTBeforeAfter('')
    setTQuotePreview('')
    setTImageUrl('')

    await saveSiteSettingsToServer(
      { ...siteSettings, testimonials: currentList },
      editingTestimonialId
        ? isRtl
          ? 'تم تحديث الشهادة بنجاح!'
          : 'Testimonial updated!'
        : isRtl
        ? 'تمت إضافة الشهادة الجديدة بنجاح!'
        : 'New testimonial added!'
    )
  }

  const handleToggleTestimonialVisible = async (id: string) => {
    const updated = (siteSettings.testimonials || []).map(t =>
      t.id === id ? { ...t, visible: !t.visible } : t
    )
    await saveSiteSettingsToServer(
      { ...siteSettings, testimonials: updated },
      isRtl ? 'تم تحديث حالة ظهور الشهادة!' : 'Visibility updated!'
    )
  }

  const handleDeleteTestimonial = async (id: string) => {
    const updated = (siteSettings.testimonials || []).filter(t => t.id !== id)
    await saveSiteSettingsToServer(
      { ...siteSettings, testimonials: updated },
      isRtl ? 'تم حذف الشهادة بنجاح!' : 'Testimonial deleted!'
    )
  }

  // ==================== LEAD MAGNET HANDLERS ====================
  const handleCreateMagnet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      showErrorToast(isRtl ? 'يرجى إدخال عنوان الملف' : 'Please enter a resource title')
      return
    }

    setSubmittingMagnet(true)
    setUploadProgress(0)

    try {
      let fileUrl = ''
      let fileName = ''
      let fileSize = 0
      let fileType = 'LINK'
      let isExternal = false

      if (sourceType === 'upload') {
        if (!selectedFile) {
          showErrorToast(isRtl ? 'يرجى اختيار ملف لرفعه' : 'Please select a file to upload')
          setSubmittingMagnet(false)
          return
        }

        if (storageMode === 'vercel-blob') {
          const ext = selectedFile.name.includes('.')
            ? '.' + selectedFile.name.split('.').pop()
            : ''
          const encryptedBlobName = `zyad-magnets/f_${Date.now()}_${randomHex(16)}${ext}`
          const blob = await upload(encryptedBlobName, selectedFile, {
            access: 'public',
            handleUploadUrl: '/api/admin/blob-upload',
            onUploadProgress: progressEvent => {
              setUploadProgress(Math.round(progressEvent.percentage))
            },
          })
          fileUrl = blob.url
          fileName = selectedFile.name
          fileSize = selectedFile.size
          fileType = (selectedFile.name.split('.').pop() || 'FILE').toUpperCase()
        } else {
          const fd = new FormData()
          fd.append('file', selectedFile)
          const uploadRes = await fetch('/api/admin/upload', {
            method: 'POST',
            body: fd,
          })
          const uploadData = await uploadRes.json()
          if (!uploadRes.ok) {
            showErrorToast(uploadData.error || (isRtl ? 'فشل رفع الملف' : 'File upload failed'))
            setSubmittingMagnet(false)
            return
          }
          fileUrl = uploadData.fileUrl
          fileName = uploadData.fileName
          fileSize = uploadData.fileSize
          fileType = uploadData.fileType
        }
      } else {
        if (!externalUrl.trim()) {
          showErrorToast(isRtl ? 'يرجى إدخال الرابط الخارجي' : 'Please enter an external URL')
          setSubmittingMagnet(false)
          return
        }
        fileUrl = externalUrl.trim()
        fileName = title.trim()
        fileSize = 0
        fileType = 'URL'
        isExternal = true
      }

      const res = await fetch('/api/admin/magnets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          fileUrl,
          fileName,
          fileSize,
          fileType,
          isExternal,
          requireLead,
          collectFields: {
            name: collectName,
            phone: collectPhone,
            email: collectEmail,
          },
          buttonText,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        showErrorToast(data.error || (isRtl ? 'حدث خطأ أثناء حفظ البيانات' : 'Failed to save'))
      } else {
        showSuccessToast(
          isRtl ? 'تم رفع الملف وتوليد الرابط بنجاح!' : 'Resource created successfully!'
        )
        setTitle('')
        setDescription('')
        setSelectedFile(null)
        setExternalUrl('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchDashboardData()
      }
    } catch {
      showErrorToast(isRtl ? 'حدث خطأ أثناء الرفع' : 'Upload error occurred')
    } finally {
      setSubmittingMagnet(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteMagnet = async (id: string) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الملف؟' : 'Delete this resource?')) return
    const res = await fetch(`/api/admin/magnets?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setMagnets(prev => prev.filter(m => m.id !== id))
      showSuccessToast(isRtl ? 'تم حذف الملف بنجاح' : 'Resource deleted')
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm(isRtl ? 'هل تريد حذف هذا الطلب؟' : 'Delete this submission?')) return
    const res = await fetch(
      `/api/admin/forms?submissionId=${encodeURIComponent(submissionId)}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      setFormSubmissions(prev => prev.filter(s => s.id !== submissionId))
      showSuccessToast(isRtl ? 'تم حذف الطلب' : 'Submission deleted')
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm(isRtl ? 'هل تريد حذف هذا السجل؟' : 'Delete this record?')) return
    const res = await fetch(`/api/admin/magnets?leadId=${encodeURIComponent(leadId)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setLeads(prev => prev.filter(l => l.id !== leadId))
      showSuccessToast(isRtl ? 'تم حذف السجل' : 'Record deleted')
    }
  }

  const buildMagnetShareUrl = (magnet: LeadMagnet) => {
    if (typeof window === 'undefined') return `/d/${magnet.slug}`
    return `${window.location.origin}/d/${magnet.slug}`
  }

  const handleCopyLink = (magnet: LeadMagnet) => {
    const fullUrl = buildMagnetShareUrl(magnet)
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(magnet.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ==================== UNIFIED ORDERS / LEADS DATA ====================
  interface UnifiedLeadRow {
    id: string
    sourceType: 'submission' | 'magnet'
    sourceTitle: string
    isQualified: boolean | null
    phone: string
    name: string
    email: string
    details: Record<string, string>
    createdAt: string
  }

  const unifiedRows: UnifiedLeadRow[] = [
    ...formSubmissions.map(sub => {
      const ans = sub.answers || {}
      const statusText = String(ans['حالة التأهيل'] || '')
      const isQual =
        typeof sub.qualified === 'boolean'
          ? sub.qualified
          : statusText.startsWith('غير مؤهل')
          ? false
          : true
      const phoneEntry =
        Object.entries(ans).find(
          ([k, v]) =>
            k.includes('واتساب') ||
            k.includes('هاتف') ||
            k.includes('موبايل') ||
            /^\+\d/.test(String(v).trim())
        )?.[1] || ''
      const nameEntry =
        Object.entries(ans).find(([k]) => k.includes('اسم') || k.includes('الاسم'))?.[1] || ''
      const emailEntry =
        Object.entries(ans).find(([k]) => k.includes('بريد') || k.includes('إيميل'))?.[1] || ''

      return {
        id: sub.id,
        sourceType: 'submission' as const,
        sourceTitle: sub.formTitle || (isRtl ? 'نموذج التأهيل' : 'Qualification Form'),
        isQualified: isQual,
        phone: phoneEntry,
        name: nameEntry,
        email: emailEntry,
        details: ans,
        createdAt: sub.createdAt,
      }
    }),
    ...leads.map(l => ({
      id: l.id,
      sourceType: 'magnet' as const,
      sourceTitle: l.magnetTitle,
      isQualified: null,
      phone: l.phone || '',
      name: l.name || '',
      email: l.email || '',
      details: {
        [isRtl ? 'الملف' : 'File']: l.magnetTitle,
        ...(l.name && l.name !== '—' ? { [isRtl ? 'الاسم' : 'Name']: l.name } : {}),
        ...(l.email && l.email !== '—' ? { [isRtl ? 'البريد' : 'Email']: l.email } : {}),
      },
      createdAt: l.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filteredUnifiedRows = unifiedRows.filter(row => {
    if (leadStatusFilter === 'qualified' && row.isQualified !== true) return false
    if (leadStatusFilter === 'unqualified' && row.isQualified !== false) return false
    if (leadStatusFilter === 'magnets' && row.sourceType !== 'magnet') return false

    if (leadSearchQuery.trim()) {
      const q = leadSearchQuery.trim().toLowerCase()
      const hay = [
        row.name,
        row.phone,
        row.email,
        row.sourceTitle,
        ...Object.values(row.details),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    }
    return true
  })

  const handleExportFilteredCSV = () => {
    const headers = isRtl
      ? ['الحالة', 'المصدر', 'رقم التواصل', 'الاسم', 'البريد', 'التفاصيل والإجابات', 'التاريخ']
      : ['Status', 'Source', 'Phone', 'Name', 'Email', 'Details', 'Date']
    const rows = filteredUnifiedRows.map(r => {
      const statusLabel =
        r.isQualified === true
          ? ui.badgeQualified
          : r.isQualified === false
          ? ui.badgeUnqualified
          : ui.badgeMagnet
      const detailsStr = Object.entries(r.details)
        .filter(([k]) => k !== 'حالة التأهيل')
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ')
      return [
        `"${statusLabel}"`,
        `"${(r.sourceTitle || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${detailsStr.replace(/"/g, '""')}"`,
        `"${new Date(r.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}"`,
      ]
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `apx-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ===================== GLOBAL ADMIN SHORTCUTS HOOK =====================
  useEffect(() => {
    if (!isAuthed) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setGlobalCmdOpen(prev => !prev)
        setGlobalCmdQuery('')
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (activeSection === 'contracts' || activeSection === 'scripts') {
          return // Handled natively by AdminDocumentStudioView
        }
        e.preventDefault()
        if (activeSection === 'form') {
          handleSaveMainForm()
        } else if (activeSection === 'content' || activeSection === 'settings') {
          saveSiteSettingsToServer(siteSettings)
        } else {
          showSuccessToast(
            isRtl ? 'تمت مزامنة وحفظ البيانات بنجاح!' : 'All changes synced and saved!'
          )
        }
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        if (activeSection === 'contracts' || activeSection === 'scripts') {
          return
        }
        e.preventDefault()
        window.print()
        return
      }

      if (!inEditable && e.key === '?') {
        e.preventDefault()
        setGlobalShortcutsOpen(prev => !prev)
        return
      }

      if (!inEditable && e.key === '/') {
        if (activeSection === 'contracts' || activeSection === 'scripts') {
          return
        }
        e.preventDefault()
        setGlobalCmdOpen(true)
        setGlobalCmdQuery('')
        return
      }

      if (e.key === 'Escape') {
        setGlobalCmdOpen(false)
        setGlobalShortcutsOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // ===================== LOGIN VIEW =====================
  if (!isAuthed) {
    return (
      <div
        dir={ui.dir}
        className={`apx-audit apx-admin-root ${apxFontVariables} ${ui.fontClass} min-h-screen flex items-center justify-center px-6 py-12 text-[#E2D9F3]`}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="apx-bento-card w-full max-w-md p-8 md:p-10 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <img
                src="/logo/logo-white.png"
                alt="APX"
                className="h-7 w-auto object-contain mb-1.5"
              />
              <p className="text-xs text-[#A78BFA] font-bold">{ui.loginSub}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAdminLang}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#140D22] border border-[#8B5CF6]/30 text-xs font-bold text-white"
              >
                <Globe className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>{ui.switchLang}</span>
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA]">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{ui.loginTitle}</h1>
            <p className="text-sm text-[#E2D9F3]/65 leading-relaxed">{ui.loginDesc}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                {ui.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={ui.passwordPlaceholder}
                required
                className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/35 px-4 py-3.5 text-white placeholder-[#E2D9F3]/30 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-bold py-4 px-6 transition-all shadow-lg shadow-[#8B5CF6]/25 disabled:opacity-50"
            >
              {authLoading ? ui.loggingIn : ui.loginBtn}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  const contractsCount = studioDocs.filter(d => d.type === 'contract').length
  const scriptsCount = studioDocs.filter(d => d.type === 'scripts').length
  const customFormsCount = forms.filter(
    f => f.id !== 'frm_funnel_main' && f.slug !== 'funnel-qualification' && !f.isMainFunnel
  ).length

  const sidebarItems: Array<{
    id: AdminSection
    label: string
    badge?: number
    icon: React.ReactNode
  }> = [
    {
      id: 'audits',
      label: ui.navAudits,
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'contracts',
      label: isRtl ? 'العقود' : 'Contracts',
      badge: contractsCount || undefined,
      icon: <FileSignature className="w-4 h-4" />,
    },
    {
      id: 'scripts',
      label: isRtl ? 'السكربتات' : 'Scripts',
      badge: scriptsCount || undefined,
      icon: <Clapperboard className="w-4 h-4" />,
    },
    {
      id: 'insights',
      label: isRtl ? 'إحصائيات' : 'Insights',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'leads',
      label: ui.navLeads,
      badge: unifiedRows.length,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'custom_forms',
      label: ui.navCustomForms,
      badge: customFormsCount || undefined,
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'form',
      label: ui.navForm,
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'content',
      label: ui.navContent,
      icon: <LayoutTemplate className="w-4 h-4" />,
    },
    {
      id: 'magnets',
      label: ui.navMagnets,
      badge: magnets.length,
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: ui.navSettings,
      icon: <Settings className="w-4 h-4" />,
    },
  ]

  return (
    <div
      dir="rtl"
      className={`apx-audit apx-admin-root relative ${apxFontVariables} ${ui.fontClass} min-h-screen text-[#E2D9F3] flex flex-col lg:block`}
    >
      {/* ==================== COLLAPSIBLE FIXED FULL-HEIGHT SIDEBAR NAVIGATION ==================== */}
      <aside
        className={`relative lg:fixed lg:top-0 lg:bottom-0 lg:right-0 lg:h-screen z-40 bg-[#0D0914]/98 backdrop-blur-2xl border-b lg:border-b-0 lg:border-l border-[#8B5CF6]/20 flex flex-col justify-between transition-all duration-300 ease-out ${
          sidebarOpen
            ? 'lg:w-72 p-5 lg:p-6'
            : 'lg:w-[76px] p-3 lg:py-6 lg:px-3'
        }`}
      >
        {/* Dedicated Edge Tab to Open / Close Sidebar on Desktop */}
        <button
          type="button"
          onClick={() => setSidebarOpen(prev => !prev)}
          title={sidebarOpen ? (isRtl ? 'طي القائمة الجانبية' : 'Collapse sidebar') : (isRtl ? 'فتح القائمة الجانبية' : 'Expand sidebar')}
          className="hidden lg:flex items-center justify-center w-7 h-12 rounded-l-xl bg-[#160E26] hover:bg-[#8B5CF6] border border-r-0 border-[#8B5CF6]/40 text-[#E2D9F3] hover:text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all absolute -left-7 top-7 z-50"
        >
          {sidebarOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        <div className="space-y-6 flex-1 overflow-y-auto pr-0.5" dir={ui.dir}>
          {/* Brand Logo (refreshes Admin Panel on click) + Language Switcher */}
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} gap-2`}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              title={isRtl ? 'تحديث لوحة التحكم' : 'Refresh Admin Panel'}
              className="flex items-center gap-2.5 select-none hover:scale-105 active:scale-95 transition-transform"
            >
              <img
                src="/logo/logo-white.png"
                alt="APX"
                className={`${sidebarOpen ? 'h-6' : 'h-5'} w-auto object-contain transition-all duration-200 drop-shadow-[0_0_16px_rgba(139,92,246,0.65)]`}
              />
            </button>

            {sidebarOpen && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleAdminLang}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/35 text-xs font-bold text-white transition-all apx-btn-glow"
                >
                  <Globe className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>{ui.switchLang}</span>
                </button>

                <button
                  type="button"
                  onClick={fetchDashboardData}
                  title={ui.refreshData}
                  className="p-2 rounded-xl bg-[#140D22] border border-[#8B5CF6]/25 text-[#E2D9F3]/75 hover:text-white transition-all"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-[#A78BFA]' : ''}`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Collapsed quick language switcher */}
          {!sidebarOpen && (
            <div className="hidden lg:flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={toggleAdminLang}
                title={ui.switchLang}
                className="p-2 rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/35 text-xs font-bold text-white transition-all"
              >
                <Globe className="w-4 h-4 text-[#A78BFA]" />
              </button>
            </div>
          )}

          {/* Cloud Storage Status Pill + Global Command Bar Trigger */}
          {sidebarOpen && (
            <div className="hidden lg:flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#120B1E]/90 border border-[#8B5CF6]/20 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    storageMode === 'vercel-blob' ? 'bg-[#4BA37A] animate-pulse' : 'bg-[#FBBF24]'
                  }`}
                />
                <span className="font-semibold text-[#E2D9F3]/80">
                  {storageMode === 'vercel-blob' ? ui.storageCloud : ui.storageLocal}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setGlobalCmdOpen(true)
                    setGlobalCmdQuery('')
                  }}
                  className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#090510] hover:bg-[#160F26] border border-[#8B5CF6]/30 text-xs text-[#E2D9F3]/75 hover:text-white transition-all"
                >
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <Search className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>{isRtl ? 'لوحة الأوامر' : 'Command Bar'}</span>
                  </span>
                  <kbd className="font-en text-[10px] px-1.5 py-0.5 rounded bg-[#1B132E] border border-[#8B5CF6]/30 text-[#C4B5FD]">
                    Ctrl+K
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalShortcutsOpen(true)}
                  title={isRtl ? 'اختصارات لوحة المفاتيح (?)' : 'Keyboard Shortcuts (?)'}
                  className="px-2.5 py-2 rounded-xl bg-[#090510] hover:bg-[#160F26] border border-[#8B5CF6]/30 text-xs font-en font-bold text-[#C4B5FD] hover:text-white transition-all"
                >
                  ?
                </button>
              </div>
            </div>
          )}

          {/* Navigation Menu with Spring Active Pill + Native Contracts/Scripts Sub-Controls */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {sidebarItems.map(item => {
              const active = activeSection === item.id
              const isStudioTab = item.id === 'contracts' || item.id === 'scripts'
              const studioDocType: 'contract' | 'scripts' =
                item.id === 'contracts' ? 'contract' : 'scripts'
              const recentForTab = isStudioTab
                ? studioDocs.filter(d => d.type === studioDocType).slice(0, 6)
                : []

              return (
                <React.Fragment key={item.id}>
                  <button
                    type="button"
                    title={!sidebarOpen ? item.label : undefined}
                    onClick={() => {
                      setActiveSection(item.id)
                      if (item.id === 'contracts') {
                        studioApiRef.current?.setFilter('contract')
                      } else if (item.id === 'scripts') {
                        studioApiRef.current?.setFilter('scripts')
                      }
                    }}
                    className={`relative flex items-center ${
                      sidebarOpen ? 'justify-between px-4 py-3' : 'justify-center p-3'
                    } gap-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                      active ? 'text-white' : 'text-[#E2D9F3]/70 hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="mainAdminSidebarActive"
                        transition={SPRING_TRANSITION}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] shadow-lg shadow-[#8B5CF6]/30"
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      {item.icon}
                      {sidebarOpen && <span>{item.label}</span>}
                    </div>
                    {sidebarOpen && typeof item.badge === 'number' && (
                      <span
                        className={`relative z-10 text-xs px-2 py-0.5 rounded-lg font-en font-bold ${
                          active
                            ? 'bg-[#080608]/35 text-white'
                            : 'bg-[#8B5CF6]/15 text-[#A78BFA]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Native Sidebar Controls for Contracts / Scripts (No Nested Sidebar inside the Page!) */}
                  {active && isStudioTab && sidebarOpen && (
                    <div className="hidden lg:flex flex-col gap-2 px-2.5 py-2.5 mx-1 rounded-2xl bg-[#120B1E]/95 border border-[#8B5CF6]/25">
                      <button
                        type="button"
                        onClick={() => studioApiRef.current?.newDoc(studioDocType)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {item.id === 'contracts'
                            ? isRtl
                              ? 'عقد جديد'
                              : 'New Contract'
                            : isRtl
                            ? 'سكربت جديد'
                            : 'New Script'}
                        </span>
                      </button>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => studioApiRef.current?.openSig()}
                          title={isRtl ? 'الإمضاء المشفر' : 'Encrypted Signature'}
                          className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-[#090510] hover:bg-[#1A102E] border border-[#8B5CF6]/25 text-[10px] font-bold text-[#E2D9F3]/85 hover:text-white transition-all"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-[#A78BFA]" />
                          <span>{isRtl ? 'الإمضاء' : 'Signature'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => studioApiRef.current?.importTrigger()}
                          title={isRtl ? 'رفع ملف .apx.json' : 'Upload .apx.json'}
                          className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-[#090510] hover:bg-[#1A102E] border border-[#8B5CF6]/25 text-[10px] font-bold text-[#E2D9F3]/85 hover:text-white transition-all"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#A78BFA]" />
                          <span>{isRtl ? 'رفع ملف' : 'Upload'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => studioApiRef.current?.openCmd()}
                          title="Ctrl + K"
                          className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-[#090510] hover:bg-[#1A102E] border border-[#8B5CF6]/25 text-[10px] font-bold text-[#E2D9F3]/85 hover:text-white transition-all"
                        >
                          <Search className="w-3.5 h-3.5 text-[#A78BFA]" />
                          <span>{isRtl ? 'بحث' : 'Search'}</span>
                        </button>
                      </div>

                      {recentForTab.length > 0 && (
                        <div className="pt-1.5 border-t border-[#8B5CF6]/15 space-y-1">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold text-[#A78BFA]/80">
                              {item.id === 'contracts'
                                ? isRtl
                                  ? 'أحدث العقود'
                                  : 'Recent Contracts'
                                : isRtl
                                ? 'أحدث السكربتات'
                                : 'Recent Scripts'}
                            </span>
                            <button
                              type="button"
                              onClick={() => studioApiRef.current?.setFilter(studioDocType)}
                              className="text-[10px] font-bold text-[#E2D9F3]/60 hover:text-white"
                            >
                              {isRtl ? 'الكل' : 'All'}
                            </button>
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">
                            {recentForTab.map(doc => {
                              const isCurrent = activeStudioDocId === doc.id
                              return (
                                <button
                                  key={doc.id}
                                  type="button"
                                  onClick={() => studioApiRef.current?.open(doc.id)}
                                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-start text-[11px] font-medium transition-all ${
                                    isCurrent
                                      ? 'bg-[#8B5CF6]/25 border border-[#8B5CF6]/50 text-white font-bold'
                                      : 'bg-[#090510]/70 hover:bg-[#1A102E] text-[#E2D9F3]/80 hover:text-white'
                                  }`}
                                >
                                  <span className="truncate">{doc.name}</span>
                                  <span className="text-[9px] font-en uppercase px-1.5 py-0.5 rounded bg-[#8B5CF6]/15 text-[#A78BFA] shrink-0">
                                    {doc.lang}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="hidden lg:flex flex-col gap-2 pt-6 border-t border-[#8B5CF6]/15" dir={ui.dir}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={!sidebarOpen ? ui.viewLiveSite : undefined}
            className={`flex items-center justify-center gap-2 ${
              sidebarOpen ? 'px-4 py-2.5' : 'p-2.5'
            } rounded-xl bg-[#140D22] hover:bg-[#1E1333] border border-[#8B5CF6]/25 text-xs font-bold text-[#E2D9F3] hover:text-white transition-colors`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#A78BFA]" />
            {sidebarOpen && <span>{ui.viewLiveSite}</span>}
          </a>
          <button
            type="button"
            onClick={handleLogout}
            title={!sidebarOpen ? ui.logout : undefined}
            className={`flex items-center justify-center gap-2 ${
              sidebarOpen ? 'px-4 py-2.5' : 'p-2.5'
            } rounded-xl bg-[#C95D63]/10 border border-[#C95D63]/30 text-xs font-bold text-[#F87171] hover:bg-[#C95D63]/20 transition-colors`}
          >
            <LogOut className="w-3.5 h-3.5" />
            {sidebarOpen && <span>{ui.logout}</span>}
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div
        className={`min-h-screen transition-all duration-300 ease-out ${
          sidebarOpen ? 'lg:mr-72' : 'lg:mr-[76px]'
        }`}
      >
      <main
        dir={ui.dir}
        className={`relative z-10 min-w-0 p-4 sm:p-6 lg:p-8 ${
          activeSection === 'audits' ||
          activeSection === 'insights' ||
          activeSection === 'contracts' ||
          activeSection === 'scripts'
            ? 'max-w-[1600px]'
            : 'max-w-6xl'
        } w-full mx-auto space-y-6`}
      >
        {/* Global Confirmation / Error Banner */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="sticky top-4 z-50 rounded-2xl bg-[#4BA37A]/20 border border-[#4BA37A]/45 backdrop-blur-xl px-5 py-3.5 text-sm font-bold text-white flex items-center gap-3 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5 text-[#4BA37A] flex-shrink-0" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
          {toastError && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="sticky top-4 z-50 rounded-2xl bg-[#C95D63]/20 border border-[#C95D63]/45 backdrop-blur-xl px-5 py-3.5 text-sm font-bold text-white flex items-center gap-3 shadow-lg"
            >
              <AlertCircle className="w-5 h-5 text-[#F87171] flex-shrink-0" />
              <span>{toastError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =====================================================================
            SECTION: APX AUDIT ENGINE (INTEGRATED INSIDE MAIN ADMIN)
           ===================================================================== */}
        {activeSection === 'audits' && (
          <motion.div
            key="sec-audits"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AuditsDashboard
              embedded={true}
              adminLang={adminLang}
              onToggleLang={toggleAdminLang}
            />
          </motion.div>
        )}

        {/* =====================================================================
            SECTION: APX DOCUMENT STUDIO (CONTRACTS & CONTENT SCRIPTS)
           ===================================================================== */}
        {(activeSection === 'contracts' || activeSection === 'scripts') && (
          <motion.div
            key="sec-studio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AdminDocumentStudioView
              adminLang={adminLang}
              mode={activeSection === 'contracts' ? 'contract' : 'scripts'}
              onRegisterApi={api => {
                studioApiRef.current = api
              }}
              onDocsSync={(docs, currentId) => {
                setStudioDocs(docs)
                setActiveStudioDocId(currentId)
              }}
            />
          </motion.div>
        )}

        {/* =====================================================================
            SECTION: 3-TIER GLOBAL & FUNNEL INSIGHTS DASHBOARD
           ===================================================================== */}
        {activeSection === 'insights' && (
          <motion.div
            key="sec-insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AdminInsightsView
              insightsData={insightsData}
              loading={loadingData}
              adminLang={adminLang}
              onRefresh={fetchDashboardData}
            />
          </motion.div>
        )}

        {/* =====================================================================
            SECTION 1: CAPTURED LEADS
        ===================================================================== */}
        {activeSection === 'leads' && (
          <motion.div
            key="sec-leads"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="apx-bento-card p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{ui.leadsTitle}</h1>
                <p className="text-xs sm:text-sm text-[#E2D9F3]/65 mt-1">{ui.leadsSub}</p>
              </div>

              {filteredUnifiedRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportFilteredCSV}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-xs sm:text-sm px-5 py-3 shadow-lg shadow-[#8B5CF6]/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {ui.exportCsvBtn} ({filteredUnifiedRows.length})
                  </span>
                </button>
              )}
            </div>

            {/* Quick Summary Bento Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="apx-bento-card p-5">
                <p className="text-xs text-[#E2D9F3]/60 font-bold">{ui.kpiTotalLeads}</p>
                <p className="apx-serif-numeral font-bold text-3xl text-white mt-1.5">
                  {unifiedRows.length}
                </p>
              </div>
              <div className="apx-bento-card p-5 border-[#4BA37A]/35">
                <p className="text-xs text-[#4BA37A] font-bold">{ui.kpiQualified}</p>
                <p className="apx-serif-numeral font-bold text-3xl text-[#4BA37A] mt-1.5">
                  {unifiedRows.filter(r => r.isQualified === true).length}
                </p>
              </div>
              <div className="apx-bento-card p-5 border-[#D49A3D]/35">
                <p className="text-xs text-[#FBBF24] font-bold">{ui.kpiUnqualified}</p>
                <p className="apx-serif-numeral font-bold text-3xl text-[#FBBF24] mt-1.5">
                  {unifiedRows.filter(r => r.isQualified === false).length}
                </p>
              </div>
              <div className="apx-bento-card p-5">
                <p className="text-xs text-[#A78BFA] font-bold">{ui.kpiDownloads}</p>
                <p className="apx-serif-numeral font-bold text-3xl text-[#A78BFA] mt-1.5">
                  {leads.length}
                </p>
              </div>
            </div>

            {/* Filter Pills + Search Box */}
            <div className="apx-bento-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: ui.filterAll },
                  { id: 'qualified', label: ui.filterQualified },
                  { id: 'unqualified', label: ui.filterUnqualified },
                  { id: 'magnets', label: ui.filterMagnets },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLeadStatusFilter(tab.id as typeof leadStatusFilter)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      leadStatusFilter === tab.id
                        ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
                        : 'bg-[#080608]/70 text-[#E2D9F3]/70 hover:text-white border border-[#8B5CF6]/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#E2D9F3]/40 absolute end-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={leadSearchQuery}
                  onChange={e => setLeadSearchQuery(e.target.value)}
                  placeholder={ui.searchLeadsPlaceholder}
                  className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 pe-10 ps-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#E2D9F3]/40 focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="apx-bento-card overflow-hidden">
              {filteredUnifiedRows.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Users className="w-10 h-10 text-[#8B5CF6]/50 mx-auto" />
                  <p className="text-base font-bold text-white">{ui.emptyLeadsTitle}</p>
                  <p className="text-xs text-[#E2D9F3]/60">{ui.emptyLeadsSub}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="border-b border-[#8B5CF6]/20 bg-[#120B1E] text-xs text-[#A78BFA]">
                        <th className="py-4 px-4 text-start">{ui.colStatus}</th>
                        <th className="py-4 px-4 text-start">{ui.colPhone}</th>
                        <th className="py-4 px-4 text-start">{ui.colDetails}</th>
                        <th className="py-4 px-4 text-start">{ui.colDate}</th>
                        <th className="py-4 px-4 text-start">{ui.colAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8B5CF6]/15 text-xs sm:text-sm">
                      {filteredUnifiedRows.map(row => {
                        const cleanPhone = (row.phone || '').replace(/[^\d+]/g, '')
                        return (
                          <tr key={row.id} className="hover:bg-[#8B5CF6]/5 transition-colors">
                            <td className="py-4 px-4 whitespace-nowrap">
                              {row.isQualified === true ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4BA37A]/20 border border-[#4BA37A]/40 text-[#4BA37A] text-xs font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{ui.badgeQualified}</span>
                                </span>
                              ) : row.isQualified === false ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C95D63]/15 border border-[#C95D63]/35 text-[#F87171] text-xs font-bold">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>{ui.badgeUnqualified}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#E2D9F3] text-xs font-bold">
                                  <Download className="w-3.5 h-3.5" />
                                  <span>{ui.badgeMagnet}</span>
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 font-en whitespace-nowrap" dir="ltr">
                              {row.phone ? (
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-white font-bold">{row.phone}</span>
                                  {cleanPhone.length >= 7 && (
                                    <a
                                      href={`https://wa.me/${cleanPhone.replace(/^\+/, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/20 text-[#25D366] text-[11px] font-bold hover:bg-[#25D366] hover:text-[#080608] transition-colors"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>{ui.whatsappBtn}</span>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[#E2D9F3]/40">—</span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(row.details)
                                  .filter(([k]) => k !== 'حالة التأهيل')
                                  .map(([k, v]) => (
                                    <div
                                      key={k}
                                      className="rounded-xl bg-[#080608]/80 border border-[#8B5CF6]/20 px-3 py-1.5 text-xs"
                                    >
                                      <span className="text-[#E2D9F3]/55 me-1">{k}:</span>
                                      <span className="text-white font-bold">{v}</span>
                                    </div>
                                  ))}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-xs text-[#E2D9F3]/60 whitespace-nowrap font-en">
                              {new Date(row.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  row.sourceType === 'submission'
                                    ? handleDeleteSubmission(row.id)
                                    : handleDeleteLead(row.id)
                                }
                                className="p-2 rounded-xl text-[#F87171] hover:bg-[#C95D63]/20 transition-colors"
                                title={ui.deleteTitle}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* =====================================================================
            SECTION: CUSTOM SHAREABLE FORM FACTORY (HIRING, ONBOARDING, CUSTOM)
        ===================================================================== */}
        {activeSection === 'custom_forms' && (
          <motion.div
            key="sec-custom-forms"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AdminFormFactoryView
              adminLang={adminLang}
              forms={forms}
              submissions={formSubmissions}
              onRefresh={fetchDashboardData}
              showSuccessToast={showSuccessToast}
              showErrorToast={showErrorToast}
            />
          </motion.div>
        )}

        {/* =====================================================================
            SECTION 2: QUALIFICATION FORM BUILDER
        ===================================================================== */}
        {activeSection === 'form' && (
          <motion.div
            key="sec-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="apx-bento-card p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{ui.formTitle}</h1>
                <p className="text-xs sm:text-sm text-[#E2D9F3]/65 mt-1">{ui.formSub}</p>
              </div>

              <button
                type="button"
                disabled={savingMainForm}
                onClick={handleSaveMainForm}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-xs sm:text-sm px-6 py-3.5 shadow-lg shadow-[#8B5CF6]/25 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingMainForm ? ui.savingBtn : ui.saveFormBtn}</span>
              </button>
            </div>

            {/* Direct Calendly Booking vs Qualification Questions Mode Toggle */}
            <div className="apx-bento-card p-6 border border-[#8B5CF6]/40 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] text-[11px] font-bold">
                  {isRtl ? 'وضع حجز المكالمة (Booking Mode)' : 'Call Booking Mode'}
                </span>
                <h2 className="text-base font-bold text-white">
                  {isRtl
                    ? 'حجز مكالمة مباشرة عبر Calendly بدون أسئلة التأهيل (تخطي الأسئلة)'
                    : 'Direct Calendly Booking Without Qualification Questions'}
                </h2>
                <p className="text-xs text-[#E2D9F3]/65">
                  {isRtl
                    ? 'عند التفعيل، سيظهر تقويم Calendly مباشرة للعميل في قسم الحجز بدون المرور بأسئلة الفلترة.'
                    : 'When enabled, visitors see the embedded Calendly calendar immediately without answering qualification questions.'}
                </p>
              </div>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => {
                  const next = {
                    ...siteSettings,
                    skipQualificationForm: !siteSettings.skipQualificationForm,
                  }
                  setSiteSettings(next)
                  saveSiteSettingsToServer(next)
                }}
                className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  siteSettings.skipQualificationForm
                    ? 'bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981]'
                    : 'bg-[#140D22] border border-[#8B5CF6]/35 text-white hover:border-[#8B5CF6]'
                }`}
              >
                {siteSettings.skipQualificationForm ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isRtl
                        ? 'مُفعّل: حجز مباشر بدون أسئلة (اضغط لإعادة الأسئلة)'
                        : 'Active: Direct Booking (Click to Enable Questions)'}
                    </span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-[#A78BFA]" />
                    <span>
                      {isRtl
                        ? 'الوضع الحالي: أسئلة التأهيل مفعّلة (اضغط لتخطي الأسئلة)'
                        : 'Current: Qualification Form Active (Click to Skip Questions)'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Form Header Texts */}
            <div className="apx-bento-card p-6 space-y-5">
              <h2 className="text-base font-bold text-white">{ui.formHeadersTitle}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                    {ui.bookingTitleLabel}
                  </label>
                  <input
                    type="text"
                    value={mainForm.title}
                    onChange={e => setMainForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                    {ui.bookingSubLabel}
                  </label>
                  <input
                    type="text"
                    value={mainForm.description}
                    onChange={e => setMainForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                    {ui.submitBtnLabel}
                  </label>
                  <input
                    type="text"
                    value={mainForm.buttonText}
                    onChange={e => setMainForm(prev => ({ ...prev, buttonText: e.target.value }))}
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>
            </div>

            {/* Fields & Per-Option Qualification Editor */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">{ui.questionsTitle}</h2>
                <button
                  type="button"
                  onClick={handleAddFieldToMainForm}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] text-white text-xs font-bold px-4 py-2.5 border border-[#8B5CF6]/40 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{ui.addQuestionBtn}</span>
                </button>
              </div>

              {mainForm.fields.map((field, fIdx) => {
                const optionItems = getFieldOptionItems(field)
                return (
                  <div key={field.id} className="apx-bento-card p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8B5CF6]/15 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center font-en text-xs font-bold text-white">
                          {fIdx + 1}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {field.type === 'tel'
                            ? ui.fieldTypeTel
                            : field.type === 'select'
                            ? ui.fieldTypeSelect
                            : ui.fieldTypeText}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMoveFieldInMainForm(fIdx, -1)}
                          disabled={fIdx === 0}
                          className="p-2 rounded-lg bg-[#080608] border border-[#8B5CF6]/25 text-[#E2D9F3]/70 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveFieldInMainForm(fIdx, 1)}
                          disabled={fIdx === mainForm.fields.length - 1}
                          className="p-2 rounded-lg bg-[#080608] border border-[#8B5CF6]/25 text-[#E2D9F3]/70 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFieldFromMainForm(field.id)}
                          className="p-2 rounded-lg bg-[#C95D63]/15 border border-[#C95D63]/30 text-[#F87171] hover:bg-[#C95D63]/25"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                          {ui.questionLabel}
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => updateMainFormField(field.id, { label: e.target.value })}
                          className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                          {ui.questionTypeLabel}
                        </label>
                        <select
                          value={field.type}
                          onChange={e =>
                            updateMainFormField(field.id, {
                              type: e.target.value as FormField['type'],
                            })
                          }
                          className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                        >
                          <option value="select">{ui.optSelectType}</option>
                          <option value="tel">{ui.optTelType}</option>
                          <option value="text">{ui.optTextType}</option>
                          <option value="email">{ui.optEmailType}</option>
                          <option value="textarea">{ui.optTextareaType}</option>
                        </select>
                      </div>
                    </div>

                    {/* Individual Options Manager for Select Fields */}
                    {field.type === 'select' && (
                      <div className="space-y-4 pt-2">
                        <label className="text-xs font-bold text-[#A78BFA] block">
                          {ui.optionsHeader}
                        </label>

                        <div className="space-y-2.5">
                          {optionItems.map((opt, oIdx) => (
                            <div
                              key={opt.id}
                              className="flex flex-wrap md:flex-nowrap items-center gap-2.5 bg-[#080608]/90 border border-[#8B5CF6]/25 rounded-2xl p-3"
                            >
                              <span className="font-en text-xs text-[#E2D9F3]/50 px-2">
                                #{oIdx + 1}
                              </span>

                              <input
                                type="text"
                                value={opt.text}
                                onChange={e =>
                                  handleUpdateOptionItem(field.id, opt.id, { text: e.target.value })
                                }
                                className="flex-1 min-w-[180px] rounded-xl bg-[#120B1E] border border-[#8B5CF6]/25 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateOptionItem(field.id, opt.id, {
                                    qualified: !opt.qualified,
                                  })
                                }
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                                  opt.qualified
                                    ? 'bg-[#4BA37A]/20 border border-[#4BA37A]/45 text-[#4BA37A]'
                                    : 'bg-[#C95D63]/20 border border-[#C95D63]/45 text-[#F87171]'
                                }`}
                              >
                                {opt.qualified ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{ui.qualifiedToggleYes}</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    <span>{ui.qualifiedToggleNo}</span>
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveOptionItem(field.id, oIdx, -1)}
                                  disabled={oIdx === 0}
                                  className="p-2 rounded-lg bg-[#120B1E] border border-[#8B5CF6]/20 text-[#E2D9F3]/70 hover:text-white disabled:opacity-30"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveOptionItem(field.id, oIdx, 1)}
                                  disabled={oIdx === optionItems.length - 1}
                                  className="p-2 rounded-lg bg-[#120B1E] border border-[#8B5CF6]/20 text-[#E2D9F3]/70 hover:text-white disabled:opacity-30"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOptionItem(field.id, opt.id)}
                                  className="p-2 rounded-lg bg-[#C95D63]/15 border border-[#C95D63]/30 text-[#F87171] hover:bg-[#C95D63]/25"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <input
                            type="text"
                            value={newOptionInputs[field.id] || ''}
                            onChange={e =>
                              setNewOptionInputs(prev => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }))
                            }
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddOptionToField(field.id)
                              }
                            }}
                            placeholder={ui.newOptionPlaceholder}
                            className="flex-1 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-xs sm:text-sm text-white placeholder-[#E2D9F3]/35 focus:outline-none focus:border-[#8B5CF6]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOptionToField(field.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs sm:text-sm px-5 py-3 transition-all whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{ui.addOptionBtn}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Unqualified Redirect & Custom Message Settings */}
            <div className="apx-bento-card p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">{ui.unqualifiedCardTitle}</h2>
                <p className="text-xs text-[#E2D9F3]/65 mt-1">{ui.unqualifiedCardSub}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/85 mb-2">
                    {ui.unqualifiedMsgLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={siteSettings.unqualifiedMessage || DEFAULT_UNQUALIFIED_MESSAGE}
                    onChange={e =>
                      setSiteSettings(prev => ({
                        ...prev,
                        unqualifiedMessage: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6] resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#E2D9F3]/85">
                    {ui.unqualifiedTargetLabel}
                  </label>

                  <select
                    value={
                      magnets.some(m => m.slug === siteSettings.unqualifiedRedirectTarget)
                        ? siteSettings.unqualifiedRedirectTarget
                        : ''
                    }
                    onChange={e =>
                      setSiteSettings(prev => ({
                        ...prev,
                        unqualifiedRedirectTarget: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="">{ui.defaultMagnetOption}</option>
                    {magnets.map(m => (
                      <option key={m.id} value={m.slug}>
                        {m.title} (/d/{m.slug})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    dir="ltr"
                    value={siteSettings.unqualifiedRedirectTarget || ''}
                    onChange={e =>
                      setSiteSettings(prev => ({
                        ...prev,
                        unqualifiedRedirectTarget: e.target.value,
                      }))
                    }
                    placeholder={ui.customRedirectPlaceholder}
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-xs font-en text-white placeholder-[#E2D9F3]/35 focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* =====================================================================
            SECTION 3: WEBSITE CONTENT CMS
        ===================================================================== */}
        {activeSection === 'content' && (
          <motion.div
            key="sec-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="apx-bento-card p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{ui.contentTitle}</h1>
                <p className="text-xs sm:text-sm text-[#E2D9F3]/65 mt-1">{ui.contentSub}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handleRestoreDefaultPageContent}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#080608] border border-[#8B5CF6]/35 hover:border-[#8B5CF6] text-[#E2D9F3] hover:text-white font-bold text-xs sm:text-sm px-5 py-3 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{ui.restoreDefaultBtn}</span>
                </button>

                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() => saveSiteSettingsToServer(siteSettings)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-xs sm:text-sm px-6 py-3 shadow-lg shadow-[#8B5CF6]/25 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? ui.savingBtn : ui.saveNowBtn}</span>
                </button>
              </div>
            </div>

            {/* Section Sub-Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'sec1_hero', label: ui.tabHero },
                { id: 'sec2_metrics', label: ui.tabMetrics },
                { id: 'sec3_problem', label: ui.tabProblem },
                { id: 'sec4_system', label: ui.tabSystem },
                { id: 'sec5_testimonials', label: ui.tabTestimonials },
                { id: 'sec6_fit', label: ui.tabFit },
                { id: 'sec8_faq_booked', label: ui.tabFaq },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setContentSubTab(t.id as ContentSubTab)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    contentSubTab === t.id
                      ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
                      : 'apx-glass text-[#E2D9F3]/70 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* SUB-TAB 1: HERO & VSL */}
            {contentSubTab === 'sec1_hero' && (
              <div className="apx-bento-card p-6 space-y-5">
                <h2 className="text-base font-bold text-white">{ui.tabHero}</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'نص زر الحجز في الهيدر العلوي' : 'Top Header CTA Text'}
                    </label>
                    <input
                      type="text"
                      value={pageContent.headerCtaText}
                      onChange={e => updatePageContent({ headerCtaText: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'الشارة أعلى العنوان الرئيسي' : 'Hero Eyebrow Badge'}
                    </label>
                    <input
                      type="text"
                      value={pageContent.eyebrowText}
                      onChange={e => updatePageContent({ eyebrowText: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'العنوان الرئيسي (الجزء الأول)' : 'Hero Headline (Part 1)'}
                    </label>
                    <input
                      type="text"
                      value={pageContent.heroTitle}
                      onChange={e => updatePageContent({ heroTitle: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'تكملة العنوان الرئيسي (الجزء الملون)' : 'Hero Headline (Highlighted)'}
                    </label>
                    <input
                      type="text"
                      value={pageContent.heroTitleHighlight}
                      onChange={e => updatePageContent({ heroTitleHighlight: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-[#A78BFA] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                    {isRtl ? 'الفقرة التوضيحية تحت العنوان الرئيسي' : 'Hero Subtitle Paragraph'}
                  </label>
                  <textarea
                    rows={2}
                    value={pageContent.heroSubtitle}
                    onChange={e => updatePageContent({ heroSubtitle: e.target.value })}
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-[#8B5CF6]/15">
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'رابط الفيديو التقديمي المباشر' : 'Direct VSL Video URL'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={pageContent.vslVideoUrl}
                      onChange={e => updatePageContent({ vslVideoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-xs font-en text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'صورة غلاف الفيديو التقديمي' : 'VSL Poster Image'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={pageContent.vslPosterUrl}
                        onChange={e => updatePageContent({ vslPosterUrl: e.target.value })}
                        className="flex-1 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3 py-3 text-xs font-en text-white"
                      />
                      <label className="cursor-pointer rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] text-white text-xs font-bold px-4 py-3 border border-[#8B5CF6]/40 whitespace-nowrap">
                        <span>
                          {uploadingImage
                            ? isRtl
                              ? 'جاري الرفع...'
                              : 'Uploading...'
                            : isRtl
                            ? 'رفع صورة'
                            : 'Upload'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async e => {
                            const f = e.target.files?.[0]
                            if (f) {
                              const url = await uploadMediaFile(f)
                              if (url) updatePageContent({ vslPosterUrl: url })
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'النص المكتوب داخل صندوق الفيديو' : 'Video Box Caption'}
                    </label>
                    <input
                      type="text"
                      value={pageContent.vslCaption}
                      onChange={e => updatePageContent({ vslCaption: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'نص زر الحجز الرئيسي تحت الفيديو' : 'Primary Hero CTA Button'}
                    </label>
                    <input
                      type="text"
                      value={pageContent.heroCtaText}
                      onChange={e => updatePageContent({ heroCtaText: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                      {isRtl ? 'النص الصغير أسفل الزر' : 'Sub-CTA Helper Note'}
                    </label>
                    <input
                      type="text"
                      value={pageContent.heroSubCtaText}
                      onChange={e => updatePageContent({ heroSubCtaText: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: METRICS & BRANDS */}
            {contentSubTab === 'sec2_metrics' && (
              <div className="apx-bento-card p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-white">{ui.tabMetrics}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [
                        ...(pageContent.heroMetrics || []),
                        { num: '+10M', label: isRtl ? 'رقم إحصائي جديد' : 'New Metric' },
                      ]
                      updatePageContent({ heroMetrics: next })
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold px-3.5 py-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRtl ? 'إضافة رقم إحصائي' : 'Add Metric'}</span>
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {(pageContent.heroMetrics || []).map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <label className="block text-xs text-[#A78BFA] font-bold">
                          {isRtl ? `الرقم الإحصائي ${idx + 1}` : `Metric Card ${idx + 1}`}
                        </label>
                        {(pageContent.heroMetrics || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = pageContent.heroMetrics.filter((_, i) => i !== idx)
                              updatePageContent({ heroMetrics: next })
                            }}
                            className="p-1.5 rounded-lg bg-[#C95D63]/15 text-[#F87171] hover:bg-[#C95D63]/25"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={m.num}
                        onChange={e => {
                          const next = [...pageContent.heroMetrics]
                          next[idx] = { ...next[idx], num: e.target.value }
                          updatePageContent({ heroMetrics: next })
                        }}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3 py-2 text-sm font-bold text-white"
                      />
                      <input
                        type="text"
                        value={m.label}
                        onChange={e => {
                          const next = [...pageContent.heroMetrics]
                          next[idx] = { ...next[idx], label: e.target.value }
                          updatePageContent({ heroMetrics: next })
                        }}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3 py-2 text-xs text-[#E2D9F3]"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-[#8B5CF6]/15">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-2">
                        {isRtl ? 'عنوان شريط العلامات التجارية' : 'Partner Brands Heading'}
                      </label>
                      <input
                        type="text"
                        value={pageContent.brandsLabel}
                        onChange={e => updatePageContent({ brandsLabel: e.target.value })}
                        className="w-full max-w-md rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [
                          ...(pageContent.partnerBrands || []),
                          { nameAr: 'علامة جديدة', nameEn: 'NEW BRAND' },
                        ]
                        updatePageContent({ partnerBrands: next })
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] border border-[#8B5CF6]/40 text-white text-xs font-bold px-3.5 py-2 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isRtl ? 'إضافة علامة تجارية' : 'Add Brand'}</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(pageContent.partnerBrands || []).map((b, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={b.nameAr}
                          onChange={e => {
                            const next = [...pageContent.partnerBrands]
                            next[idx] = { ...next[idx], nameAr: e.target.value }
                            updatePageContent({ partnerBrands: next })
                          }}
                          className="rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={b.nameEn}
                          onChange={e => {
                            const next = [...pageContent.partnerBrands]
                            next[idx] = { ...next[idx], nameEn: e.target.value }
                            updatePageContent({ partnerBrands: next })
                          }}
                          className="rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2 text-xs text-[#A78BFA] font-en"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = pageContent.partnerBrands.filter((_, i) => i !== idx)
                            updatePageContent({ partnerBrands: next })
                          }}
                          className="p-2 rounded-lg bg-[#C95D63]/15 text-[#F87171]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: PROBLEM */}
            {contentSubTab === 'sec3_problem' && (
              <div className="apx-bento-card p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-white">{ui.tabProblem}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [
                        ...(pageContent.problemPoints || []),
                        {
                          index: String((pageContent.problemPoints || []).length + 1).padStart(
                            2,
                            '0'
                          ),
                          title: isRtl ? 'مشكلة جديدة' : 'New Problem Point',
                          body: isRtl ? 'وصف المشكلة وتأثيرها...' : 'Problem description...',
                        },
                      ]
                      updatePageContent({ problemPoints: next })
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold px-3.5 py-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRtl ? 'إضافة بطاقة مشكلة' : 'Add Problem Card'}</span>
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    value={pageContent.problemHeading}
                    onChange={e => updatePageContent({ problemHeading: e.target.value })}
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {(pageContent.problemPoints || []).map((pt, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-en text-xs text-[#A78BFA] font-bold">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        {(pageContent.problemPoints || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = pageContent.problemPoints.filter((_, i) => i !== idx)
                              updatePageContent({ problemPoints: next })
                            }}
                            className="p-1.5 rounded-lg bg-[#C95D63]/15 text-[#F87171]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={pt.title}
                        onChange={e => {
                          const next = [...pageContent.problemPoints]
                          next[idx] = { ...next[idx], title: e.target.value }
                          updatePageContent({ problemPoints: next })
                        }}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3 py-2 text-sm font-bold text-white"
                      />
                      <textarea
                        rows={3}
                        value={pt.body}
                        onChange={e => {
                          const next = [...pageContent.problemPoints]
                          next[idx] = { ...next[idx], body: e.target.value }
                          updatePageContent({ problemPoints: next })
                        }}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3 py-2 text-xs text-[#E2D9F3] resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 4: SYSTEM STEPS & FOUNDER */}
            {contentSubTab === 'sec4_system' && (
              <div className="space-y-6">
                <div className="apx-bento-card p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-white">{ui.tabSystem}</h2>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [
                          ...(pageContent.systemSteps || []),
                          {
                            index: String((pageContent.systemSteps || []).length + 1).padStart(
                              2,
                              '0'
                            ),
                            title: isRtl ? 'المرحلة الجديدة' : 'New System Phase',
                            tag: `Phase 0${(pageContent.systemSteps || []).length + 1}`,
                            body: isRtl ? 'تفاصيل المرحلة...' : 'Step details...',
                          },
                        ]
                        updatePageContent({ systemSteps: next })
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold px-3.5 py-2 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isRtl ? 'إضافة مرحلة في النظام' : 'Add System Step'}</span>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={pageContent.systemHeading}
                      onChange={e => updatePageContent({ systemHeading: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                    <input
                      type="text"
                      value={pageContent.systemSubheading}
                      onChange={e => updatePageContent({ systemSubheading: e.target.value })}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {(pageContent.systemSteps || []).map((st, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-en text-xs text-[#A78BFA] font-bold">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <input
                            type="text"
                            value={st.tag}
                            onChange={e => {
                              const next = [...pageContent.systemSteps]
                              next[idx] = { ...next[idx], tag: e.target.value }
                              updatePageContent({ systemSteps: next })
                            }}
                            className="w-32 rounded-lg bg-[#080608] border border-[#8B5CF6]/30 px-2.5 py-1 text-[11px] font-en text-[#A78BFA]"
                          />
                          {(pageContent.systemSteps || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = pageContent.systemSteps.filter((_, i) => i !== idx)
                                updatePageContent({ systemSteps: next })
                              }}
                              className="p-1.5 rounded-lg bg-[#C95D63]/15 text-[#F87171]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={st.title}
                          onChange={e => {
                            const next = [...pageContent.systemSteps]
                            next[idx] = { ...next[idx], title: e.target.value }
                            updatePageContent({ systemSteps: next })
                          }}
                          className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3 py-2 text-sm font-bold text-white"
                        />
                        <textarea
                          rows={3}
                          value={st.body}
                          onChange={e => {
                            const next = [...pageContent.systemSteps]
                            next[idx] = { ...next[idx], body: e.target.value }
                            updatePageContent({ systemSteps: next })
                          }}
                          className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3 py-2 text-xs text-[#E2D9F3] resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="apx-bento-card p-6 space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={pageContent.founderInfo.nameAr}
                      onChange={e =>
                        updatePageContent({
                          founderInfo: { ...pageContent.founderInfo, nameAr: e.target.value },
                        })
                      }
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      value={pageContent.founderInfo.nameEn}
                      onChange={e =>
                        updatePageContent({
                          founderInfo: { ...pageContent.founderInfo, nameEn: e.target.value },
                        })
                      }
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm text-white font-en"
                    />
                    <input
                      type="text"
                      value={pageContent.founderInfo.roleAr}
                      onChange={e =>
                        updatePageContent({
                          founderInfo: { ...pageContent.founderInfo, roleAr: e.target.value },
                        })
                      }
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm text-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={pageContent.founderInfo.bio}
                    onChange={e =>
                      updatePageContent({
                        founderInfo: { ...pageContent.founderInfo, bio: e.target.value },
                      })
                    }
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm text-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 5: PROOF & TESTIMONIALS */}
            {contentSubTab === 'sec5_testimonials' && (
              <div className="space-y-6">
                <div className="apx-bento-card p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-base font-bold text-white">{ui.tabTestimonials}</h2>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [
                            ...(siteSettings.proofCards || []),
                            {
                              id: `prf_${Date.now()}`,
                              metric: '+150K',
                              unit: isRtl ? 'نتيجة موثقة جديدة' : 'New Proof Metric',
                              desc: isRtl ? 'وصف حالة النجاح...' : 'Case study description...',
                              badge: 'Verified Case',
                              visible: true,
                            },
                          ]
                          setSiteSettings(prev => ({ ...prev, proofCards: next }))
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold px-3.5 py-2 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isRtl ? 'إضافة بطاقة إثبات رقمي' : 'Add Proof Card'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSiteSettings(prev => ({
                            ...prev,
                            showTestimonialsSection: !prev.showTestimonialsSection,
                          }))
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          siteSettings.showTestimonialsSection
                            ? 'bg-[#4BA37A]/20 border border-[#4BA37A]/40 text-[#4BA37A]'
                            : 'bg-[#C95D63]/15 border border-[#C95D63]/35 text-[#F87171]'
                        }`}
                      >
                        {siteSettings.showTestimonialsSection ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>{ui.visibleOnSite}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>{ui.hiddenFromSite}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 pt-2">
                    {(siteSettings.proofCards || []).map((card, idx) => (
                      <div
                        key={card.id || idx}
                        className="rounded-xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-en text-[11px] text-[#A78BFA] font-bold">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          {(siteSettings.proofCards || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = siteSettings.proofCards.filter((_, i) => i !== idx)
                                setSiteSettings(prev => ({ ...prev, proofCards: next }))
                              }}
                              className="p-1 rounded-lg bg-[#C95D63]/15 text-[#F87171]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={card.metric}
                          onChange={e => {
                            const next = [...siteSettings.proofCards]
                            next[idx] = { ...next[idx], metric: e.target.value }
                            setSiteSettings(prev => ({ ...prev, proofCards: next }))
                          }}
                          className="w-full rounded-lg bg-[#080608] border border-[#8B5CF6]/25 px-3 py-1.5 text-xs font-bold text-[#A78BFA]"
                        />
                        <input
                          type="text"
                          value={card.unit}
                          onChange={e => {
                            const next = [...siteSettings.proofCards]
                            next[idx] = { ...next[idx], unit: e.target.value }
                            setSiteSettings(prev => ({ ...prev, proofCards: next }))
                          }}
                          className="w-full rounded-lg bg-[#080608] border border-[#8B5CF6]/25 px-3 py-1.5 text-xs font-bold text-white"
                        />
                        <textarea
                          rows={2}
                          value={card.desc}
                          onChange={e => {
                            const next = [...siteSettings.proofCards]
                            next[idx] = { ...next[idx], desc: e.target.value }
                            setSiteSettings(prev => ({ ...prev, proofCards: next }))
                          }}
                          className="w-full rounded-lg bg-[#080608] border border-[#8B5CF6]/25 px-3 py-1.5 text-[11px] text-[#E2D9F3]/80 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add / Edit Testimonial + List */}
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 apx-bento-card p-6 space-y-4">
                    <form onSubmit={handleSaveTestimonial} className="space-y-3.5">
                      <input
                        type="text"
                        required
                        value={tClientTag}
                        onChange={e => setTClientTag(e.target.value)}
                        placeholder={isRtl ? 'اسم العميل أو صفته' : 'Client Name / Title'}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-xs sm:text-sm text-white"
                      />
                      <textarea
                        rows={3}
                        value={tQuotePreview}
                        onChange={e => setTQuotePreview(e.target.value)}
                        placeholder={isRtl ? 'نص الشهادة...' : 'Testimonial quote...'}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-xs sm:text-sm text-white resize-none"
                      />
                      <input
                        type="text"
                        value={tBeforeAfter}
                        onChange={e => setTBeforeAfter(e.target.value)}
                        placeholder={isRtl ? 'النتيجة باختصار' : 'Result summary'}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-xs sm:text-sm text-white"
                      />
                      <button
                        type="submit"
                        disabled={savingSettings || uploadingImage}
                        className="w-full rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-3 text-xs sm:text-sm"
                      >
                        {isRtl ? 'حفظ الشهادة' : 'Save Testimonial'}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-7 space-y-3">
                    {(siteSettings.testimonials || []).map(item => (
                      <div
                        key={item.id}
                        className={`apx-bento-card p-4 ${
                          item.visible !== false ? '' : 'opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-bold text-white">{item.clientTag}</p>
                            {item.beforeAfter && (
                              <p className="text-xs text-[#A78BFA]">{item.beforeAfter}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleTestimonialVisible(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#080608] border border-[#8B5CF6]/25 text-xs text-[#E2D9F3]"
                            >
                              {item.visible !== false
                                ? isRtl
                                  ? 'إخفاء'
                                  : 'Hide'
                                : isRtl
                                ? 'إظهار'
                                : 'Show'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTestimonial(item.id)}
                              className="p-1.5 rounded-lg bg-[#C95D63]/15 text-[#F87171]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {item.quotePreview && (
                          <p className="text-xs text-[#E2D9F3]/80 bg-[#080608]/60 p-3 rounded-xl">
                            {item.quotePreview}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 6: FIT / NOT FIT */}
            {contentSubTab === 'sec6_fit' && (
              <div className="apx-bento-card p-6 space-y-6">
                <h2 className="text-base font-bold text-white">{ui.tabFit}</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-[#4BA37A]/[0.05] border border-[#4BA37A]/30 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={pageContent.fitYesTitle}
                        onChange={e => updatePageContent({ fitYesTitle: e.target.value })}
                        className="flex-1 rounded-xl bg-[#080608] border border-[#4BA37A]/35 px-3.5 py-2.5 text-sm font-bold text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [
                            ...(pageContent.fitForList || []),
                            isRtl ? 'معيار مناسب جديد...' : 'New fit criterion...',
                          ]
                          updatePageContent({ fitForList: next })
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#4BA37A]/20 border border-[#4BA37A]/40 text-[#4BA37A] text-xs font-bold px-3 py-2.5 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {(pageContent.fitForList || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={e => {
                              const next = [...pageContent.fitForList]
                              next[idx] = e.target.value
                              updatePageContent({ fitForList: next })
                            }}
                            className="flex-1 rounded-xl bg-[#080608] border border-[#8B5CF6]/25 px-3.5 py-2.5 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = pageContent.fitForList.filter((_, i) => i !== idx)
                              updatePageContent({ fitForList: next })
                            }}
                            className="p-2 rounded-lg bg-[#C95D63]/15 text-[#F87171]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#C95D63]/[0.04] border border-[#C95D63]/30 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={pageContent.fitNoTitle}
                        onChange={e => updatePageContent({ fitNoTitle: e.target.value })}
                        className="flex-1 rounded-xl bg-[#080608] border border-[#C95D63]/35 px-3.5 py-2.5 text-sm font-bold text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [
                            ...(pageContent.notFitForList || []),
                            isRtl ? 'معيار غير مناسب جديد...' : 'New non-fit criterion...',
                          ]
                          updatePageContent({ notFitForList: next })
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#C95D63]/20 border border-[#C95D63]/40 text-[#F87171] text-xs font-bold px-3 py-2.5 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {(pageContent.notFitForList || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={e => {
                              const next = [...pageContent.notFitForList]
                              next[idx] = e.target.value
                              updatePageContent({ notFitForList: next })
                            }}
                            className="flex-1 rounded-xl bg-[#080608] border border-[#8B5CF6]/25 px-3.5 py-2.5 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = pageContent.notFitForList.filter((_, i) => i !== idx)
                              updatePageContent({ notFitForList: next })
                            }}
                            className="p-2 rounded-lg bg-[#C95D63]/15 text-[#F87171]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 8: FAQ & /BOOKED PAGE (100% Full Control) */}
            {contentSubTab === 'sec8_faq_booked' && (
              <div className="space-y-6">
                <div className="apx-bento-card p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-white">{ui.tabFaq}</h2>
                      <p className="text-xs text-[#E2D9F3]/60 mt-0.5">
                        {isRtl
                          ? 'تحكم كامل في إظهار أو إخفاء قسم الأسئلة الشائعة، وإضافة أو تعديل أو حذف أو ترتيب الأسئلة.'
                          : 'Full control to show/hide the FAQ section, and add, edit, delete, or reorder questions.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSiteSettings(prev => ({
                            ...prev,
                            showFaqSection: prev.showFaqSection === false ? true : false,
                          }))
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          siteSettings.showFaqSection !== false
                            ? 'bg-[#4BA37A]/20 border border-[#4BA37A]/40 text-[#4BA37A]'
                            : 'bg-[#C95D63]/15 border border-[#C95D63]/35 text-[#F87171]'
                        }`}
                      >
                        {siteSettings.showFaqSection !== false ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>{ui.visibleOnSite}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>{ui.hiddenFromSite}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = [
                            ...(pageContent.faqItems || []),
                            {
                              q: isRtl ? 'سؤال شائع جديد؟' : 'New Frequently Asked Question?',
                              a: isRtl ? 'اكتب الإجابة التفصيلية هنا...' : 'Write the detailed answer here...',
                            },
                          ]
                          updatePageContent({ faqItems: next })
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold px-4 py-2 transition-all shadow-md shadow-[#8B5CF6]/25"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isRtl ? 'إضافة سؤال جديد' : 'Add FAQ Item'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-[#8B5CF6]/15">
                    <div>
                      <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                        {isRtl ? 'عنوان قسم الأسئلة الشائعة' : 'FAQ Section Heading'}
                      </label>
                      <input
                        type="text"
                        value={pageContent.faqHeading}
                        onChange={e => updatePageContent({ faqHeading: e.target.value })}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                        {isRtl ? 'نص الزر أسفل الأسئلة الشائعة' : 'FAQ Bottom CTA Text'}
                      </label>
                      <input
                        type="text"
                        value={pageContent.faqCtaText}
                        onChange={e => updatePageContent({ faqCtaText: e.target.value })}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(pageContent.faqItems || []).map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-en font-bold text-[#A78BFA]">
                            FAQ #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const next = [...pageContent.faqItems]
                                const tmp = next[idx]
                                next[idx] = next[idx - 1]
                                next[idx - 1] = tmp
                                updatePageContent({ faqItems: next })
                              }}
                              className="p-1.5 rounded-lg bg-[#120B1E] border border-[#8B5CF6]/20 text-[#E2D9F3]/70 hover:text-white disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === pageContent.faqItems.length - 1}
                              onClick={() => {
                                const next = [...pageContent.faqItems]
                                const tmp = next[idx]
                                next[idx] = next[idx + 1]
                                next[idx + 1] = tmp
                                updatePageContent({ faqItems: next })
                              }}
                              className="p-1.5 rounded-lg bg-[#120B1E] border border-[#8B5CF6]/20 text-[#E2D9F3]/70 hover:text-white disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = pageContent.faqItems.filter((_, i) => i !== idx)
                                updatePageContent({ faqItems: next })
                              }}
                              className="p-1.5 rounded-lg bg-[#C95D63]/15 border border-[#C95D63]/30 text-[#F87171] hover:bg-[#C95D63]/25"
                              title={ui.deleteTitle}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={faq.q}
                          onChange={e => {
                            const next = [...pageContent.faqItems]
                            next[idx] = { ...next[idx], q: e.target.value }
                            updatePageContent({ faqItems: next })
                          }}
                          placeholder={isRtl ? 'السؤال...' : 'Question...'}
                          className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2 text-sm font-bold text-white"
                        />
                        <textarea
                          rows={2}
                          value={faq.a}
                          onChange={e => {
                            const next = [...pageContent.faqItems]
                            next[idx] = { ...next[idx], a: e.target.value }
                            updatePageContent({ faqItems: next })
                          }}
                          placeholder={isRtl ? 'الإجابة...' : 'Answer...'}
                          className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2 text-xs text-[#E2D9F3] resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer & Booked Page Copy */}
                <div className="apx-bento-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    {isRtl ? 'نصوص الفوتر وصفحة تأكيد الحجز (/booked)' : 'Footer & /booked Confirmation Copy'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                        {isRtl ? 'شعار الفوتر (Tagline)' : 'Footer Tagline'}
                      </label>
                      <input
                        type="text"
                        value={pageContent.footerTagline}
                        onChange={e => updatePageContent({ footerTagline: e.target.value })}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                        {isRtl ? 'نص حقوق الملكية في الفوتر' : 'Footer Copyright'}
                      </label>
                      <input
                        type="text"
                        value={pageContent.footerCopyright}
                        onChange={e => updatePageContent({ footerCopyright: e.target.value })}
                        className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* =====================================================================
            SECTION 4: LEAD MAGNETS
        ===================================================================== */}
        {activeSection === 'magnets' && (
          <motion.div
            key="sec-magnets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="apx-bento-card p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{ui.magnetsTitle}</h1>
              <p className="text-xs sm:text-sm text-[#E2D9F3]/65 mt-1">{ui.magnetsSub}</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Upload Magnet Form */}
              <div className="lg:col-span-5 apx-bento-card p-6 space-y-5">
                <h2 className="text-base font-bold text-white">{ui.addMagnetTitle}</h2>

                <form onSubmit={handleCreateMagnet} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/85 mb-1.5">
                      {ui.magnetTitleLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#E2D9F3]/85 mb-1.5">
                      {ui.magnetDescLabel}
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#080608] border border-[#8B5CF6]/20">
                    <button
                      type="button"
                      onClick={() => setSourceType('upload')}
                      className={`py-2.5 rounded-lg text-xs font-bold ${
                        sourceType === 'upload'
                          ? 'bg-[#8B5CF6] text-white'
                          : 'text-[#E2D9F3]/60'
                      }`}
                    >
                      {ui.sourceUpload}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceType('external')}
                      className={`py-2.5 rounded-lg text-xs font-bold ${
                        sourceType === 'external'
                          ? 'bg-[#8B5CF6] text-white'
                          : 'text-[#E2D9F3]/60'
                      }`}
                    >
                      {ui.sourceExternal}
                    </button>
                  </div>

                  {sourceType === 'upload' ? (
                    <div className="rounded-2xl border-2 border-dashed border-[#8B5CF6]/35 bg-[#080608]/50 p-5 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-[#E2D9F3]/80 file:me-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#8B5CF6] file:text-white"
                      />
                      {selectedFile && (
                        <p className="text-xs text-[#4BA37A] mt-2 font-en">
                          {selectedFile.name} ({formatBytes(selectedFile.size)})
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      dir="ltr"
                      value={externalUrl}
                      onChange={e => setExternalUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-xs font-en text-white"
                    />
                  )}

                  <div className="rounded-2xl apx-liquid-glass border border-[#8B5CF6]/25 p-4 space-y-3.5">
                    <div
                      onClick={() => setRequireLead(!requireLead)}
                      role="switch"
                      aria-checked={requireLead}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setRequireLead(!requireLead)
                        }
                      }}
                      className="flex items-center justify-between gap-3 cursor-pointer select-none group"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white group-hover:text-[#A78BFA] transition-colors">
                          {ui.requireLeadLabel}
                        </span>
                        <p className="text-[11px] text-[#E2D9F3]/55">
                          {requireLead
                            ? isRtl
                              ? 'مفعّل — سيُطلب من الزائر إدخال بياناته قبل التحميل'
                              : 'Enabled — visitor must enter details before download'
                            : isRtl
                              ? 'غير مفعّل — تحميل مباشر فوراً'
                              : 'Disabled — direct instant download'}
                        </p>
                      </div>

                      {/* Fixed LTR Liquid Glass Toggle Switch (never overflows in RTL) */}
                      <div
                        dir="ltr"
                        className={`relative w-12 h-6 rounded-full p-0.5 overflow-hidden shrink-0 transition-colors duration-200 ${
                          requireLead
                            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] shadow-[0_0_16px_rgba(139,92,246,0.5)] border border-[#A78BFA]/60'
                            : 'bg-[#140D22] border border-[#8B5CF6]/25'
                        }`}
                      >
                        <motion.div
                          initial={false}
                          animate={{ x: requireLead ? 22 : 0 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                          className={`w-4 h-4 mt-0.5 ms-0.5 rounded-full shadow-md ${
                            requireLead ? 'bg-white' : 'bg-[#E2D9F3]/60'
                          }`}
                        />
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {requireLead && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-[#8B5CF6]/15 text-xs">
                            {[
                              {
                                active: collectName,
                                toggle: () => setCollectName(!collectName),
                                label: ui.fieldName,
                              },
                              {
                                active: collectEmail,
                                toggle: () => setCollectEmail(!collectEmail),
                                label: ui.fieldEmail,
                              },
                              {
                                active: collectPhone,
                                toggle: () => setCollectPhone(!collectPhone),
                                label: ui.fieldPhone,
                              },
                            ].map((field, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={field.toggle}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all ${
                                  field.active
                                    ? 'bg-[#8B5CF6]/25 border border-[#8B5CF6] text-white shadow-[0_0_14px_rgba(139,92,246,0.3)]'
                                    : 'bg-[#0D0914]/80 border border-[#8B5CF6]/20 text-[#E2D9F3]/55 hover:text-white'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    field.active
                                      ? 'bg-[#4BA37A] shadow-[0_0_8px_#4BA37A]'
                                      : 'bg-[#E2D9F3]/30'
                                  }`}
                                />
                                <span>{field.label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingMagnet}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold py-4 px-6 text-sm shadow-lg shadow-[#8B5CF6]/25 transition-all disabled:opacity-50 apx-btn-glow"
                  >
                    {submittingMagnet
                      ? uploadProgress > 0
                        ? `${uploadProgress}%...`
                        : ui.savingBtn
                      : ui.uploadMagnetBtn}
                  </button>
                </form>
              </div>

              {/* List of Lead Magnets */}
              <div className="lg:col-span-7 space-y-4">
                {magnets.length === 0 ? (
                  <div className="apx-bento-card p-10 text-center">
                    <FolderOpen className="w-10 h-10 text-[#8B5CF6]/50 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">{ui.emptyMagnets}</p>
                  </div>
                ) : (
                  magnets.map(magnet => (
                    <div
                      key={magnet.id}
                      className="apx-bento-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] font-en text-[10px] font-bold">
                            {magnet.fileType}
                          </span>
                          <h3 className="text-base font-bold text-white">{magnet.title}</h3>
                        </div>
                        <p className="text-xs font-en text-[#E2D9F3]/55" dir="ltr">
                          /d/{magnet.slug} · {magnet.downloads || 0} {ui.downloadsCount}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(magnet)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold px-4 py-2.5"
                        >
                          {copiedId === magnet.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>{ui.copiedLink}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>{ui.copyLink}</span>
                            </>
                          )}
                        </button>
                        <a
                          href={buildMagnetShareUrl(magnet)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/25 text-[#E2D9F3] hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteMagnet(magnet.id)}
                          className="p-2.5 rounded-xl bg-[#C95D63]/15 text-[#F87171] hover:bg-[#C95D63]/25"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* =====================================================================
            SECTION 5: BOOKING, FOMO URGENCY & SITE VISIBILITY SETTINGS
        ===================================================================== */}
        {activeSection === 'settings' && (
          <motion.div
            key="sec-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="apx-bento-card p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{ui.settingsTitle}</h1>
                <p className="text-xs sm:text-sm text-[#E2D9F3]/65 mt-1">{ui.settingsSub}</p>
              </div>

              <button
                type="button"
                disabled={savingSettings}
                onClick={() => saveSiteSettingsToServer(siteSettings)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-xs sm:text-sm px-6 py-3.5 shadow-lg shadow-[#8B5CF6]/25 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? ui.savingBtn : ui.saveSettingsBtn}</span>
              </button>
            </div>

            {/* FOMO Strategy, Countdown & Client Availability Control Panel */}
            <div className="apx-bento-card p-6 space-y-5 border-[#8B5CF6]/45">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                    <span>
                      {isRtl
                        ? 'إدارة الـ FOMO الموحد، العد التنازلي، والمقاعد (للصفحة الرئيسية وتقارير الأوديت معاً)'
                        : 'Unified FOMO Strategy, Countdown Timer & Seats (Main Website & Audit Reports)'}
                    </span>
                  </h2>
                  <p className="text-xs text-[#E2D9F3]/65 mt-0.5">
                    {isRtl
                      ? 'أي تعديل هنا يُطبّق تلقائياً وبنفس اللحظة على الصفحة الرئيسية للموقع وعلى جميع صفحات تقارير الأوديت بنفس النص، نفس المقاعد المتبقية، ونفس العد التنازلي.'
                      : 'Changes saved here automatically apply in real-time to both the Main Website and all Audit Report pages with the exact same text, seats, and synchronized countdown.'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Accepting Clients Toggle Card */}
                <div className="p-4 rounded-2xl bg-[#080608]/80 border border-[#8B5CF6]/25 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">
                      {isRtl ? 'حالة استقبال عملاء جدد حالياً' : 'Accepting New Clients Status'}
                    </span>
                    <span className="text-[11px] text-[#E2D9F3]/60 block mt-0.5">
                      {siteSettings.acceptingClients !== false
                        ? isRtl
                          ? 'مفتوح الآن — يمكن للعملاء حجز المكالمة مباشرة'
                          : 'Open — prospects can book calls now'
                        : isRtl
                        ? 'مغلق (الدفعة مكتملة) — يظهر وضع قائمة الانتظار'
                        : 'Closed (Cohort Full) — shows Waitlist mode'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSiteSettings(prev => ({
                        ...prev,
                        acceptingClients: prev.acceptingClients === false ? true : false,
                      }))
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                      siteSettings.acceptingClients !== false
                        ? 'bg-[#4BA37A]/20 border-[#4BA37A]/45 text-[#4BA37A]'
                        : 'bg-[#C95D63]/20 border-[#C95D63]/45 text-[#F87171]'
                    }`}
                  >
                    {siteSettings.acceptingClients !== false
                      ? isRtl
                        ? 'متاح (Online)'
                        : 'Accepting'
                      : isRtl
                      ? 'مكتمل (Waitlist)'
                      : 'Waitlist Only'}
                  </button>
                </div>

                {/* Enable / Disable FOMO Bar Toggle Card */}
                <div className="p-4 rounded-2xl bg-[#080608]/80 border border-[#8B5CF6]/25 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">
                      {isRtl ? 'تفعيل شريط الـ FOMO والعد التنازلي' : 'Show FOMO & Countdown Bar'}
                    </span>
                    <span className="text-[11px] text-[#E2D9F3]/60 block mt-0.5">
                      {siteSettings.fomoEnabled !== false
                        ? isRtl
                          ? 'ظاهر في أعلى الموقع وفي قسم الحجز'
                          : 'Visible in sticky header & booking section'
                        : isRtl
                        ? 'مخفي من الموقع'
                        : 'Hidden from website'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSiteSettings(prev => ({
                        ...prev,
                        fomoEnabled: prev.fomoEnabled === false ? true : false,
                      }))
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                      siteSettings.fomoEnabled !== false
                        ? 'bg-[#8B5CF6]/25 border-[#8B5CF6] text-white'
                        : 'bg-[#140D22] border-[#8B5CF6]/25 text-[#E2D9F3]/60'
                    }`}
                  >
                    {siteSettings.fomoEnabled !== false
                      ? isRtl
                        ? 'مفعّل'
                        : 'Enabled'
                      : isRtl
                      ? 'مخفي'
                      : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                    {isRtl ? 'عدد المقاعد المتبقية (Remaining Spots)' : 'Remaining Spots Left'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={siteSettings.fomoSeatsLeft ?? 3}
                    onChange={e => {
                      const nextSeats = Math.max(1, Number(e.target.value) || 1)
                      setSiteSettings(prev => {
                        const prevAr =
                          prev.fomoTextAr || 'متبقي 3 مقاعد فقط لتطبيق الـ System هذا الشهر'
                        const prevEn =
                          prev.fomoTextEn || 'Only 3 onboarding spots left this month'
                        return {
                          ...prev,
                          fomoSeatsLeft: nextSeats,
                          fomoTextAr: prevAr.replace(
                            /(متبقي\s+)[0-9٠-٩]+(\s*(?:مقاعد|مقعد|أماكن|فرص))/g,
                            `$1${nextSeats}$2`
                          ),
                          fomoTextEn: prevEn.replace(
                            /(Only\s+)\d+(\s*(?:onboarding\s+)?(?:spots|seats|places))/gi,
                            `$1${nextSeats}$2`
                          ),
                        }
                      })
                    }}
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm font-en font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                    {isRtl ? 'مدة العد التنازلي (بالدقائق)' : 'Countdown Timer (Minutes)'}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={siteSettings.fomoCountdownMinutes ?? 30}
                    onChange={e =>
                      setSiteSettings(prev => ({
                        ...prev,
                        fomoCountdownMinutes: Math.max(5, Number(e.target.value) || 30),
                      }))
                    }
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-sm font-en font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#E2D9F3]/80 mb-1.5">
                    {isRtl ? 'رسالة الندرة (FOMO Text)' : 'Custom Urgency Text'}
                  </label>
                  <input
                    type="text"
                    value={
                      siteSettings.fomoTextAr ??
                      'متبقي 3 مقاعد فقط لتطبيق الـ System هذا الشهر'
                    }
                    onChange={e =>
                      setSiteSettings(prev => ({
                        ...prev,
                        fomoTextAr: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-2.5 text-xs sm:text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <div className="apx-bento-card p-6 space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-white mb-2">
                  {ui.calendarUrlLabel}
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={siteSettings.calendlyUrl}
                  onChange={e =>
                    setSiteSettings(prev => ({ ...prev, calendlyUrl: e.target.value }))
                  }
                  placeholder="https://calendly.com/..."
                  className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3.5 text-xs sm:text-sm font-en text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="rounded-2xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{ui.calendarModeTitle}</h3>
                    <p className="text-xs text-[#E2D9F3]/65 mt-1">{ui.calendarModeDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSiteSettings(prev => ({
                        ...prev,
                        skipQualificationForm: !prev.skipQualificationForm,
                      }))
                    }
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold ${
                      siteSettings.skipQualificationForm
                        ? 'bg-[#8B5CF6] text-white'
                        : 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 text-[#E2D9F3]'
                    }`}
                  >
                    {siteSettings.skipQualificationForm
                      ? ui.calendarModeDirect
                      : ui.calendarModeForm}
                  </button>
                </div>

                <div className="rounded-2xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{ui.testimonialsVisTitle}</h3>
                    <p className="text-xs text-[#E2D9F3]/65 mt-1">{ui.testimonialsVisDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSiteSettings(prev => ({
                        ...prev,
                        showTestimonialsSection: !prev.showTestimonialsSection,
                      }))
                    }
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold ${
                      siteSettings.showTestimonialsSection
                        ? 'bg-[#4BA37A]/20 border border-[#4BA37A]/40 text-[#4BA37A]'
                        : 'bg-[#C95D63]/15 border border-[#C95D63]/35 text-[#F87171]'
                    }`}
                  >
                    {siteSettings.showTestimonialsSection ? ui.visibleOnSite : ui.hiddenFromSite}
                  </button>
                </div>

                <div className="rounded-2xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{ui.proofVisTitle}</h3>
                    <p className="text-xs text-[#E2D9F3]/65 mt-1">{ui.proofVisDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSiteSettings(prev => ({
                        ...prev,
                        showProofCards: !prev.showProofCards,
                      }))
                    }
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold ${
                      siteSettings.showProofCards
                        ? 'bg-[#4BA37A]/20 border border-[#4BA37A]/40 text-[#4BA37A]'
                        : 'bg-[#C95D63]/15 border border-[#C95D63]/35 text-[#F87171]'
                    }`}
                  >
                    {siteSettings.showProofCards ? ui.visibleOnSite : ui.hiddenFromSite}
                  </button>
                </div>

                <div className="rounded-2xl bg-[#080608]/70 border border-[#8B5CF6]/25 p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isRtl ? 'قسم الأسئلة الشائعة (FAQ)' : 'FAQ Section Visibility'}
                    </h3>
                    <p className="text-xs text-[#E2D9F3]/65 mt-1">
                      {isRtl
                        ? 'إظهار أو إخفاء قسم الأسئلة الشائعة بالكامل من الصفحة الرئيسية.'
                        : 'Show or hide the entire FAQ section on the homepage.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSiteSettings(prev => ({
                        ...prev,
                        showFaqSection: prev.showFaqSection === false ? true : false,
                      }))
                    }
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold ${
                      siteSettings.showFaqSection !== false
                        ? 'bg-[#4BA37A]/20 border border-[#4BA37A]/40 text-[#4BA37A]'
                        : 'bg-[#C95D63]/15 border border-[#C95D63]/35 text-[#F87171]'
                    }`}
                  >
                    {siteSettings.showFaqSection !== false ? ui.visibleOnSite : ui.hiddenFromSite}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#8B5CF6]/15 flex items-center justify-between text-xs text-[#E2D9F3]/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#A78BFA]" />
                  <span>
                    {storageMode === 'vercel-blob' ? ui.storageCloud : ui.storageLocal}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
      </div>

      {/* ==================== GLOBAL ADMIN COMMAND PALETTE (Ctrl + K) ==================== */}
      <AnimatePresence>
        {globalCmdOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGlobalCmdOpen(false)}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4"
            dir={ui.dir}
          >
            <motion.div
              initial={{ scale: 0.96, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: -10 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl rounded-3xl bg-[#100B1A] border border-[#8B5CF6]/45 shadow-[0_28px_90px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="p-4 border-b border-[#8B5CF6]/20 flex items-center gap-3">
                <Search className="w-5 h-5 text-[#A78BFA] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={globalCmdQuery}
                  onChange={e => setGlobalCmdQuery(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'ابحث عن قسم، أمر سريع، أو مستند في لوحة التحكم...'
                      : 'Type a command or jump to any Admin section...'
                  }
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#E2D9F3]/40 focus:outline-none"
                />
                <kbd className="font-en text-[11px] px-2 py-0.5 rounded bg-[#1B132E] border border-[#8B5CF6]/30 text-[#C4B5FD]">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2.5 space-y-1">
                {[
                  {
                    id: 'cmd-audits',
                    label: isRtl ? 'الانتقال إلى: فحص الحسابات (Audit Studio)' : 'Go to: Account Audits',
                    kbd: 'G A',
                    run: () => setActiveSection('audits'),
                  },
                  {
                    id: 'cmd-contracts',
                    label: isRtl ? 'الانتقال إلى: استوديو العقود' : 'Go to: Contracts Studio',
                    kbd: 'G C',
                    run: () => {
                      setActiveSection('contracts')
                      studioApiRef.current?.setFilter('contract')
                    },
                  },
                  {
                    id: 'cmd-new-contract',
                    label: isRtl ? 'إنشاء عقد جديد فوراً' : 'Create New Contract',
                    kbd: 'N C',
                    run: () => {
                      setActiveSection('contracts')
                      setTimeout(() => studioApiRef.current?.newDoc('contract'), 60)
                    },
                  },
                  {
                    id: 'cmd-scripts',
                    label: isRtl ? 'الانتقال إلى: استوديو السكربتات' : 'Go to: Scripts Studio',
                    kbd: 'G S',
                    run: () => {
                      setActiveSection('scripts')
                      studioApiRef.current?.setFilter('scripts')
                    },
                  },
                  {
                    id: 'cmd-new-script',
                    label: isRtl ? 'إنشاء وثيقة سكربتات جديدة فوراً' : 'Create New Scripts Document',
                    kbd: 'N S',
                    run: () => {
                      setActiveSection('scripts')
                      setTimeout(() => studioApiRef.current?.newDoc('scripts'), 60)
                    },
                  },
                  {
                    id: 'cmd-custom-forms',
                    label: isRtl
                      ? 'الانتقال إلى: مصنع النماذج (فورم تعيين / استبيانات)'
                      : 'Go to: Form Factory (Hiring & Custom Forms)',
                    kbd: 'G F',
                    run: () => setActiveSection('custom_forms'),
                  },
                  {
                    id: 'cmd-insights',
                    label: isRtl ? 'الانتقال إلى: إحصائيات المنظومة (Insights)' : 'Go to: Insights & Analytics',
                    kbd: 'G I',
                    run: () => setActiveSection('insights'),
                  },
                  {
                    id: 'cmd-leads',
                    label: isRtl ? 'الانتقال إلى: الطلبات والعملاء المحتملين' : 'Go to: Captured Leads',
                    kbd: 'G L',
                    run: () => setActiveSection('leads'),
                  },
                  {
                    id: 'cmd-qual-form',
                    label: isRtl ? 'الانتقال إلى: نموذج التأهيل الأساسي' : 'Go to: Qualification Form',
                    kbd: 'G Q',
                    run: () => setActiveSection('form'),
                  },
                  {
                    id: 'cmd-content',
                    label: isRtl ? 'الانتقال إلى: إدارة محتوى الموقع' : 'Go to: Website Content CMS',
                    kbd: 'G W',
                    run: () => setActiveSection('content'),
                  },
                  {
                    id: 'cmd-magnets',
                    label: isRtl ? 'الانتقال إلى: الملفات المجانية (Lead Magnets)' : 'Go to: Lead Magnets',
                    kbd: 'G M',
                    run: () => setActiveSection('magnets'),
                  },
                  {
                    id: 'cmd-settings',
                    label: isRtl ? 'الانتقال إلى: الإعدادات والتقويم' : 'Go to: Booking & Settings',
                    kbd: 'G T',
                    run: () => setActiveSection('settings'),
                  },
                  {
                    id: 'cmd-lang',
                    label: isRtl ? 'تبديل لغة لوحة التحكم (العربية / English)' : 'Toggle Admin Language (AR / EN)',
                    kbd: 'Alt+L',
                    run: () => toggleAdminLang(),
                  },
                  {
                    id: 'cmd-refresh',
                    label: isRtl ? 'تحديث ومزامنة بيانات لوحة التحكم' : 'Refresh Dashboard Data',
                    kbd: 'Ctrl+R',
                    run: () => fetchDashboardData(),
                  },
                  {
                    id: 'cmd-shortcuts',
                    label: isRtl ? 'عرض دليل اختصارات لوحة المفاتيح' : 'View Keyboard Shortcuts Guide',
                    kbd: '?',
                    run: () => setGlobalShortcutsOpen(true),
                  },
                ]
                  .filter(
                    item =>
                      !globalCmdQuery.trim() ||
                      item.label.toLowerCase().includes(globalCmdQuery.trim().toLowerCase())
                  )
                  .map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setGlobalCmdOpen(false)
                        item.run()
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-start text-xs sm:text-sm font-bold text-[#E2D9F3] hover:text-white hover:bg-[#8B5CF6]/20 transition-all"
                    >
                      <span>{item.label}</span>
                      <kbd className="font-en text-[11px] px-2 py-0.5 rounded bg-[#181129] border border-[#8B5CF6]/30 text-[#C4B5FD]">
                        {item.kbd}
                      </kbd>
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== GLOBAL KEYBOARD SHORTCUTS CHEAT-SHEET MODAL (?) ==================== */}
      <AnimatePresence>
        {globalShortcutsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGlobalShortcutsOpen(false)}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            dir={ui.dir}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-[#100B1A] border border-[#8B5CF6]/45 p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#8B5CF6]/20 pb-3.5">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isRtl
                    ? 'اختصارات لوحة المفاتيح العامة في النظام'
                    : 'Global Admin Panel Keyboard Shortcuts'}
                </h3>
                <button
                  type="button"
                  onClick={() => setGlobalShortcutsOpen(false)}
                  className="px-3 py-1 rounded-xl bg-[#1A122B] text-xs font-bold text-[#C4B5FD] hover:text-white"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                {[
                  {
                    k: 'Ctrl / Cmd + K',
                    d: isRtl
                      ? 'فتح لوحة الأوامر السريعة والتنقل بين الأقسام'
                      : 'Open Global Command Palette',
                  },
                  {
                    k: 'Ctrl / Cmd + S',
                    d: isRtl
                      ? 'حفظ التغييرات في القسم الحالي (نموذج، محتوى، إعدادات، عقود)'
                      : 'Save changes in the active section',
                  },
                  {
                    k: 'Ctrl / Cmd + P',
                    d: isRtl
                      ? 'طباعة أو تصدير PDF للمستند أو الصفحة الحالية'
                      : 'Print / Export PDF of current view',
                  },
                  {
                    k: 'Ctrl / Cmd + D',
                    d: isRtl
                      ? 'تكرار العقد أو السكربت المفتوح حالياً'
                      : 'Duplicate active contract or script',
                  },
                  {
                    k: '/',
                    d: isRtl ? 'تفعيل البحث الفوري' : 'Focus quick search',
                  },
                  {
                    k: '?',
                    d: isRtl ? 'إظهار نافذة الاختصارات هذه' : 'Show this shortcuts guide',
                  },
                  {
                    k: 'Esc',
                    d: isRtl ? 'إغلاق أي نافذة منبثقة مفتوحة' : 'Close any active modal',
                  },
                ].map(row => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-[#150F24] border border-[#8B5CF6]/20 px-4 py-2.5"
                  >
                    <span className="text-[#E2D9F3]/85 font-medium">{row.d}</span>
                    <kbd className="font-en text-xs font-bold px-2.5 py-1 rounded-lg bg-[#090510] border border-[#8B5CF6]/35 text-[#C4B5FD] whitespace-nowrap">
                      {row.k}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
