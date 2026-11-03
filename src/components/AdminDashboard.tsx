'use client'

import React, { useState, useEffect, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import {
  Upload,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  FileText,
  Users,
  Download,
  Eye,
  Lock,
  Unlock,
  LogOut,
  Plus,
  Sparkles,
  MessageCircle,
  AlertCircle,
  FolderOpen,
  ClipboardList,
  Inbox,
  RefreshCw,
  ShieldCheck,
  MessageSquareQuote,
  EyeOff,
  Edit3,
  Calendar,
} from 'lucide-react'
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  type TestimonialItem,
  type ProofCardItem,
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

export default function AdminDashboard({ initialAuth }: Props) {
  const [isAuthed, setIsAuthed] = useState(initialAuth)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Dashboard state
  const [activeTab, setActiveTab] = useState<
    'magnets' | 'forms' | 'testimonials' | 'submissions' | 'leads'
  >('magnets')
  const [magnets, setMagnets] = useState<LeadMagnet[]>([])
  const [leads, setLeads] = useState<CapturedLead[]>([])
  const [forms, setForms] = useState<CustomForm[]>([])
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [storageMode, setStorageMode] = useState<'vercel-blob' | 'vercel-tmp' | 'local'>('local')
  const [loadingData, setLoadingData] = useState(false)

  // Testimonials editor state
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null)
  const [tClientTag, setTClientTag] = useState('')
  const [tBeforeAfter, setTBeforeAfter] = useState('')
  const [tQuotePreview, setTQuotePreview] = useState('')
  const [tImageUrl, setTImageUrl] = useState('')
  const [uploadingTestimonialImg, setUploadingTestimonialImg] = useState(false)

  // Create Lead Magnet form state
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

  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Create / Edit Custom Form state
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [editingIsMainFunnel, setEditingIsMainFunnel] = useState(false)
  const [disqualifyOption, setDisqualifyOption] = useState('أقل من $2,700')
  const [customFormTitle, setCustomFormTitle] = useState('')
  const [customFormDesc, setCustomFormDesc] = useState('')
  const [customFormBtn, setCustomFormBtn] = useState('إرسال البيانات')
  const [customFormSuccessMsg, setCustomFormSuccessMsg] = useState(
    'تم استلام بياناتك بنجاح! سنتواصل معك في أقرب وقت.'
  )
  const [customFields, setCustomFields] = useState<
    Array<{
      id: string
      label: string
      type: FormField['type']
      placeholder?: string
      required: boolean
      optionsText: string
    }>
  >([
    { id: 'f1', label: 'الاسم الكامل', type: 'text', placeholder: 'اكتب اسمك الكامل...', required: true, optionsText: '' },
    { id: 'f2', label: 'رقم الواتساب (مع كود الدولة)', type: 'tel', placeholder: '+966 50 000 0000', required: true, optionsText: '' },
    { id: 'f3', label: 'البريد الإلكتروني', type: 'email', placeholder: 'name@company.com', required: true, optionsText: '' },
    { id: 'f4', label: 'تفاصيل طلبك أو استفسارك', type: 'textarea', placeholder: '', required: false, optionsText: '' },
  ])
  const [creatingForm, setCreatingForm] = useState(false)
  const [customFormError, setCustomFormError] = useState('')
  const [customFormCreatedMsg, setCustomFormCreatedMsg] = useState('')

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedMagnetFilter, setSelectedMagnetFilter] = useState<string>('all')
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('all')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDashboardData = async () => {
    setLoadingData(true)
    try {
      const res = await fetch('/api/admin/magnets', { cache: 'no-store' })
      if (res.status === 401) {
        setIsAuthed(false)
        return
      }
      const data = await res.json()
      if (res.ok) {
        setMagnets(data.magnets || [])
        setLeads(data.leads || [])
        setForms(data.forms || [])
        setFormSubmissions(data.formSubmissions || [])
        if (data.siteSettings) setSiteSettings(data.siteSettings)
        if (data.storageMode) setStorageMode(data.storageMode)
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
        setAuthError(data.error || 'كلمة المرور غير صحيحة')
      } else {
        setIsAuthed(true)
        setPassword('')
      }
    } catch {
      setAuthError('حدث خطأ في الاتصال')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' })
    setIsAuthed(false)
  }

  // ===================== LEAD MAGNET HANDLERS =====================
  const handleCreateMagnet = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!title.trim()) {
      setFormError('يرجى كتابة عنوان الملف')
      return
    }

    if (sourceType === 'upload' && !selectedFile) {
      setFormError('يرجى اختيار ملف من جهازك لرفعه')
      return
    }

    if (sourceType === 'external' && !externalUrl.trim()) {
      setFormError('يرجى وضع رابط الملف الخارجي')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    try {
      let finalFileUrl = ''
      let finalFileName = ''
      let finalFileSize = 0
      let finalFileType = 'LINK'

      if (sourceType === 'upload' && selectedFile) {
        const ext = selectedFile.name.split('.').pop()?.toLowerCase() || ''
        finalFileName = selectedFile.name
        finalFileSize = selectedFile.size
        finalFileType = ext.toUpperCase() || 'FILE'

        if (storageMode === 'vercel-blob') {
          // Encrypted filename in Blob storage so original filename is never in the URL
          const encryptedBlobName = `f_${randomHex(20)}${ext ? `.${ext}` : ''}`
          const blob = await upload(`zyad-files/${encryptedBlobName}`, selectedFile, {
            access: 'public',
            handleUploadUrl: '/api/admin/blob-upload',
            multipart: selectedFile.size > 4 * 1024 * 1024,
            onUploadProgress: ({ percentage }) => {
              setUploadProgress(Math.round(percentage))
            },
          })
          finalFileUrl = blob.url
        } else {
          const fd = new FormData()
          fd.append('file', selectedFile)
          const upRes = await fetch('/api/admin/upload', {
            method: 'POST',
            body: fd,
          })
          const upData = await upRes.json()
          if (!upRes.ok) {
            throw new Error(upData.error || 'فشل رفع الملف')
          }
          finalFileUrl = upData.url
          finalFileName = upData.fileName
          finalFileSize = upData.fileSize
          finalFileType = upData.fileType
        }
      } else {
        finalFileUrl = externalUrl.trim()
        finalFileName = title.trim()
        finalFileSize = 0
        finalFileType = 'LINK'
      }

      const createRes = await fetch('/api/admin/magnets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          fileSize: finalFileSize,
          fileType: finalFileType,
          isExternal: sourceType === 'external',
          requireLead,
          collectFields: {
            name: collectName,
            phone: collectPhone,
            email: collectEmail,
          },
          buttonText: buttonText.trim() || 'تحميل الملف الآن',
        }),
      })

      const createData = await createRes.json()
      if (!createRes.ok) {
        throw new Error(createData.error || 'حدث خطأ أثناء حفظ البيانات')
      }

      setMagnets(prev => [createData.magnet, ...prev])
      setTitle('')
      setDescription('')
      setSelectedFile(null)
      setExternalUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFormSuccess('تم رفع الملف وتوليد اللينك المشفر بنجاح!')
      setTimeout(() => setFormSuccess(''), 4000)
    } catch (err) {
      setFormError((err as Error).message || 'حدث خطأ غير متوقع')
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  const getMagnetShareUrl = (magnet: LeadMagnet) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zyadmohamed.com'
    if (storageMode === 'vercel-tmp') {
      const payload = {
        id: magnet.id,
        t: magnet.title,
        d: magnet.description,
        u: magnet.fileUrl,
        fn: magnet.fileName,
        fs: magnet.fileSize,
        ft: magnet.fileType,
        rl: magnet.requireLead,
        cf: {
          n: magnet.collectFields.name,
          p: magnet.collectFields.phone,
          e: magnet.collectFields.email,
        },
        bt: magnet.buttonText,
      }
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      return `${origin}/d/${magnet.slug}?d=${encoded}`
    }
    return `${origin}/d/${magnet.slug}`
  }

  const getFormShareUrl = (form: CustomForm) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zyadmohamed.com'
    if (storageMode === 'vercel-tmp') {
      const payload = {
        id: form.id,
        t: form.title,
        d: form.description,
        f: form.fields,
        bt: form.buttonText,
        sm: form.successMessage,
      }
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      return `${origin}/f/${form.slug}?d=${encoded}`
    }
    return `${origin}/f/${form.slug}`
  }

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      // Fallback
    }
  }

  const handleToggleLeadMode = async (magnet: LeadMagnet) => {
    const nextMode = !magnet.requireLead
    try {
      const res = await fetch('/api/admin/magnets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: magnet.id,
          requireLead: nextMode,
        }),
      })
      const data = await res.json()
      if (res.ok && data.magnet) {
        setMagnets(prev => prev.map(m => (m.id === magnet.id ? data.magnet : m)))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRegenerateSlug = async (magnet: LeadMagnet) => {
    if (!window.confirm('هل تريد تغيير وتوليد كود مشفر جديد لهذا الرابط؟ (الرابط القديم سيتوقف عن العمل)')) return
    try {
      const res = await fetch('/api/admin/magnets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: magnet.id,
          regenerateSlug: true,
        }),
      })
      const data = await res.json()
      if (res.ok && data.magnet) {
        setMagnets(prev => prev.map(m => (m.id === magnet.id ? data.magnet : m)))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteMagnet = async (id: string, magnetTitle: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${magnetTitle}" نهائياً؟`)) return
    try {
      const res = await fetch(`/api/admin/magnets?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMagnets(prev => prev.filter(m => m.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/admin/magnets?leadId=${encodeURIComponent(leadId)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId))
      }
    } catch (e) {
      console.error(e)
    }
  }

  // ===================== CUSTOM FORMS HANDLERS =====================
  const handleStartEditForm = (form: CustomForm) => {
    setEditingFormId(form.id)
    setEditingIsMainFunnel(Boolean(form.isMainFunnel || form.id === 'frm_funnel_main'))
    setDisqualifyOption(form.disqualifyOption || 'أقل من $2,700')
    setCustomFormTitle(form.title)
    setCustomFormDesc(form.description || '')
    setCustomFormBtn(form.buttonText || 'إرسال البيانات')
    setCustomFormSuccessMsg(form.successMessage || 'تم استلام بياناتك بنجاح!')
    setCustomFields(
      form.fields.map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder || '',
        required: f.required !== false,
        optionsText: Array.isArray(f.options) ? f.options.join(', ') : '',
      }))
    )
    setCustomFormError('')
    setCustomFormCreatedMsg('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEditForm = () => {
    setEditingFormId(null)
    setEditingIsMainFunnel(false)
    setCustomFormTitle('')
    setCustomFormDesc('')
    setCustomFormBtn('إرسال البيانات')
    setCustomFormSuccessMsg('تم استلام بياناتك بنجاح! سنتواصل معك في أقرب وقت.')
    setCustomFields([
      { id: 'f1', label: 'الاسم الكامل', type: 'text', placeholder: 'اكتب اسمك الكامل...', required: true, optionsText: '' },
      { id: 'f2', label: 'رقم الواتساب (مع كود الدولة)', type: 'tel', placeholder: '+966 50 000 0000', required: true, optionsText: '' },
      { id: 'f3', label: 'البريد الإلكتروني', type: 'email', placeholder: 'name@company.com', required: true, optionsText: '' },
      { id: 'f4', label: 'تفاصيل طلبك أو استفسارك', type: 'textarea', placeholder: '', required: false, optionsText: '' },
    ])
  }

  const handleAddFieldRow = () => {
    setCustomFields(prev => [
      ...prev,
      {
        id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        label: '',
        type: 'text',
        placeholder: '',
        required: true,
        optionsText: '',
      },
    ])
  }

  const handleRemoveFieldRow = (id: string) => {
    if (customFields.length <= 1) return
    setCustomFields(prev => prev.filter(f => f.id !== id))
  }

  const handleUpdateFieldRow = (
    id: string,
    key: 'label' | 'type' | 'placeholder' | 'required' | 'optionsText',
    val: string | boolean
  ) => {
    setCustomFields(prev =>
      prev.map(f => (f.id === id ? { ...f, [key]: val } : f))
    )
  }

  const handleCreateCustomForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setCustomFormError('')
    setCustomFormCreatedMsg('')

    if (!customFormTitle.trim()) {
      setCustomFormError('يرجى كتابة عنوان الفورم')
      return
    }

    const validFields = customFields.filter(f => f.label.trim() !== '')
    if (validFields.length === 0) {
      setCustomFormError('يرجى إضافة سؤال أو حقل واحد على الأقل')
      return
    }

    setCreatingForm(true)
    try {
      const formattedFields: FormField[] = validFields.map(f => ({
        id: f.id,
        label: f.label.trim(),
        type: f.type,
        placeholder: (f.placeholder || '').trim(),
        required: f.required,
        options:
          f.type === 'select'
            ? f.optionsText
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
            : [],
      }))

      const isUpdating = Boolean(editingFormId)
      const res = await fetch('/api/admin/forms', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFormId || undefined,
          title: customFormTitle.trim(),
          description: customFormDesc.trim(),
          buttonText: customFormBtn.trim() || 'إرسال البيانات',
          successMessage:
            customFormSuccessMsg.trim() || 'تم استلام بياناتك بنجاح! سنتواصل معك قريباً.',
          disqualifyOption: editingIsMainFunnel ? disqualifyOption.trim() : undefined,
          fields: formattedFields,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ الفورم')
      }

      if (isUpdating) {
        setForms(prev => prev.map(f => (f.id === editingFormId ? data.form : f)))
        setCustomFormCreatedMsg('تم حفظ التعديلات على الفورم بنجاح!')
        setEditingFormId(null)
        setEditingIsMainFunnel(false)
      } else {
        setForms(prev => [...prev, data.form])
        setCustomFormTitle('')
        setCustomFormDesc('')
        setCustomFormCreatedMsg('تم إنشاء الفورم وتوليد اللينك المشفر بنجاح!')
      }
      setTimeout(() => setCustomFormCreatedMsg(''), 4000)
    } catch (err) {
      setCustomFormError((err as Error).message || 'حدث خطأ أثناء حفظ الفورم')
    } finally {
      setCreatingForm(false)
    }
  }

  const handleDeleteForm = async (formId: string, formTitle: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الفورم "${formTitle}"؟`)) return
    try {
      const res = await fetch(`/api/admin/forms?formId=${encodeURIComponent(formId)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setForms(prev => prev.filter(f => f.id !== formId))
        setFormSubmissions(prev => prev.filter(s => s.formId !== formId))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      const res = await fetch(
        `/api/admin/forms?submissionId=${encodeURIComponent(submissionId)}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setFormSubmissions(prev => prev.filter(s => s.id !== submissionId))
      }
    } catch (e) {
      console.error(e)
    }
  }

  // ===================== CSV EXPORTS =====================
  const handleExportLeadsCSV = () => {
    const filtered =
      selectedMagnetFilter === 'all'
        ? leads
        : leads.filter(l => l.magnetId === selectedMagnetFilter)

    const headers = ['الاسم', 'رقم الهاتف / واتساب', 'البريد الإلكتروني', 'الملف المحمل', 'التاريخ']
    const rows = filtered.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.magnetTitle || '').replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toLocaleString('ar-EG')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zyad-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportSubmissionsCSV = () => {
    const filtered =
      selectedFormFilter === 'all'
        ? formSubmissions
        : formSubmissions.filter(s => s.formId === selectedFormFilter)

    const allKeysSet = new Set<string>()
    filtered.forEach(s => {
      Object.keys(s.answers || {}).forEach(k => allKeysSet.add(k))
    })
    const answerKeys = Array.from(allKeysSet)

    const headers = ['عنوان الفورم', ...answerKeys, 'التاريخ']
    const rows = filtered.map(s => [
      `"${(s.formTitle || '').replace(/"/g, '""')}"`,
      ...answerKeys.map(k => `"${String(s.answers?.[k] || '—').replace(/"/g, '""')}"`),
      `"${new Date(s.createdAt).toLocaleString('ar-EG')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zyad-form-responses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ===================== TESTIMONIALS & SITE SETTINGS HANDLERS =====================
  const saveSiteSettingsToServer = async (nextSettings: SiteSettings, msg = 'تم حفظ التعديلات بنجاح!') => {
    setSavingSettings(true)
    setSettingsMsg('')
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextSettings),
      })
      const data = await res.json()
      if (res.ok && data.siteSettings) {
        setSiteSettings(data.siteSettings)
        setSettingsMsg(msg)
        setTimeout(() => setSettingsMsg(''), 3500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleTestimonialImageUpload = async (file: File) => {
    setUploadingTestimonialImg(true)
    try {
      if (storageMode === 'vercel-blob') {
        const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : ''
        const safePath = `zyad-magnets/testimonial_${Date.now()}_${randomHex(8)}${ext}`
        const blob = await upload(safePath, file, {
          access: 'public',
          handleUploadUrl: '/api/admin/blob-upload',
        })
        setTImageUrl(blob.url)
      } else {
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: fd,
        })
        const upData = await upRes.json()
        if (upRes.ok && upData.fileUrl) {
          setTImageUrl(upData.fileUrl)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUploadingTestimonialImg(false)
    }
  }

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
      editingTestimonialId ? 'تم تحديث الشهادة بنجاح!' : 'تمت إضافة الشهادة الجديدة بنجاح!'
    )
  }

  const handleStartEditTestimonial = (item: TestimonialItem) => {
    setEditingTestimonialId(item.id)
    setTClientTag(item.clientTag)
    setTBeforeAfter(item.beforeAfter)
    setTQuotePreview(item.quotePreview)
    setTImageUrl(item.imageUrl || '')
  }

  const handleToggleTestimonialVisible = async (id: string) => {
    const updated = (siteSettings.testimonials || []).map(t =>
      t.id === id ? { ...t, visible: !t.visible } : t
    )
    await saveSiteSettingsToServer(
      { ...siteSettings, testimonials: updated },
      'تم تحديث حالة ظهور الشهادة!'
    )
  }

  const handleDeleteTestimonial = async (id: string) => {
    const updated = (siteSettings.testimonials || []).filter(t => t.id !== id)
    await saveSiteSettingsToServer(
      { ...siteSettings, testimonials: updated },
      'تم حذف الشهادة بنجاح!'
    )
  }

  const handleUpdateProofCard = (index: number, patch: Partial<ProofCardItem>) => {
    const nextCards = [...(siteSettings.proofCards || [])]
    nextCards[index] = { ...nextCards[index], ...patch }
    setSiteSettings(prev => ({ ...prev, proofCards: nextCards }))
  }

  // ===================== LOGIN VIEW =====================
  if (!isAuthed) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-6 py-12 font-ar cursor-auto"
      >
        <div className="glass w-full max-w-md rounded-2xl p-8 md:p-10 border border-authority/30 shadow-[0_0_60px_rgba(139,92,246,0.15)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <img
                src="/logo/logo-white.png"
                alt="APX"
                className="h-7 w-auto object-contain mb-1.5"
              />
              <p className="text-xs text-authority font-medium">لوحة تحكم الأدمن الخاصة</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-authority/15 border border-authority/30 flex items-center justify-center text-authority">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">تسجيل دخول المالك</h1>
          <p className="text-sm text-luminance/65 mb-8 leading-relaxed">
            هذه الصفحة خاصة بصاحب الموقع فقط لرفع وإدارة ملفات الـ Lead Magnets وإنشاء الفورمز واللينكات المشفرة.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-luminance/80 mb-2">
                كلمة المرور (Admin Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                required
                className="w-full rounded-xl bg-void/80 border border-authority/30 px-4 py-3.5 text-white placeholder-luminance/30 focus:outline-none focus:border-authority transition-colors"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-authority hover:bg-crown text-white font-bold py-3.5 px-6 transition-all duration-300 shadow-[0_0_25px_rgba(139,92,246,0.35)] disabled:opacity-50"
            >
              {authLoading ? 'جاري الدخول...' : 'دخول للوحة التحكم'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ===================== ADMIN DASHBOARD VIEW =====================
  const totalDownloads = magnets.reduce((acc, m) => acc + (m.downloads || 0), 0)
  const filteredLeads =
    selectedMagnetFilter === 'all'
      ? leads
      : leads.filter(l => l.magnetId === selectedMagnetFilter)
  const filteredSubmissions =
    selectedFormFilter === 'all'
      ? formSubmissions
      : formSubmissions.filter(s => s.formId === selectedFormFilter)

  return (
    <div dir="rtl" className="min-h-screen px-4 md:px-10 py-8 font-ar cursor-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="glass rounded-2xl px-6 md:px-8 py-5 flex flex-wrap items-center justify-between gap-4 border border-authority/25">
          <div className="flex items-center gap-4">
            <div className="h-11 px-3 rounded-xl bg-authority/15 border border-authority/35 flex items-center justify-center">
              <img
                src="/logo/logo-white.png"
                alt="APX"
                className="h-6 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white">لوحة تحكم المالك</h1>
                <span className="text-[11px] bg-authority/20 text-luminance border border-authority/40 px-2.5 py-0.5 rounded-full">
                  روابط مشفرة وخاصة
                </span>
              </div>
              <p className="text-xs text-luminance/60 mt-0.5">
                إدارة ملفات الـ Lead Magnets وإنشاء الفورمز واستقبال بيانات العملاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-luminance/80 hover:text-white glass glass-hover px-4 py-2.5 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-authority" />
              <span>الصفحة الرئيسية</span>
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 px-4 py-2.5 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </header>

        {/* Vercel Storage Notice if on Vercel without Blob token yet */}
        {storageMode === 'vercel-tmp' && (
          <div className="glass rounded-2xl p-5 border border-amber-400/40 bg-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                تنبيه بخصوص التخزين السحابي الدائم على Vercel:
              </p>
              <p className="text-xs text-luminance/80 leading-relaxed">
                لرفع ملفات من جهازك وحفظ البيانات بشكل دائم على Vercel، افتح مشروعك في لوحة تحكم Vercel ثم اضغط على تبويب{' '}
                <strong className="text-white">Storage</strong> ثم اختر <strong className="text-white">Create Database → Blob</strong>{' '}
                (مجاني وبضغطة واحدة فقط).
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'ملفات الليد ماجنت', val: magnets.length, icon: <FolderOpen className="w-5 h-5 text-authority" /> },
            { label: 'مرات تحميل الملفات', val: totalDownloads, icon: <Download className="w-5 h-5 text-authority" /> },
            { label: 'الفورمز النشطة', val: forms.length, icon: <ClipboardList className="w-5 h-5 text-authority" /> },
            { label: 'إجمالي البيانات والردود', val: leads.length + formSubmissions.length, icon: <Users className="w-5 h-5 text-authority" /> },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-2xl p-5 border border-authority/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-luminance/60 mb-1">{stat.label}</p>
                <p className="font-display font-bold text-3xl text-white">{stat.val}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-authority/15 border border-authority/30 flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 border-b border-authority/20 pb-4">
          <button
            onClick={() => setActiveTab('magnets')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'magnets'
                ? 'bg-authority text-white shadow-[0_0_25px_rgba(139,92,246,0.35)]'
                : 'glass text-luminance/70 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>ملفات الليد ماجنت ({magnets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'forms'
                ? 'bg-authority text-white shadow-[0_0_25px_rgba(139,92,246,0.35)]'
                : 'glass text-luminance/70 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>إنشاء وإدارة الفورمز ({forms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('testimonials')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'testimonials'
                ? 'bg-authority text-white shadow-[0_0_25px_rgba(139,92,246,0.35)]'
                : 'glass text-luminance/70 hover:text-white'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>شهادات العملاء و Calendly ({(siteSettings.testimonials || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'submissions'
                ? 'bg-authority text-white shadow-[0_0_25px_rgba(139,92,246,0.35)]'
                : 'glass text-luminance/70 hover:text-white'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>ردود الفورمز ({formSubmissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'leads'
                ? 'bg-authority text-white shadow-[0_0_25px_rgba(139,92,246,0.35)]'
                : 'glass text-luminance/70 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>بيانات تحميل الملفات ({leads.length})</span>
          </button>
        </div>

        {/* ===================== TAB 1: LEAD MAGNETS ===================== */}
        {activeTab === 'magnets' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Upload Form (5 cols) */}
            <div className="lg:col-span-5 glass rounded-2xl p-6 md:p-8 border border-authority/25">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-authority/20 border border-authority/40 flex items-center justify-center text-authority">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">رفع ملف ليد ماجنت جديد</h2>
                  <p className="text-xs text-luminance/55">يتم توليد لينك مشفر خاص بالملف تلقائياً</p>
                </div>
              </div>

              <form onSubmit={handleCreateMagnet} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-luminance/85 mb-2">
                    عنوان الملف (الذي يظهر للعميل داخل الصفحة) <span className="text-authority">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="مثال: دليل صناعة الريلز البيعية 2025"
                    required
                    className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-3 text-sm text-white placeholder-luminance/30 focus:outline-none focus:border-authority"
                  />
                </div>

                {/* Encrypted Link Notice */}
                <div className="rounded-xl bg-authority/10 border border-authority/25 px-4 py-3 flex items-center gap-2.5 text-xs text-luminance/85">
                  <ShieldCheck className="w-4 h-4 text-authority flex-shrink-0" />
                  <span>سيتم تشفير اسم الملف وتوليد رابط عشوائي مشفر تلقائياً (لا يظهر اسم الملف في اللينك).</span>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-luminance/85 mb-2">
                    وصف مختصر للملف (اختياري)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="اكتب نبذة سريعة تشجع الفئة المستهدفة على تحميل الملف..."
                    className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-3 text-sm text-white placeholder-luminance/30 focus:outline-none focus:border-authority resize-none"
                  />
                </div>

                {/* File Source Selector */}
                <div>
                  <label className="block text-xs font-medium text-luminance/85 mb-2">
                    مصدر الملف <span className="text-authority">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-void/90 border border-authority/20 mb-3">
                    <button
                      type="button"
                      onClick={() => setSourceType('upload')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        sourceType === 'upload'
                          ? 'bg-authority text-white'
                          : 'text-luminance/65 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع ملف من جهازك</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceType('external')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        sourceType === 'external'
                          ? 'bg-authority text-white'
                          : 'text-luminance/65 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>رابط خارجي (Drive إلخ)</span>
                    </button>
                  </div>

                  {sourceType === 'upload' ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-authority/35 hover:border-authority rounded-xl p-6 text-center cursor-pointer bg-void/50 hover:bg-authority/5 transition-all"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-authority mx-auto mb-2" />
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-bold text-white break-all">{selectedFile.name}</p>
                          <p className="text-xs text-authority mt-1">{formatBytes(selectedFile.size)}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-luminance">اضغط هنا لاختيار الملف من جهازك</p>
                          <p className="text-[11px] text-luminance/45 mt-1">
                            يدعم PDF, ZIP, MP4, DOCX, PNG وجميع صيغ الملفات
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      dir="ltr"
                      value={externalUrl}
                      onChange={e => setExternalUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-3 text-sm text-white placeholder-luminance/30 focus:outline-none focus:border-authority font-mono"
                    />
                  )}
                </div>

                {/* Download Mode (Direct vs Lead Capture) */}
                <div className="rounded-xl bg-void/70 border border-authority/20 p-4 space-y-4">
                  <label className="block text-xs font-bold text-luminance">
                    نظام التحميل للفئة المستهدفة:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRequireLead(false)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-right transition-all ${
                        !requireLead
                          ? 'bg-authority/20 border-authority text-white'
                          : 'bg-depth/40 border-authority/15 text-luminance/65 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                        <Unlock className="w-3.5 h-3.5 text-authority" />
                        <span>تحميل مباشر</span>
                      </div>
                      <span className="text-[11px] text-luminance/60 leading-snug">
                        يفتح اللينك ويحمل الملف فوراً بضغطة زر
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRequireLead(true)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-right transition-all ${
                        requireLead
                          ? 'bg-authority/20 border-authority text-white'
                          : 'bg-depth/40 border-authority/15 text-luminance/65 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                        <Users className="w-3.5 h-3.5 text-authority" />
                        <span>يطلب بيانات العميل</span>
                      </div>
                      <span className="text-[11px] text-luminance/60 leading-snug">
                        يكتب إيميله الحقيقي وبياناته أولاً
                      </span>
                    </button>
                  </div>

                  {requireLead && (
                    <div className="pt-2 border-t border-authority/15 space-y-2.5">
                      <p className="text-[11px] text-luminance/70 font-medium">الحقول المطلوبة من العميل:</p>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={collectName}
                            onChange={e => setCollectName(e.target.checked)}
                            className="accent-authority w-4 h-4 rounded"
                          />
                          <span>الاسم</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={collectEmail}
                            onChange={e => setCollectEmail(e.target.checked)}
                            className="accent-authority w-4 h-4 rounded"
                          />
                          <span>البريد الإلكتروني (مع تنبيه إرسال الفايل للإيميل)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={collectPhone}
                            onChange={e => setCollectPhone(e.target.checked)}
                            className="accent-authority w-4 h-4 rounded"
                          />
                          <span>رقم الواتساب / الهاتف</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Button text */}
                <div>
                  <label className="block text-xs font-medium text-luminance/85 mb-2">
                    نص زر التحميل
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    placeholder="تحميل الملف الآن"
                    className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-2.5 text-sm text-white placeholder-luminance/30 focus:outline-none focus:border-authority"
                  />
                </div>

                {submitting && uploadProgress > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-luminance">
                      <span>جاري رفع وتشفير الملف...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-void rounded-full overflow-hidden">
                      <div
                        className="h-full bg-authority transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 leading-relaxed">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-authority hover:bg-crown text-white font-bold py-3.5 px-6 transition-all duration-300 shadow-[0_0_30px_rgba(139,92,246,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'جاري الحفظ والتشفير...' : 'رفع الملف وتوليد اللينك المشفر'}</span>
                </button>
              </form>
            </div>

            {/* Uploaded Magnets List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">الملفات واللينكات المشفرة الجاهزة للمشاركة</h2>
                {loadingData && <span className="text-xs text-authority">جاري التحديث...</span>}
              </div>

              {magnets.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-authority/20">
                  <FileText className="w-12 h-12 text-authority/50 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-white mb-1">لا توجد ملفات مرفوعة حتى الآن</h3>
                  <p className="text-xs text-luminance/60 max-w-sm mx-auto">
                    قم برفع أول ملف Lead Magnet من النموذج الجانبي وسيظهر لك اللينك المشفر هنا لمشاركته مع جمهورك.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {magnets.map(magnet => {
                    const shareUrl = getMagnetShareUrl(magnet)
                    const isCopied = copiedId === magnet.id
                    const magnetLeadsCount = leads.filter(l => l.magnetId === magnet.id).length

                    return (
                      <div
                        key={magnet.id}
                        className="glass rounded-2xl p-6 border border-authority/25 hover:border-authority/50 transition-all space-y-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-authority/20 border border-authority/40 text-authority font-mono text-[11px] font-bold">
                                {magnet.fileType || 'FILE'}
                              </span>
                              {magnet.fileSize > 0 && (
                                <span className="text-xs text-luminance/50 font-mono">
                                  {formatBytes(magnet.fileSize)}
                                </span>
                              )}
                              <button
                                onClick={() => handleToggleLeadMode(magnet)}
                                title="اضغط للتبديل بين التحميل المباشر وطلب بيانات العميل"
                                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                                  magnet.requireLead
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                                }`}
                              >
                                {magnet.requireLead ? (
                                  <>
                                    <Users className="w-3 h-3" />
                                    <span>يطلب بيانات العميل (اضغط للتغيير)</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3" />
                                    <span>تحميل مباشر (اضغط للتغيير)</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <h3 className="text-lg font-bold text-white">{magnet.title}</h3>
                            {magnet.description && (
                              <p className="text-xs text-luminance/65 leading-relaxed max-w-xl">
                                {magnet.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRegenerateSlug(magnet)}
                              className="inline-flex items-center gap-1 text-xs text-luminance/70 hover:text-white bg-void/70 border border-authority/25 hover:border-authority px-3 py-2 rounded-xl transition-colors"
                              title="تغيير وتوليد كود مشفر جديد للينك"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-authority" />
                              <span>تشفير جديد</span>
                            </button>
                            <a
                              href={`/d/${magnet.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-luminance hover:text-white bg-void/70 border border-authority/25 hover:border-authority px-3.5 py-2 rounded-xl transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-authority" />
                              <span>معاينة</span>
                            </a>
                            <button
                              onClick={() => handleDeleteMagnet(magnet.id, magnet.title)}
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/25 text-red-300 transition-colors"
                              title="حذف الملف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Encrypted Share Link Box */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-void/85 border border-authority/25 rounded-xl p-3">
                          <div className="flex items-center gap-2 overflow-hidden px-2" dir="ltr">
                            <Lock className="w-3.5 h-3.5 text-authority flex-shrink-0" />
                            <span className="font-mono text-xs text-luminance truncate">
                              {shareUrl}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyUrl(magnet.id, shareUrl)}
                            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                              isCopied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-authority hover:bg-crown text-white'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>تم نسخ اللينك المشفر!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ اللينك المشفر</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-authority/15 text-xs text-luminance/65">
                          <div className="flex items-center gap-5">
                            <span className="inline-flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-authority" />
                              <span>المشاهدات:</span>
                              <strong className="text-white font-mono">{magnet.views || 0}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Download className="w-3.5 h-3.5 text-authority" />
                              <span>التحميلات:</span>
                              <strong className="text-white font-mono">{magnet.downloads || 0}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-authority" />
                              <span>المسجلين:</span>
                              <strong className="text-white font-mono">{magnetLeadsCount}</strong>
                            </span>
                          </div>
                          <span className="text-[11px] text-luminance/40">
                            {new Date(magnet.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: CUSTOM FORMS BUILDER & LIST ===================== */}
        {activeTab === 'forms' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Form Builder (6 cols) */}
            <div className="lg:col-span-6 glass rounded-2xl p-6 md:p-8 border border-authority/25">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-authority/20 border border-authority/40 flex items-center justify-center text-authority">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {editingFormId
                        ? editingIsMainFunnel
                          ? 'تعديل فورم الصفحة الرئيسية (Funnel)'
                          : 'تعديل الفورم والخيارات'
                        : 'إنشاء فورم جديد للمشاركة'}
                    </h2>
                    <p className="text-xs text-luminance/55">
                      {editingFormId
                        ? 'عدّل الأسئلة أو الخيارات أو النصوص ثم اضغط حفظ التعديلات'
                        : 'أنشئ فورم بعنوان وأسئلة مخصصة وشاركه بلينك مشفر لتستقبل الردود هنا'}
                    </p>
                  </div>
                </div>

                {editingFormId && (
                  <button
                    type="button"
                    onClick={handleCancelEditForm}
                    className="text-xs text-red-300 hover:text-white bg-red-500/15 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <form onSubmit={handleCreateCustomForm} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-luminance/85 mb-2">
                    عنوان الفورم <span className="text-authority">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customFormTitle}
                    onChange={e => setCustomFormTitle(e.target.value)}
                    placeholder="مثال: استمارة طلب بناء البراند الشخصي"
                    className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-3 text-sm text-white placeholder-luminance/30 focus:outline-none focus:border-authority"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-luminance/85 mb-2">
                    وصف الفورم أو رسالة ترحيبية للعميل (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={customFormDesc}
                    onChange={e => setCustomFormDesc(e.target.value)}
                    placeholder="املأ البيانات التالية وسنتواصل معك خلال 24 ساعة..."
                    className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-3 text-sm text-white placeholder-luminance/30 focus:outline-none focus:border-authority resize-none"
                  />
                </div>

                {editingIsMainFunnel && (
                  <div className="rounded-xl bg-authority/10 border border-authority/35 p-4 space-y-2">
                    <label className="block text-xs font-bold text-white">
                      خيار الفلترة الذي يحوّل العميل للدليل المجاني بدلاً من التقويم:
                    </label>
                    <input
                      type="text"
                      value={disqualifyOption}
                      onChange={e => setDisqualifyOption(e.target.value)}
                      placeholder="أقل من $2,700"
                      className="w-full rounded-lg bg-void/90 border border-authority/30 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-authority"
                    />
                    <p className="text-[11px] text-luminance/70">
                      أي عميل يختار هذه الإجابة بالضبط سيتم تحويله تلقائياً لصفحة الـ Lead Magnet ولن يظهر له تقويم المواعيد.
                    </p>
                  </div>
                )}

                {/* Dynamic Fields Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-luminance">
                      أسئلة وحقول الفورم:
                    </label>
                    <button
                      type="button"
                      onClick={handleAddFieldRow}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-authority hover:text-white bg-authority/15 hover:bg-authority px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة سؤال / حقل جديد</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {customFields.map((fld, idx) => (
                      <div
                        key={fld.id}
                        className="rounded-xl bg-void/75 border border-authority/20 p-3.5 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-authority/15 text-authority font-mono text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={fld.label}
                            onChange={e => handleUpdateFieldRow(fld.id, 'label', e.target.value)}
                            placeholder="اكتب اسم الحقل أو السؤال (مثال: رابط حسابك على إنستجرام)"
                            className="flex-1 rounded-lg bg-depth/60 border border-authority/25 px-3 py-2 text-xs text-white placeholder-luminance/35 focus:outline-none focus:border-authority"
                          />
                          {customFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFieldRow(fld.id)}
                              className="p-2 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="حذف الحقل"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-luminance/60">نوع الإجابة:</span>
                            <select
                              value={fld.type}
                              onChange={e =>
                                handleUpdateFieldRow(
                                  fld.id,
                                  'type',
                                  e.target.value as FormField['type']
                                )
                              }
                              className="rounded-lg bg-depth border border-authority/25 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-authority"
                            >
                              <option value="text">نص قصير</option>
                              <option value="textarea">نص طويل / تفاصيل</option>
                              <option value="tel">رقم هاتف / واتساب</option>
                              <option value="email">بريد إلكتروني</option>
                              <option value="select">قائمة اختيارات</option>
                            </select>
                          </div>

                          <label className="flex items-center gap-1.5 text-xs text-luminance/80 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fld.required}
                              onChange={e =>
                                handleUpdateFieldRow(fld.id, 'required', e.target.checked)
                              }
                              className="accent-authority w-3.5 h-3.5 rounded"
                            />
                            <span>حقل إجباري</span>
                          </label>
                        </div>

                        {fld.type === 'select' && (
                          <div className="pr-8">
                            <input
                              type="text"
                              value={fld.optionsText}
                              onChange={e =>
                                handleUpdateFieldRow(fld.id, 'optionsText', e.target.value)
                              }
                              placeholder="اكتب الاختيارات مفصولة بفاصلة، مثال: أقل من $2,700, من $2,700 إلى $5,000"
                              className="w-full rounded-lg bg-depth/60 border border-authority/25 px-3 py-2 text-xs text-white placeholder-luminance/35 focus:outline-none focus:border-authority"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-luminance/85 mb-1.5">
                      نص زر الإرسال
                    </label>
                    <input
                      type="text"
                      value={customFormBtn}
                      onChange={e => setCustomFormBtn(e.target.value)}
                      className="w-full rounded-xl bg-void/80 border border-authority/25 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-authority"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-luminance/85 mb-1.5">
                      رسالة النجاح بعد التسجيل
                    </label>
                    <input
                      type="text"
                      value={customFormSuccessMsg}
                      onChange={e => setCustomFormSuccessMsg(e.target.value)}
                      className="w-full rounded-xl bg-void/80 border border-authority/25 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-authority"
                    />
                  </div>
                </div>

                {customFormError && (
                  <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    {customFormError}
                  </div>
                )}

                {customFormCreatedMsg && (
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{customFormCreatedMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creatingForm}
                  className="w-full rounded-xl bg-authority hover:bg-crown text-white font-bold py-3.5 px-6 transition-all duration-300 shadow-[0_0_30px_rgba(139,92,246,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {creatingForm
                      ? 'جاري الحفظ...'
                      : editingFormId
                      ? 'حفظ التعديلات على الفورم'
                      : 'إنشاء الفورم وتوليد اللينك المشفر'}
                  </span>
                </button>
              </form>
            </div>

            {/* Created Forms List (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <h2 className="text-lg font-bold text-white">الفورمز الجاهزة (بما فيها فورم الصفحة الرئيسية)</h2>

              {forms.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-authority/20">
                  <ClipboardList className="w-12 h-12 text-authority/50 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-white mb-1">لم تقم بإنشاء أي فورم بعد</h3>
                  <p className="text-xs text-luminance/60 max-w-sm mx-auto">
                    أنشئ أول فورم من النموذج الجانبي وانسخ اللينك المشفر لإرساله لعملائك، وستظهر جميع ردودهم في تبويب &quot;ردود الفورمز&quot;.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {forms.map(form => {
                    const isMainFunnel = Boolean(form.isMainFunnel || form.id === 'frm_funnel_main')
                    const shareUrl = isMainFunnel
                      ? `${typeof window !== 'undefined' ? window.location.origin : 'https://zyadmohamed.com'}/#book`
                      : getFormShareUrl(form)
                    const isCopied = copiedId === form.id
                    const count = formSubmissions.filter(s => s.formId === form.id).length

                    return (
                      <div
                        key={form.id}
                        className={`glass rounded-2xl p-6 border transition-all space-y-5 ${
                          isMainFunnel
                            ? 'border-authority/60 bg-authority/[0.04]'
                            : 'border-authority/25 hover:border-authority/50'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {isMainFunnel && (
                                <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                                  فورم الصفحة الرئيسية الأساسي (Funnel)
                                </span>
                              )}
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-authority/20 border border-authority/40 text-authority text-[11px] font-bold">
                                {form.fields.length} حقول / أسئلة
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white">{form.title}</h3>
                            {form.description && (
                              <p className="text-xs text-luminance/65 mt-1">{form.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditForm(form)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-authority hover:bg-crown px-3.5 py-2 rounded-xl transition-colors"
                            >
                              <span>تعديل الخيارات والحقول</span>
                            </button>
                            <a
                              href={isMainFunnel ? '/#book' : `/f/${form.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-luminance hover:text-white bg-void/70 border border-authority/25 hover:border-authority px-3.5 py-2 rounded-xl transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-authority" />
                              <span>معاينة</span>
                            </a>
                            {!isMainFunnel && (
                              <button
                                onClick={() => handleDeleteForm(form.id, form.title)}
                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/25 text-red-300 transition-colors"
                                title="حذف الفورم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Share Link */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-void/85 border border-authority/25 rounded-xl p-3">
                          <div className="flex items-center gap-2 overflow-hidden px-2" dir="ltr">
                            <Lock className="w-3.5 h-3.5 text-authority flex-shrink-0" />
                            <span className="font-mono text-xs text-luminance truncate">
                              {shareUrl}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyUrl(form.id, shareUrl)}
                            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                              isCopied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-authority hover:bg-crown text-white'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>تم نسخ اللينك!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ اللينك</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Stats & View Responses button */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-authority/15 text-xs text-luminance/65">
                          <div className="flex items-center gap-5">
                            <span className="inline-flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-authority" />
                              <span>المشاهدات:</span>
                              <strong className="text-white font-mono">{form.views || 0}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Inbox className="w-3.5 h-3.5 text-authority" />
                              <span>الردود المسجلة:</span>
                              <strong className="text-white font-mono">{count}</strong>
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedFormFilter(form.id)
                              setActiveTab('submissions')
                            }}
                            className="text-xs font-bold text-authority hover:underline"
                          >
                            عرض ردود هذا الفورم ←
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: FORM SUBMISSIONS ===================== */}
        {activeTab === 'submissions' && (
          <div className="glass rounded-2xl p-6 md:p-8 border border-authority/25 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-lg font-bold text-white">ردود الفورمز المستلمة</h2>
                <select
                  value={selectedFormFilter}
                  onChange={e => setSelectedFormFilter(e.target.value)}
                  className="rounded-xl bg-void border border-authority/30 px-4 py-2 text-xs text-white focus:outline-none focus:border-authority"
                >
                  <option value="all">كل الفورمز ({formSubmissions.length})</option>
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>

              {filteredSubmissions.length > 0 && (
                <button
                  onClick={handleExportSubmissionsCSV}
                  className="inline-flex items-center gap-2 bg-authority hover:bg-crown text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير الردود لملف Excel / CSV</span>
                </button>
              )}
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="w-12 h-12 text-authority/50 mx-auto mb-3" />
                <p className="text-sm font-bold text-white mb-1">لا توجد ردود مسجلة حتى الآن</p>
                <p className="text-xs text-luminance/60">
                  عندما يقوم أي شخص بملء أي فورم قمت بمشاركته، ستظهر جميع إجاباته بالتفصيل هنا.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredSubmissions.map(sub => {
                  const entries = Object.entries(sub.answers || {})
                  const phoneEntry = entries.find(
                    ([k, v]) =>
                      (k.includes('هاتف') || k.includes('واتساب') || k.includes('موبايل') || k.includes('رقم')) &&
                      /\d{7,}/.test(v)
                  )
                  const cleanPhone = phoneEntry ? phoneEntry[1].replace(/[^\d+]/g, '') : ''

                  return (
                    <div
                      key={sub.id}
                      className="rounded-2xl bg-void/75 border border-authority/25 p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-authority/15 pb-3">
                          <span className="text-xs font-bold bg-authority/20 border border-authority/35 text-luminance px-3 py-1 rounded-lg">
                            {sub.formTitle}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-luminance/45">
                              {new Date(sub.createdAt).toLocaleString('ar-EG')}
                            </span>
                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-1.5 rounded-lg text-red-300 hover:bg-red-500/20 transition-colors"
                              title="حذف الرد"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {entries.map(([question, answer]) => (
                            <div key={question} className="bg-depth/45 rounded-xl p-3 border border-authority/10">
                              <p className="text-[11px] text-authority font-bold mb-1">{question}</p>
                              <p className="text-sm text-white whitespace-pre-line break-words">
                                {answer || '—'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {cleanPhone && (
                        <div className="pt-2 border-t border-authority/15 flex justify-end">
                          <a
                            href={`https://wa.me/${cleanPhone.replace(/^\+/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-wa/20 text-wa text-xs font-bold hover:bg-wa hover:text-void transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>تواصل عبر واتساب</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: CAPTURED LEADS ===================== */}
        {activeTab === 'leads' && (
          <div className="glass rounded-2xl p-6 md:p-8 border border-authority/25 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-lg font-bold text-white">بيانات العملاء المسجلين لتحميل الملفات</h2>
                <select
                  value={selectedMagnetFilter}
                  onChange={e => setSelectedMagnetFilter(e.target.value)}
                  className="rounded-xl bg-void border border-authority/30 px-4 py-2 text-xs text-white focus:outline-none focus:border-authority"
                >
                  <option value="all">كل الملفات ({leads.length})</option>
                  {magnets.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {filteredLeads.length > 0 && (
                <button
                  onClick={handleExportLeadsCSV}
                  className="inline-flex items-center gap-2 bg-authority hover:bg-crown text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير لملف Excel / CSV</span>
                </button>
              )}
            </div>

            {filteredLeads.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-authority/50 mx-auto mb-3" />
                <p className="text-sm font-bold text-white mb-1">لا توجد بيانات مسجلة حتى الآن</p>
                <p className="text-xs text-luminance/60">
                  عند تفعيل خيار &quot;يطلب بيانات العميل&quot; على أي ملف ليد ماجنت، ستظهر بيانات وإيميل كل شخص يحمل الملف هنا.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-authority/20 text-xs text-authority">
                      <th className="py-3.5 px-4">الاسم</th>
                      <th className="py-3.5 px-4">البريد الإلكتروني</th>
                      <th className="py-3.5 px-4">رقم الهاتف / واتساب</th>
                      <th className="py-3.5 px-4">الملف المحمل</th>
                      <th className="py-3.5 px-4">التاريخ</th>
                      <th className="py-3.5 px-4">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-authority/10 text-sm">
                    {filteredLeads.map(lead => {
                      const cleanPhone = (lead.phone || '').replace(/[^\d+]/g, '')
                      return (
                        <tr key={lead.id} className="hover:bg-authority/5 transition-colors">
                          <td className="py-4 px-4 font-bold text-white">{lead.name}</td>
                          <td className="py-4 px-4 font-mono text-xs text-luminance">
                            {lead.email}
                          </td>
                          <td className="py-4 px-4 font-mono text-luminance" dir="ltr">
                            {lead.phone && lead.phone !== '—' ? (
                              <div className="inline-flex items-center gap-2">
                                <span>{lead.phone}</span>
                                <a
                                  href={`https://wa.me/${cleanPhone.replace(/^\+/, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-wa/20 text-wa text-[11px] font-ar hover:bg-wa hover:text-void transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>واتساب</span>
                                </a>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs bg-authority/15 border border-authority/30 text-luminance px-2.5 py-1 rounded-lg">
                              {lead.magnetTitle}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-luminance/55">
                            {new Date(lead.createdAt).toLocaleString('ar-EG')}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 rounded-lg text-red-300 hover:bg-red-500/20 transition-colors"
                              title="حذف"
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
        )}

        {/* ===================== TAB 5: TESTIMONIALS & CALENDLY SETTINGS ===================== */}
        {activeTab === 'testimonials' && (
          <div className="space-y-8">
            {settingsMsg && (
              <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/35 px-5 py-3.5 text-xs md:text-sm text-emerald-300 font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{settingsMsg}</span>
              </div>
            )}

            {/* Master Visibility & Calendly Controls */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Toggle 1: Show/Hide Testimonials Section */}
              <div className="glass rounded-2xl p-5 border border-authority/30 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-authority">التحكم في ظهور الشهادات</span>
                  <h3 className="text-base font-bold text-white">قسم شهادات ورسائل العملاء</h3>
                  <p className="text-xs text-luminance/65">
                    يمكنك إظهار قسم الشهادات في الموقع أو إخفاؤه بالكامل بضغطة زر في أي وقت.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() =>
                    saveSiteSettingsToServer({
                      ...siteSettings,
                      showTestimonialsSection: !siteSettings.showTestimonialsSection,
                    })
                  }
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    siteSettings.showTestimonialsSection
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/35 text-red-300'
                  }`}
                >
                  {siteSettings.showTestimonialsSection ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>ظاهر حالياً في الموقع (اضغط لإخفائه بالكامل)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>مخفي حالياً من الموقع (اضغط لإظهاره)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle 2: Show/Hide Proof Metric Cards */}
              <div className="glass rounded-2xl p-5 border border-authority/30 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-authority">التحكم في كروت الأرقام</span>
                  <h3 className="text-base font-bold text-white">كروت النتائج (+185K / +80M)</h3>
                  <p className="text-xs text-luminance/65">
                    إظهار أو إخفاء كروت الأرقام الثلاثة أعلى قسم الشهادات.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() =>
                    saveSiteSettingsToServer({
                      ...siteSettings,
                      showProofCards: !siteSettings.showProofCards,
                    })
                  }
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    siteSettings.showProofCards
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/35 text-red-300'
                  }`}
                >
                  {siteSettings.showProofCards ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>كروت الأرقام ظاهرة (اضغط للإخفاء)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>كروت الأرقام مخفية (اضغط للإظهار)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle 3: Direct Calendly vs Qualification Step */}
              <div className="glass rounded-2xl p-5 border border-authority/30 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-authority">عدد خطوات الحجز للعميل</span>
                  <h3 className="text-base font-bold text-white">طريقة عرض تقويم Calendly</h3>
                  <p className="text-xs text-luminance/65">
                    اختر بين عرض سؤال التأهيل السريع أولاً أو فتح تقويم Calendly مباشرة للعميل بدون أي أسئلة مسبقة.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() =>
                    saveSiteSettingsToServer({
                      ...siteSettings,
                      skipQualificationForm: !siteSettings.skipQualificationForm,
                    })
                  }
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    siteSettings.skipQualificationForm
                      ? 'bg-authority text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                      : 'bg-authority/15 border border-authority/35 text-luminance'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {siteSettings.skipQualificationForm
                      ? 'الوضع الحالي: عرض Calendly مباشرة (بدون فورم مسبق)'
                      : 'الوضع الحالي: سؤال تأهيل سريع ثم يفتح Calendly'}
                  </span>
                </button>
              </div>
            </div>

            {/* Calendly Link Editor */}
            <div className="glass rounded-2xl p-5 md:p-6 border border-authority/25 flex flex-col md:flex-row items-stretch md:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-white mb-2">
                  رابط تقويم Calendly المدمج في الموقع:
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={siteSettings.calendlyUrl || ''}
                  onChange={e =>
                    setSiteSettings(prev => ({ ...prev, calendlyUrl: e.target.value }))
                  }
                  placeholder="https://calendly.com/zyaddonga/30min?hide_gdpr_banner=1&primary_color=8b5cf6"
                  className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-xs md:text-sm font-mono text-white focus:outline-none focus:border-authority"
                />
              </div>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() =>
                  saveSiteSettingsToServer(siteSettings, 'تم حفظ رابط Calendly بنجاح!')
                }
                className="rounded-xl bg-authority hover:bg-crown text-white font-bold text-xs md:text-sm px-6 py-3.5 transition-all"
              >
                حفظ رابط Calendly
              </button>
            </div>

            {/* Testimonials Add / Edit + List */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Add / Edit Testimonial Form (5 cols) */}
              <div className="lg:col-span-5 glass rounded-2xl p-6 md:p-7 border border-authority/25">
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-authority/20 border border-authority/40 flex items-center justify-center text-authority">
                      <MessageSquareQuote className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-white">
                        {editingTestimonialId ? 'تعديل شهادة العميل' : 'إضافة شهادة عميل جديدة (Testimonial)'}
                      </h2>
                      <p className="text-xs text-luminance/55">
                        أضف شهادة نصية أو ارفع صورة سكرين شوت لرأي العميل
                      </p>
                    </div>
                  </div>
                  {editingTestimonialId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTestimonialId(null)
                        setTClientTag('')
                        setTBeforeAfter('')
                        setTQuotePreview('')
                        setTImageUrl('')
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-luminance hover:bg-white/20"
                    >
                      إلغاء
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveTestimonial} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-luminance/85 mb-1.5">
                      اسم العميل أو صفته ومجاله <span className="text-authority">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tClientTag}
                      onChange={e => setTClientTag(e.target.value)}
                      placeholder="مثال: مؤسس شركة استشارية — الرياض"
                      className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-3 text-xs md:text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-luminance/85 mb-1.5">
                      نص الشهادة (رأي العميل)
                    </label>
                    <textarea
                      rows={3}
                      value={tQuotePreview}
                      onChange={e => setTQuotePreview(e.target.value)}
                      placeholder="اكتب نص رسالة العميل أو رأيه هنا..."
                      className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-3 text-xs md:text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-luminance/85 mb-1.5">
                      النتيجة باختصار (اختياري — يظهر أسفل الشهادة)
                    </label>
                    <input
                      type="text"
                      value={tBeforeAfter}
                      onChange={e => setTBeforeAfter(e.target.value)}
                      placeholder="مثال: قبل: محتوى متقطع ← بعد: حضور مستمر واستفسارات أسبوعية"
                      className="w-full rounded-xl bg-void/80 border border-authority/25 px-4 py-3 text-xs md:text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-luminance/85 mb-1.5">
                      صورة سكرين شوت للشهادة (اختياري)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) handleTestimonialImageUpload(f)
                        }}
                        className="block w-full text-xs text-luminance/70 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-authority/20 file:text-authority hover:file:bg-authority/30"
                      />
                      {uploadingTestimonialImg && (
                        <p className="text-xs text-authority">جاري رفع الصورة...</p>
                      )}
                      {tImageUrl && (
                        <div className="flex items-center justify-between gap-2 bg-void/80 border border-authority/25 rounded-xl p-2">
                          <img
                            src={tImageUrl}
                            alt="Preview"
                            className="h-12 w-auto rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setTImageUrl('')}
                            className="text-xs text-red-300 hover:underline px-2"
                          >
                            إزالة الصورة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings || uploadingTestimonialImg}
                    className="w-full rounded-xl bg-authority hover:bg-crown text-white font-bold py-3.5 px-6 text-sm transition-all shadow-[0_0_25px_rgba(139,92,246,0.3)] disabled:opacity-50"
                  >
                    {editingTestimonialId ? 'حفظ تعديلات الشهادة' : 'إضافة الشهادة للموقع'}
                  </button>
                </form>
              </div>

              {/* List of Testimonials (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    الشهادات الحالية ({(siteSettings.testimonials || []).length})
                  </h2>
                  <span className="text-xs text-luminance/60">
                    يمكنك إخفاء أي شهادة مؤقتاً أو تعديلها أو حذفها
                  </span>
                </div>

                {(siteSettings.testimonials || []).length === 0 ? (
                  <div className="glass rounded-2xl p-10 text-center border border-authority/20">
                    <p className="text-sm font-bold text-white mb-1">لا توجد شهادات مضافة حالياً</p>
                    <p className="text-xs text-luminance/60">
                      أضف أول شهادة من النموذج المجاور لتظهر في الموقع.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {(siteSettings.testimonials || []).map(item => (
                      <div
                        key={item.id}
                        className={`glass rounded-2xl p-5 border transition-all ${
                          item.visible !== false
                            ? 'border-authority/30'
                            : 'border-white/10 opacity-60'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white">{item.clientTag}</h3>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                  item.visible !== false
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                                    : 'bg-white/10 text-luminance/60'
                                }`}
                              >
                                {item.visible !== false ? 'ظاهر في الموقع' : 'مخفي'}
                              </span>
                            </div>
                            {item.beforeAfter && (
                              <p className="text-xs text-authority mt-0.5">{item.beforeAfter}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleTestimonialVisible(item.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void border border-authority/30 text-xs text-luminance hover:text-white"
                            >
                              {item.visible !== false ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>إخفاء</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>إظهار</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEditTestimonial(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-authority/20 border border-authority/40 text-xs text-white hover:bg-authority"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTestimonial(item.id)}
                              className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {item.imageUrl && (
                          <div className="mb-3 rounded-xl overflow-hidden border border-authority/20 max-h-48 bg-void">
                            <img
                              src={item.imageUrl}
                              alt={item.clientTag}
                              className="h-36 w-auto object-contain mx-auto"
                            />
                          </div>
                        )}

                        {item.quotePreview && (
                          <p className="text-xs text-luminance/85 leading-relaxed bg-void/60 rounded-xl p-3.5 border border-authority/15">
                            {item.quotePreview}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit 3 Proof Metric Cards */}
                <div className="glass rounded-2xl p-5 md:p-6 border border-authority/25 space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">
                      تعديل كروت الأرقام الثلاثة (+185K / +80M / +7 سنوات)
                    </h3>
                    <button
                      type="button"
                      disabled={savingSettings}
                      onClick={() =>
                        saveSiteSettingsToServer(siteSettings, 'تم حفظ تعديلات كروت الأرقام!')
                      }
                      className="rounded-xl bg-authority hover:bg-crown text-white font-bold text-xs px-4 py-2 transition-all"
                    >
                      حفظ كروت الأرقام
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {(siteSettings.proofCards || []).map((card, idx) => (
                      <div
                        key={card.id || idx}
                        className="rounded-xl bg-void/70 border border-authority/25 p-3.5 space-y-2"
                      >
                        <input
                          type="text"
                          value={card.metric}
                          onChange={e => handleUpdateProofCard(idx, { metric: e.target.value })}
                          placeholder="+185,000"
                          className="w-full rounded-lg bg-void border border-authority/25 px-3 py-1.5 text-xs font-bold text-authority"
                        />
                        <input
                          type="text"
                          value={card.unit}
                          onChange={e => handleUpdateProofCard(idx, { unit: e.target.value })}
                          placeholder="متابع في 5 شهور فقط"
                          className="w-full rounded-lg bg-void border border-authority/25 px-3 py-1.5 text-xs font-bold text-white"
                        />
                        <textarea
                          rows={2}
                          value={card.desc}
                          onChange={e => handleUpdateProofCard(idx, { desc: e.target.value })}
                          className="w-full rounded-lg bg-void border border-authority/25 px-3 py-1.5 text-[11px] text-luminance/80 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
