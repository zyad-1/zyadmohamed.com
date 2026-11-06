import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { put, list, del } from '@vercel/blob'
import {
  DEFAULT_MAIN_FUNNEL_FORM as CONST_MAIN_FUNNEL_FORM,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PAGE_CONTENT,
  DEFAULT_UNQUALIFIED_MESSAGE,
  type SiteSettings,
  type PageContent,
  type TestimonialItem,
  type ProofCardItem,
  type FormFieldOption,
} from '@/lib/constants'

export type {
  SiteSettings,
  PageContent,
  TestimonialItem,
  ProofCardItem,
  FormFieldOption,
}

export interface LeadMagnet {
  id: string
  slug: string // Encrypted hash token
  title: string
  description: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  isExternal: boolean
  requireLead: boolean
  collectFields: {
    name: boolean
    phone: boolean
    email: boolean
  }
  buttonText: string
  views: number
  downloads: number
  createdAt: string
}

export interface CapturedLead {
  id: string
  magnetId: string
  magnetTitle: string
  magnetSlug: string
  name: string
  phone: string
  email: string
  createdAt: string
}

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'tel' | 'email' | 'select'
  placeholder?: string
  required: boolean
  options?: string[]
  optionItems?: FormFieldOption[]
}

export interface CustomForm {
  id: string
  slug: string // Encrypted hash token or 'funnel-qualification'
  title: string
  description: string
  fields: FormField[]
  buttonText: string
  successMessage: string
  disqualifyOption?: string // Legacy fallback
  isMainFunnel?: boolean
  views: number
  submissionsCount: number
  createdAt: string
}

export interface FormSubmission {
  id: string
  formId: string
  formTitle: string
  formSlug: string
  answers: Record<string, string>
  qualified?: boolean
  countryCode?: string
  countryName?: string
  createdAt: string
}

export interface SiteAnalyticsEvent {
  id: string
  sessionId: string
  event: string
  countryCode: string
  countryName: string
  payload?: Record<string, unknown>
  createdAt: string
}

export interface DatabaseSchema {
  magnets: LeadMagnet[]
  leads: CapturedLead[]
  forms: CustomForm[]
  formSubmissions: FormSubmission[]
  siteSettings?: SiteSettings
  siteEvents?: SiteAnalyticsEvent[]
  studioStore?: Record<string, string>
}

const BLOB_DB_PATH = 'zyad-cms/db.json'

export const DEFAULT_MAIN_FUNNEL_FORM: CustomForm = CONST_MAIN_FUNNEL_FORM

function normalizeFormFields(fields: FormField[], disqualifyOption = 'أقل من $2,700'): FormField[] {
  return (fields || []).map(f => {
    if (f.type !== 'select') return f
    const rawItems = Array.isArray(f.optionItems) ? f.optionItems : []
    const rawStrings = Array.isArray(f.options) ? f.options : []
    if (rawItems.length > 0) {
      return {
        ...f,
        optionItems: rawItems.map((item, idx) => ({
          id: item.id || `opt_${idx + 1}`,
          text: String(item.text || '').trim(),
          qualified: typeof item.qualified === 'boolean' ? item.qualified : true,
        })),
        options: rawItems.map(item => String(item.text || '').trim()).filter(Boolean),
      }
    }
    const builtItems: FormFieldOption[] = rawStrings
      .map(s => String(s || '').trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `opt_${idx + 1}`,
        text,
        qualified: text !== disqualifyOption.trim() && !text.includes('أقل من'),
      }))
    return {
      ...f,
      options: builtItems.map(i => i.text),
      optionItems: builtItems,
    }
  })
}

export function ensureMainFunnelForm(db: DatabaseSchema): DatabaseSchema {
  const existingIdx = db.forms.findIndex(
    f => f.id === 'frm_funnel_main' || f.slug === 'funnel-qualification'
  )
  if (existingIdx === -1) {
    db.forms.unshift({
      ...DEFAULT_MAIN_FUNNEL_FORM,
      fields: normalizeFormFields(DEFAULT_MAIN_FUNNEL_FORM.fields),
    })
  } else {
    db.forms[existingIdx].isMainFunnel = true
    if (!db.forms[existingIdx].disqualifyOption) {
      db.forms[existingIdx].disqualifyOption = 'أقل من $2,700'
    }
    const currentFields = db.forms[existingIdx].fields || []
    const hasOptions = currentFields.some(
      f =>
        (Array.isArray(f.options) && f.options.length > 0) ||
        (Array.isArray(f.optionItems) && f.optionItems.length > 0)
    )
    const isLegacySixFieldDefault =
      currentFields.length === 6 &&
      currentFields.some(f => f.id === 'fld_account') &&
      currentFields.some(f => f.id === 'fld_role')
    if (!hasOptions || isLegacySixFieldDefault) {
      db.forms[existingIdx].fields = normalizeFormFields(DEFAULT_MAIN_FUNNEL_FORM.fields)
      db.forms[existingIdx].title = DEFAULT_MAIN_FUNNEL_FORM.title
      db.forms[existingIdx].description = DEFAULT_MAIN_FUNNEL_FORM.description
      db.forms[existingIdx].buttonText = DEFAULT_MAIN_FUNNEL_FORM.buttonText
    } else {
      db.forms[existingIdx].fields = normalizeFormFields(
        db.forms[existingIdx].fields,
        db.forms[existingIdx].disqualifyOption
      )
    }
  }

  // Normalize all other forms' select fields too
  db.forms = db.forms.map(frm => ({
    ...frm,
    fields: normalizeFormFields(frm.fields, frm.disqualifyOption),
  }))

  // Ensure siteSettings exist with defaults + deep merge pageContent
  const rawSettings = db.siteSettings || ({} as Partial<SiteSettings>)
  const rawPage = rawSettings.pageContent || ({} as Partial<PageContent>)

  const resolvedFomoSeats =
    typeof rawSettings.fomoSeatsLeft === 'number'
      ? rawSettings.fomoSeatsLeft
      : DEFAULT_SITE_SETTINGS.fomoSeatsLeft ?? 3
  const rawFomoAr =
    typeof rawSettings.fomoTextAr === 'string' && rawSettings.fomoTextAr.trim()
      ? rawSettings.fomoTextAr
      : DEFAULT_SITE_SETTINGS.fomoTextAr || `متبقي ${resolvedFomoSeats} مقاعد فقط لتطبيق الـ System هذا الشهر`
  const rawFomoEn =
    typeof rawSettings.fomoTextEn === 'string' && rawSettings.fomoTextEn.trim()
      ? rawSettings.fomoTextEn
      : DEFAULT_SITE_SETTINGS.fomoTextEn || `Only ${resolvedFomoSeats} onboarding spots left this month`

  db.siteSettings = {
    showTestimonialsSection:
      typeof rawSettings.showTestimonialsSection === 'boolean'
        ? rawSettings.showTestimonialsSection
        : DEFAULT_SITE_SETTINGS.showTestimonialsSection,
    showProofCards:
      typeof rawSettings.showProofCards === 'boolean'
        ? rawSettings.showProofCards
        : DEFAULT_SITE_SETTINGS.showProofCards,
    showFaqSection:
      typeof rawSettings.showFaqSection === 'boolean'
        ? rawSettings.showFaqSection
        : DEFAULT_SITE_SETTINGS.showFaqSection ?? true,
    acceptingClients:
      typeof rawSettings.acceptingClients === 'boolean'
        ? rawSettings.acceptingClients
        : DEFAULT_SITE_SETTINGS.acceptingClients ?? true,
    fomoEnabled:
      typeof rawSettings.fomoEnabled === 'boolean'
        ? rawSettings.fomoEnabled
        : DEFAULT_SITE_SETTINGS.fomoEnabled ?? true,
    fomoSeatsLeft: resolvedFomoSeats,
    fomoCountdownMinutes:
      typeof rawSettings.fomoCountdownMinutes === 'number'
        ? rawSettings.fomoCountdownMinutes
        : DEFAULT_SITE_SETTINGS.fomoCountdownMinutes ?? 30,
    fomoTextAr: rawFomoAr.replace(
      /(متبقي\s+)[0-9٠-٩]+(\s*(?:مقاعد|مقعد|أماكن|فرص))/g,
      `$1${resolvedFomoSeats}$2`
    ),
    fomoTextEn: rawFomoEn.replace(
      /(Only\s+)\d+(\s*(?:onboarding\s+)?(?:spots|seats|places))/gi,
      `$1${resolvedFomoSeats}$2`
    ),
    skipQualificationForm:
      typeof rawSettings.skipQualificationForm === 'boolean'
        ? rawSettings.skipQualificationForm
        : DEFAULT_SITE_SETTINGS.skipQualificationForm,
    calendlyUrl: rawSettings.calendlyUrl || DEFAULT_SITE_SETTINGS.calendlyUrl,
    unqualifiedMessage:
      typeof rawSettings.unqualifiedMessage === 'string' && rawSettings.unqualifiedMessage.trim()
        ? rawSettings.unqualifiedMessage
        : DEFAULT_UNQUALIFIED_MESSAGE,
    unqualifiedRedirectTarget:
      typeof rawSettings.unqualifiedRedirectTarget === 'string'
        ? rawSettings.unqualifiedRedirectTarget
        : '',
    proofCards: (Array.isArray(rawSettings.proofCards)
      ? rawSettings.proofCards
      : [...DEFAULT_SITE_SETTINGS.proofCards]
    ).map(card => ({
      ...card,
      metric: String(card.metric || '')
        .replace(/\+?80[,\s]*000[,\s]*000/g, '+80M')
        .replace(/80\s*مليون/g, '80M')
        .replace(/\+?185[,\s]*000/g, '+185K')
        .replace(/185\s*ألف/g, '185K'),
    })),
    testimonials: Array.isArray(rawSettings.testimonials)
      ? rawSettings.testimonials
      : [...DEFAULT_SITE_SETTINGS.testimonials],
    pageContent: {
      ...DEFAULT_PAGE_CONTENT,
      ...rawPage,
      founderInfo: {
        ...DEFAULT_PAGE_CONTENT.founderInfo,
        ...(rawPage.founderInfo || {}),
      },
      heroMetrics: Array.isArray(rawPage.heroMetrics)
        ? rawPage.heroMetrics
        : [...DEFAULT_PAGE_CONTENT.heroMetrics],
      partnerBrands: Array.isArray(rawPage.partnerBrands)
        ? rawPage.partnerBrands
        : [...DEFAULT_PAGE_CONTENT.partnerBrands],
      problemPoints: Array.isArray(rawPage.problemPoints)
        ? rawPage.problemPoints
        : [...DEFAULT_PAGE_CONTENT.problemPoints],
      systemSteps: Array.isArray(rawPage.systemSteps)
        ? rawPage.systemSteps
        : [...DEFAULT_PAGE_CONTENT.systemSteps],
      fitForList: Array.isArray(rawPage.fitForList)
        ? rawPage.fitForList
        : [...DEFAULT_PAGE_CONTENT.fitForList],
      notFitForList: Array.isArray(rawPage.notFitForList)
        ? rawPage.notFitForList
        : [...DEFAULT_PAGE_CONTENT.notFitForList],
      faqItems: Array.isArray(rawPage.faqItems)
        ? rawPage.faqItems
        : [...DEFAULT_PAGE_CONTENT.faqItems],
      bookedSteps: Array.isArray(rawPage.bookedSteps)
        ? rawPage.bookedSteps
        : [...DEFAULT_PAGE_CONTENT.bookedSteps],
    },
  }

  return db
}

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export function generateEncryptedToken(bytes = 12): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

export function validateRealEmail(email: string): { valid: boolean; message?: string } {
  const cleaned = email.trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(cleaned)) {
    return {
      valid: false,
      message: 'يرجى كتابة بريد إلكتروني صحيح.',
    }
  }

  const [localPart, domain] = cleaned.split('@')

  const fakeLocalParts = [
    'test',
    'testing',
    'fake',
    'admin',
    'user',
    'abc',
    'abcd',
    'asdf',
    'qwerty',
    '123',
    '1234',
    '12345',
    '123456',
    'none',
    'noemail',
    'null',
    'aaa',
    'zzz',
    'xxx',
  ]

  const disposableDomains = [
    'test.com',
    'example.com',
    'fake.com',
    'mailinator.com',
    'tempmail.com',
    'temp-mail.org',
    '10minutemail.com',
    'yopmail.com',
    'guerrillamail.com',
    'sharklasers.com',
    'trashmail.com',
    'a.com',
    'b.com',
    '123.com',
  ]

  if (
    localPart.length < 2 ||
    fakeLocalParts.includes(localPart) ||
    /^(\d)\1+$/.test(localPart) ||
    /^([a-z])\1+$/.test(localPart) ||
    disposableDomains.includes(domain)
  ) {
    return {
      valid: false,
      message: 'يرجى إدخال بريدك الإلكتروني الحقيقي (وليس بريداً مؤقتاً أو تجريبياً).',
    }
  }

  return { valid: true }
}

function getLocalDbPath(): string {
  if (process.env.VERCEL) {
    const tmpDir = '/tmp/zyad-cms'
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }
    return path.join(tmpDir, 'db.json')
  }
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return path.join(dataDir, 'db.json')
}

const globalForCms = globalThis as unknown as {
  zyadCmsMemoryDb?: DatabaseSchema
}

export async function getDatabase(): Promise<DatabaseSchema> {
  if (globalForCms.zyadCmsMemoryDb) {
    return ensureMainFunnelForm(globalForCms.zyadCmsMemoryDb)
  }

  try {
    const dbPath = getLocalDbPath()
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8')
      const data = JSON.parse(raw)
      const normalized = ensureMainFunnelForm({
        magnets: Array.isArray(data.magnets) ? data.magnets : [],
        leads: Array.isArray(data.leads) ? data.leads : [],
        forms: Array.isArray(data.forms) ? data.forms : [],
        formSubmissions: Array.isArray(data.formSubmissions) ? data.formSubmissions : [],
        siteSettings: data.siteSettings,
        siteEvents: Array.isArray(data.siteEvents) ? data.siteEvents : [],
        studioStore:
          data.studioStore && typeof data.studioStore === 'object' ? data.studioStore : {},
      })
      globalForCms.zyadCmsMemoryDb = normalized
      return normalized
    }
  } catch (err) {
    console.error('Error reading local DB:', err)
  }

  if (isBlobConfigured()) {
    try {
      const { blobs } = await list({ prefix: BLOB_DB_PATH, limit: 5 })
      const exactBlob = blobs.find(b => b.pathname === BLOB_DB_PATH) || blobs[0]
      if (!exactBlob) {
        return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [], siteEvents: [] })
      }
      const res = await fetch(`${exactBlob.url}?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [], siteEvents: [] })
      }
      const data = await res.json()
      const normalized = ensureMainFunnelForm({
        magnets: Array.isArray(data.magnets) ? data.magnets : [],
        leads: Array.isArray(data.leads) ? data.leads : [],
        forms: Array.isArray(data.forms) ? data.forms : [],
        formSubmissions: Array.isArray(data.formSubmissions) ? data.formSubmissions : [],
        siteSettings: data.siteSettings,
        siteEvents: Array.isArray(data.siteEvents) ? data.siteEvents : [],
        studioStore:
          data.studioStore && typeof data.studioStore === 'object' ? data.studioStore : {},
      })
      globalForCms.zyadCmsMemoryDb = normalized
      try {
        fs.writeFileSync(getLocalDbPath(), JSON.stringify(normalized, null, 2), 'utf-8')
      } catch {}
      return normalized
    } catch (err) {
      console.error('Error reading Blob DB:', err)
      return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [] })
    }
  }

  return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [] })
}

export async function saveDatabase(db: DatabaseSchema): Promise<void> {
  const normalized = ensureMainFunnelForm(db)
  globalForCms.zyadCmsMemoryDb = normalized

  try {
    const dbPath = getLocalDbPath()
    fs.writeFileSync(dbPath, JSON.stringify(normalized, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving local DB:', e)
  }

  if (isBlobConfigured()) {
    const syncBlob = async () => {
      try {
        await put(BLOB_DB_PATH, JSON.stringify(normalized, null, 2), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 0,
        })
      } catch (err) {
        console.error('Error syncing Blob DB:', err)
      }
    }
    if (process.env.VERCEL) {
      await syncBlob()
    } else {
      void syncBlob()
    }
  }
}

export async function deleteBlobFileIfNeeded(fileUrl: string): Promise<void> {
  if (!fileUrl) return
  if (isBlobConfigured() && fileUrl.includes('.public.blob.vercel-storage.com')) {
    try {
      await del(fileUrl)
    } catch (e) {
      console.error('Failed to delete blob:', e)
    }
  } else if (!process.env.VERCEL && fileUrl.startsWith('/uploads/')) {
    try {
      const localFile = path.join(process.cwd(), 'public', fileUrl)
      if (fs.existsSync(localFile)) {
        fs.unlinkSync(localFile)
      }
    } catch (e) {
      console.error('Failed to delete local file:', e)
    }
  }
}

export function formatFileSize(bytes: number): string {
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
