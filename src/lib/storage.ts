import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { put, list, del } from '@vercel/blob'
import {
  DEFAULT_MAIN_FUNNEL_FORM as CONST_MAIN_FUNNEL_FORM,
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  type TestimonialItem,
  type ProofCardItem,
} from '@/lib/constants'

export type { SiteSettings, TestimonialItem, ProofCardItem }

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
}

export interface CustomForm {
  id: string
  slug: string // Encrypted hash token or 'funnel-qualification'
  title: string
  description: string
  fields: FormField[]
  buttonText: string
  successMessage: string
  disqualifyOption?: string // Option text that redirects to Lead Magnet instead of Calendar
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
  createdAt: string
}

export interface DatabaseSchema {
  magnets: LeadMagnet[]
  leads: CapturedLead[]
  forms: CustomForm[]
  formSubmissions: FormSubmission[]
  siteSettings?: SiteSettings
}

const BLOB_DB_PATH = 'zyad-cms/db.json'

export const DEFAULT_MAIN_FUNNEL_FORM: CustomForm = CONST_MAIN_FUNNEL_FORM

export function ensureMainFunnelForm(db: DatabaseSchema): DatabaseSchema {
  const existingIdx = db.forms.findIndex(
    f => f.id === 'frm_funnel_main' || f.slug === 'funnel-qualification'
  )
  if (existingIdx === -1) {
    db.forms.unshift({ ...DEFAULT_MAIN_FUNNEL_FORM })
  } else {
    db.forms[existingIdx].isMainFunnel = true
    if (!db.forms[existingIdx].disqualifyOption) {
      db.forms[existingIdx].disqualifyOption = 'أقل من $2,700'
    }
    // Upgrade legacy unedited 6-field form or empty skeleton to the minimal 2-field form
    const currentFields = db.forms[existingIdx].fields || []
    const hasOptions = currentFields.some(
      f => Array.isArray(f.options) && f.options.length > 0
    )
    const isLegacySixFieldDefault =
      currentFields.length === 6 &&
      currentFields.some(f => f.id === 'fld_account') &&
      currentFields.some(f => f.id === 'fld_role')
    if (!hasOptions || isLegacySixFieldDefault) {
      db.forms[existingIdx].fields = DEFAULT_MAIN_FUNNEL_FORM.fields
      db.forms[existingIdx].title = DEFAULT_MAIN_FUNNEL_FORM.title
      db.forms[existingIdx].description = DEFAULT_MAIN_FUNNEL_FORM.description
      db.forms[existingIdx].buttonText = DEFAULT_MAIN_FUNNEL_FORM.buttonText
    }
  }

  // Ensure siteSettings exist with defaults
  if (!db.siteSettings) {
    db.siteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      proofCards: [...DEFAULT_SITE_SETTINGS.proofCards],
      testimonials: [...DEFAULT_SITE_SETTINGS.testimonials],
    }
  } else {
    db.siteSettings = {
      showTestimonialsSection:
        typeof db.siteSettings.showTestimonialsSection === 'boolean'
          ? db.siteSettings.showTestimonialsSection
          : DEFAULT_SITE_SETTINGS.showTestimonialsSection,
      showProofCards:
        typeof db.siteSettings.showProofCards === 'boolean'
          ? db.siteSettings.showProofCards
          : DEFAULT_SITE_SETTINGS.showProofCards,
      skipQualificationForm:
        typeof db.siteSettings.skipQualificationForm === 'boolean'
          ? db.siteSettings.skipQualificationForm
          : DEFAULT_SITE_SETTINGS.skipQualificationForm,
      calendlyUrl: db.siteSettings.calendlyUrl || DEFAULT_SITE_SETTINGS.calendlyUrl,
      proofCards: Array.isArray(db.siteSettings.proofCards)
        ? db.siteSettings.proofCards
        : [...DEFAULT_SITE_SETTINGS.proofCards],
      testimonials: Array.isArray(db.siteSettings.testimonials)
        ? db.siteSettings.testimonials
        : [...DEFAULT_SITE_SETTINGS.testimonials],
    }
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

export async function getDatabase(): Promise<DatabaseSchema> {
  if (isBlobConfigured()) {
    try {
      const { blobs } = await list({ prefix: BLOB_DB_PATH, limit: 5 })
      const exactBlob = blobs.find(b => b.pathname === BLOB_DB_PATH) || blobs[0]
      if (!exactBlob) {
        return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [] })
      }
      const res = await fetch(`${exactBlob.url}?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [] })
      }
      const data = await res.json()
      return ensureMainFunnelForm({
        magnets: Array.isArray(data.magnets) ? data.magnets : [],
        leads: Array.isArray(data.leads) ? data.leads : [],
        forms: Array.isArray(data.forms) ? data.forms : [],
        formSubmissions: Array.isArray(data.formSubmissions) ? data.formSubmissions : [],
        siteSettings: data.siteSettings,
      })
    } catch (err) {
      console.error('Error reading Blob DB:', err)
      return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [] })
    }
  }

  try {
    const dbPath = getLocalDbPath()
    if (!fs.existsSync(dbPath)) {
      return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [] })
    }
    const raw = fs.readFileSync(dbPath, 'utf-8')
    const data = JSON.parse(raw)
    return ensureMainFunnelForm({
      magnets: Array.isArray(data.magnets) ? data.magnets : [],
      leads: Array.isArray(data.leads) ? data.leads : [],
      forms: Array.isArray(data.forms) ? data.forms : [],
      formSubmissions: Array.isArray(data.formSubmissions) ? data.formSubmissions : [],
      siteSettings: data.siteSettings,
    })
  } catch (err) {
    console.error('Error reading local DB:', err)
    return ensureMainFunnelForm({ magnets: [], leads: [], forms: [], formSubmissions: [] })
  }
}

export async function saveDatabase(db: DatabaseSchema): Promise<void> {
  if (isBlobConfigured()) {
    await put(BLOB_DB_PATH, JSON.stringify(db, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
    })
    return
  }

  const dbPath = getLocalDbPath()
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8')
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
