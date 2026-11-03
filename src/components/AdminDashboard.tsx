'use client'

import React, { useState, useEffect, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import {
  Upload,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  FileText,
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
  MessageSquareQuote,
  Edit3,
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
} from 'lucide-react'
import {
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PAGE_CONTENT,
  DEFAULT_MAIN_FUNNEL_FORM,
  DEFAULT_UNQUALIFIED_MESSAGE,
  type SiteSettings,
  type PageContent,
  type TestimonialItem,
  type ProofCardItem,
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

type AdminSection = 'leads' | 'form' | 'content' | 'magnets' | 'settings'

type ContentSubTab =
  | 'sec1_hero'
  | 'sec2_metrics'
  | 'sec3_problem'
  | 'sec4_system'
  | 'sec5_testimonials'
  | 'sec6_fit'
  | 'sec8_faq_booked'

export default function AdminDashboard({ initialAuth }: Props) {
  const [isAuthed, setIsAuthed] = useState(initialAuth)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Sidebar navigation state
  const [activeSection, setActiveSection] = useState<AdminSection>('leads')
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>('sec1_hero')

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
      const res = await fetch('/api/admin/magnets', { cache: 'no-store' })
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
      showErrorToast('تعذر رفع الصورة، حاول مرة أخرى.')
    } finally {
      setUploadingImage(false)
    }
    return null
  }

  // ==================== SAVE SITE SETTINGS / PAGE CONTENT ====================
  const saveSiteSettingsToServer = async (
    nextSettings: SiteSettings,
    successText = 'تم حفظ التعديلات بنجاح وتطبيقها في الموقع!'
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
        showErrorToast(data.error || 'حدث خطأ أثناء الحفظ')
      }
    } catch {
      showErrorToast('حدث خطأ في الاتصال بالخادم')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleRestoreDefaultPageContent = async () => {
    if (!window.confirm('هل أنت متأكد من استرجاع النصوص الافتراضية لجميع أقسام الصفحة؟')) {
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
        showSuccessToast('تم استرجاع النصوص الافتراضية للموقع بنجاح!')
      }
    } catch {
      showErrorToast('تعذر استرجاع الافتراضي')
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
      label: 'سؤال جديد',
      type: 'select',
      required: true,
      options: ['خيار 1', 'خيار 2'],
      optionItems: [
        { id: `opt_1_${Date.now()}`, text: 'خيار 1', qualified: true },
        { id: `opt_2_${Date.now()}`, text: 'خيار 2', qualified: true },
      ],
    }
    setMainForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
  }

  const handleDeleteFieldFromMainForm = (fieldId: string) => {
    if (mainForm.fields.length <= 1) {
      showErrorToast('يجب الإبقاء على حقل واحد على الأقل في الفورم')
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
        showSuccessToast('تم حفظ خيارات وإعدادات فورم التأهيل بنجاح!')
      } else {
        showErrorToast(data.error || 'حدث خطأ أثناء حفظ الفورم')
      }
    } catch {
      showErrorToast('حدث خطأ في الاتصال بالخادم')
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
      editingTestimonialId ? 'تم تحديث الشهادة بنجاح!' : 'تمت إضافة الشهادة الجديدة بنجاح!'
    )
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

  // ==================== LEAD MAGNET HANDLERS ====================
  const handleCreateMagnet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      showErrorToast('يرجى إدخال عنوان الملف')
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
          showErrorToast('يرجى اختيار ملف لرفعه')
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
            showErrorToast(uploadData.error || 'فشل رفع الملف')
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
          showErrorToast('يرجى إدخال رابط الملف الخارجي')
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
        showErrorToast(data.error || 'حدث خطأ أثناء حفظ البيانات')
      } else {
        showSuccessToast('تم رفع الملف وتوليد اللينك المشفر بنجاح!')
        setTitle('')
        setDescription('')
        setSelectedFile(null)
        setExternalUrl('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchDashboardData()
      }
    } catch {
      showErrorToast('حدث خطأ أثناء الرفع')
    } finally {
      setSubmittingMagnet(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteMagnet = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الملف؟')) return
    const res = await fetch(`/api/admin/magnets?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setMagnets(prev => prev.filter(m => m.id !== id))
      showSuccessToast('تم حذف الملف بنجاح')
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm('هل تريد حذف هذا الطلب؟')) return
    const res = await fetch(
      `/api/admin/forms?submissionId=${encodeURIComponent(submissionId)}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      setFormSubmissions(prev => prev.filter(s => s.id !== submissionId))
      showSuccessToast('تم حذف الطلب')
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('هل تريد حذف هذا السجل؟')) return
    const res = await fetch(`/api/admin/magnets?leadId=${encodeURIComponent(leadId)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setLeads(prev => prev.filter(l => l.id !== leadId))
      showSuccessToast('تم حذف السجل')
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
    isQualified: boolean | null // true = مؤهل, false = غير مؤهل, null = تحميل ملف
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
        sourceTitle: sub.formTitle || 'فورم التأهيل',
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
      sourceTitle: `تحميل: ${l.magnetTitle}`,
      isQualified: null,
      phone: l.phone || '',
      name: l.name || '',
      email: l.email || '',
      details: {
        الملف: l.magnetTitle,
        ...(l.name && l.name !== '—' ? { الاسم: l.name } : {}),
        ...(l.email && l.email !== '—' ? { الإيميل: l.email } : {}),
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
    const headers = ['الحالة', 'المصدر', 'رقم الواتساب', 'الاسم', 'الإيميل', 'التفاصيل والإجابات', 'التاريخ']
    const rows = filteredUnifiedRows.map(r => {
      const statusLabel =
        r.isQualified === true
          ? 'مؤهل'
          : r.isQualified === false
          ? 'غير مؤهل'
          : 'تحميل ملف'
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
        `"${new Date(r.createdAt).toLocaleString('ar-EG')}"`,
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

  // ===================== LOGIN VIEW =====================
  if (!isAuthed) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-6 py-12 font-ar bg-void text-luminance"
      >
        <div className="glass w-full max-w-md rounded-3xl p-8 md:p-10 border border-authority/30 shadow-[0_0_60px_rgba(139,92,246,0.18)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <img
                src="/logo/logo-white.png"
                alt="APX"
                className="h-7 w-auto object-contain mb-1.5"
              />
              <p className="text-xs text-authority font-medium">لوحة تحكم APX</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-authority/15 border border-authority/30 flex items-center justify-center text-authority">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">تسجيل دخول الأدمن</h1>
          <p className="text-sm text-luminance/65 mb-8 leading-relaxed">
            أدخل كلمة المرور للتحكم الكامل في الطلبات، خيارات الفورم، ومحتوى الموقع.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-luminance/80 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                required
                className="w-full rounded-xl bg-void/80 border border-authority/30 px-4 py-3.5 text-white placeholder-luminance/30 focus:outline-none focus:border-authority"
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
              className="w-full rounded-xl bg-authority hover:bg-crown text-white font-bold py-4 px-6 transition-all shadow-[0_0_25px_rgba(139,92,246,0.35)] disabled:opacity-50"
            >
              {authLoading ? 'جاري الدخول...' : 'دخول للوحة التحكم'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const sidebarItems: Array<{
    id: AdminSection
    label: string
    badge?: number
    icon: React.ReactNode
  }> = [
    {
      id: 'leads',
      label: 'الطلبات / Leads',
      badge: unifiedRows.length,
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'form',
      label: 'خيارات الفورم',
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: 'content',
      label: 'محتوى الصفحة',
      icon: <LayoutTemplate className="w-5 h-5" />,
    },
    {
      id: 'magnets',
      label: 'الـ Lead Magnets',
      badge: magnets.length,
      icon: <FolderOpen className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: <Settings className="w-5 h-5" />,
    },
  ]

  return (
    <div dir="rtl" className="min-h-screen bg-void text-luminance font-ar flex flex-col lg:flex-row">
      {/* ==================== SIDEBAR NAVIGATION ==================== */}
      <aside className="lg:w-72 bg-depth/60 border-b lg:border-b-0 lg:border-l border-authority/20 p-5 lg:p-6 flex flex-col justify-between lg:sticky lg:top-0 lg:h-screen">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center justify-between">
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <img
                src="/logo/logo-white.png"
                alt="APX"
                className="h-7 w-auto object-contain"
              />
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-authority/20 border border-authority/40 text-authority font-bold">
                Admin
              </span>
            </a>

            <button
              onClick={fetchDashboardData}
              title="تحديث البيانات"
              className="p-2 rounded-xl bg-void/70 border border-authority/25 text-luminance/75 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-authority' : ''}`} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
            {sidebarItems.map(item => {
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-authority text-white shadow-[0_0_25px_rgba(139,92,246,0.35)]'
                      : 'text-luminance/75 hover:bg-authority/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-lg font-mono ${
                        active ? 'bg-void/30 text-white' : 'bg-authority/15 text-authority'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="hidden lg:flex flex-col gap-2.5 pt-6 border-t border-authority/15">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-void/80 border border-authority/25 text-xs font-bold text-luminance hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-authority" />
            <span>معاينة الموقع الحي</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <main className="flex-1 p-5 md:p-8 lg:p-10 max-w-6xl w-full mx-auto space-y-6">
        {/* Global Confirmation / Error Banner */}
        {toastMsg && (
          <div className="sticky top-4 z-50 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-xl px-5 py-4 text-sm font-bold text-emerald-200 flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}
        {toastError && (
          <div className="sticky top-4 z-50 rounded-2xl bg-red-500/20 border border-red-500/40 backdrop-blur-xl px-5 py-4 text-sm font-bold text-red-200 flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{toastError}</span>
          </div>
        )}

        {/* =====================================================================
            SECTION 1: الطلبات / LEADS
        ===================================================================== */}
        {activeSection === 'leads' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">الطلبات والعملاء (Leads)</h1>
                <p className="text-xs md:text-sm text-luminance/65 mt-1">
                  جميع طلبات فورم التأهيل وتحميلات ملفات الـ Lead Magnets مع الفلترة والتصدير.
                </p>
              </div>

              {filteredUnifiedRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportFilteredCSV}
                  className="inline-flex items-center gap-2 rounded-2xl bg-authority hover:bg-crown text-white font-bold text-xs md:text-sm px-6 py-3.5 shadow-[0_0_25px_rgba(139,92,246,0.3)] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير CSV ({filteredUnifiedRows.length})</span>
                </button>
              )}
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass rounded-2xl p-4 border border-authority/25">
                <p className="text-xs text-luminance/60">إجمالي الطلبات</p>
                <p className="font-display font-bold text-2xl text-white mt-1">
                  {unifiedRows.length}
                </p>
              </div>
              <div className="glass rounded-2xl p-4 border border-emerald-500/30">
                <p className="text-xs text-emerald-300">عملاء مؤهلون</p>
                <p className="font-display font-bold text-2xl text-emerald-400 mt-1">
                  {unifiedRows.filter(r => r.isQualified === true).length}
                </p>
              </div>
              <div className="glass rounded-2xl p-4 border border-amber-500/30">
                <p className="text-xs text-amber-300">غير مؤهلين</p>
                <p className="font-display font-bold text-2xl text-amber-400 mt-1">
                  {unifiedRows.filter(r => r.isQualified === false).length}
                </p>
              </div>
              <div className="glass rounded-2xl p-4 border border-authority/25">
                <p className="text-xs text-luminance/60">تحميلات الملفات</p>
                <p className="font-display font-bold text-2xl text-authority mt-1">
                  {leads.length}
                </p>
              </div>
            </div>

            {/* Filter Pills + Search Box */}
            <div className="glass rounded-2xl p-4 border border-authority/25 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'qualified', label: 'مؤهل فقط' },
                  { id: 'unqualified', label: 'غير مؤهل فقط' },
                  { id: 'magnets', label: 'تحميلات الملفات' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLeadStatusFilter(tab.id as typeof leadStatusFilter)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      leadStatusFilter === tab.id
                        ? 'bg-authority text-white'
                        : 'bg-void/70 text-luminance/70 hover:text-white border border-authority/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-luminance/40 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={leadSearchQuery}
                  onChange={e => setLeadSearchQuery(e.target.value)}
                  placeholder="ابحث بالرقم، الاسم، الإيميل، أو الإجابة..."
                  className="w-full rounded-xl bg-void border border-authority/30 pr-10 pl-4 py-2.5 text-xs md:text-sm text-white placeholder-luminance/40 focus:outline-none focus:border-authority"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="glass rounded-3xl border border-authority/25 overflow-hidden">
              {filteredUnifiedRows.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Users className="w-10 h-10 text-authority/50 mx-auto" />
                  <p className="text-base font-bold text-white">لا توجد طلبات مطابقة للبحث</p>
                  <p className="text-xs text-luminance/60">
                    ستظهر هنا جميع طلبات الفورم وتحميلات الملفات فور تسجيلها.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-authority/20 bg-depth/50 text-xs text-authority">
                        <th className="py-4 px-4">الحالة</th>
                        <th className="py-4 px-4">رقم الواتساب</th>
                        <th className="py-4 px-4">الإجابات والتفاصيل</th>
                        <th className="py-4 px-4">التاريخ</th>
                        <th className="py-4 px-4">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-authority/15 text-xs md:text-sm">
                      {filteredUnifiedRows.map(row => {
                        const cleanPhone = (row.phone || '').replace(/[^\d+]/g, '')
                        return (
                          <tr key={row.id} className="hover:bg-authority/5 transition-colors">
                            <td className="py-4 px-4 whitespace-nowrap">
                              {row.isQualified === true ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>مؤهل</span>
                                </span>
                              ) : row.isQualified === false ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/35 text-red-300 text-xs font-bold">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>غير مؤهل</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-authority/20 border border-authority/40 text-luminance text-xs font-bold">
                                  <Download className="w-3.5 h-3.5" />
                                  <span>تحميل ملف</span>
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 font-mono whitespace-nowrap" dir="ltr">
                              {row.phone ? (
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-white font-bold">{row.phone}</span>
                                  {cleanPhone.length >= 7 && (
                                    <a
                                      href={`https://wa.me/${cleanPhone.replace(/^\+/, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/20 text-[#25D366] text-[11px] font-ar font-bold hover:bg-[#25D366] hover:text-void transition-colors"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>واتساب</span>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-luminance/40">—</span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(row.details)
                                  .filter(([k]) => k !== 'حالة التأهيل')
                                  .map(([k, v]) => (
                                    <div
                                      key={k}
                                      className="rounded-xl bg-void/80 border border-authority/20 px-3 py-1.5 text-xs"
                                    >
                                      <span className="text-luminance/55 ml-1">{k}:</span>
                                      <span className="text-white font-bold">{v}</span>
                                    </div>
                                  ))}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-xs text-luminance/60 whitespace-nowrap">
                              {new Date(row.createdAt).toLocaleString('ar-EG')}
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  row.sourceType === 'submission'
                                    ? handleDeleteSubmission(row.id)
                                    : handleDeleteLead(row.id)
                                }
                                className="p-2 rounded-xl text-red-300 hover:bg-red-500/20 transition-colors"
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
          </div>
        )}

        {/* =====================================================================
            SECTION 2: خيارات الفورم (QUALIFICATION FORM & OPTIONS)
        ===================================================================== */}
        {activeSection === 'form' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  إدارة خيارات فورم التأهيل
                </h1>
                <p className="text-xs md:text-sm text-luminance/65 mt-1">
                  أضف أو عدّل أو رتّب خيارات الفورم، وحدد لكل خيار ما إذا كان (مؤهل) أو (غير مؤهل).
                </p>
              </div>

              <button
                type="button"
                disabled={savingMainForm}
                onClick={handleSaveMainForm}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-authority hover:bg-crown text-white font-bold text-sm md:text-base px-8 py-4 shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{savingMainForm ? 'جاري الحفظ...' : 'حفظ خيارات وإعدادات الفورم'}</span>
              </button>
            </div>

            {/* Form Header Texts */}
            <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-5">
              <h2 className="text-lg font-bold text-white">عناوين قسم الحجز والفورم</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-luminance/80 mb-2">
                    عنوان قسم الحجز
                  </label>
                  <input
                    type="text"
                    value={mainForm.title}
                    onChange={e => setMainForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-authority"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-luminance/80 mb-2">
                    الوصف الفرعي تحت العنوان
                  </label>
                  <input
                    type="text"
                    value={mainForm.description}
                    onChange={e => setMainForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-authority"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-luminance/80 mb-2">
                    نص زر الإرسال والمتابعة
                  </label>
                  <input
                    type="text"
                    value={mainForm.buttonText}
                    onChange={e => setMainForm(prev => ({ ...prev, buttonText: e.target.value }))}
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-authority"
                  />
                </div>
              </div>
            </div>

            {/* Fields & Per-Option Qualification Editor */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">أسئلة وخيارات الفورم</h2>
                <button
                  type="button"
                  onClick={handleAddFieldToMainForm}
                  className="inline-flex items-center gap-2 rounded-xl bg-authority/20 hover:bg-authority text-white text-xs font-bold px-4 py-2.5 border border-authority/40 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة سؤال جديد</span>
                </button>
              </div>

              {mainForm.fields.map((field, fIdx) => {
                const optionItems = getFieldOptionItems(field)
                return (
                  <div
                    key={field.id}
                    className="glass rounded-3xl p-6 md:p-8 border border-authority/30 space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-authority/15 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-authority/20 border border-authority/40 flex items-center justify-center font-mono text-xs font-bold text-white">
                          {fIdx + 1}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {field.type === 'tel'
                            ? 'حقل رقم الواتساب (مع كود الدولة التلقائي)'
                            : field.type === 'select'
                            ? 'سؤال اختيارات (مع تحديد مؤهل / غير مؤهل لكل خيار)'
                            : 'حقل إدخال نصي'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMoveFieldInMainForm(fIdx, -1)}
                          disabled={fIdx === 0}
                          className="p-2 rounded-lg bg-void border border-authority/25 text-luminance/70 hover:text-white disabled:opacity-30"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveFieldInMainForm(fIdx, 1)}
                          disabled={fIdx === mainForm.fields.length - 1}
                          className="p-2 rounded-lg bg-void border border-authority/25 text-luminance/70 hover:text-white disabled:opacity-30"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFieldFromMainForm(field.id)}
                          className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25"
                          title="حذف السؤال"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-luminance/80 mb-2">
                          عنوان السؤال / الحقل
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => updateMainFormField(field.id, { label: e.target.value })}
                          className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-authority"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-luminance/80 mb-2">
                          نوع الحقل
                        </label>
                        <select
                          value={field.type}
                          onChange={e =>
                            updateMainFormField(field.id, {
                              type: e.target.value as FormField['type'],
                            })
                          }
                          className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-authority"
                        >
                          <option value="select">قائمة خيارات (مؤهل / غير مؤهل)</option>
                          <option value="tel">رقم واتساب (مع كود الدولة تلقائياً)</option>
                          <option value="text">نص قصير (مثل الاسم أو الحساب)</option>
                          <option value="email">بريد إلكتروني</option>
                          <option value="textarea">نص طويل</option>
                        </select>
                      </div>
                    </div>

                    {/* Individual Options Manager for Select Fields */}
                    {field.type === 'select' && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs md:text-sm font-bold text-authority">
                            خيارات السؤال (حدد &quot;مؤهل&quot; لفتح تقويم Calendly أو &quot;غير مؤهل&quot; للتحويل لصفحة الهدية):
                          </label>
                        </div>

                        <div className="space-y-2.5">
                          {optionItems.map((opt, oIdx) => (
                            <div
                              key={opt.id}
                              className="flex flex-wrap md:flex-nowrap items-center gap-2.5 bg-void/90 border border-authority/25 rounded-2xl p-3"
                            >
                              <span className="font-mono text-xs text-luminance/50 px-2">
                                #{oIdx + 1}
                              </span>

                              {/* Option Text Input */}
                              <input
                                type="text"
                                value={opt.text}
                                onChange={e =>
                                  handleUpdateOptionItem(field.id, opt.id, { text: e.target.value })
                                }
                                className="flex-1 min-w-[180px] rounded-xl bg-depth/60 border border-authority/25 px-3.5 py-2.5 text-xs md:text-sm text-white focus:outline-none focus:border-authority"
                              />

                              {/* Qualified / Unqualified Toggle */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateOptionItem(field.id, opt.id, {
                                    qualified: !opt.qualified,
                                  })
                                }
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                                  opt.qualified
                                    ? 'bg-emerald-500/20 border border-emerald-500/45 text-emerald-300'
                                    : 'bg-red-500/20 border border-red-500/45 text-red-300'
                                }`}
                              >
                                {opt.qualified ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>مؤهل (يفتح التقويم)</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    <span>غير مؤهل (يحوّل للهدية)</span>
                                  </>
                                )}
                              </button>

                              {/* Reorder Up/Down & Delete */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveOptionItem(field.id, oIdx, -1)}
                                  disabled={oIdx === 0}
                                  className="p-2 rounded-lg bg-depth/80 border border-authority/20 text-luminance/70 hover:text-white disabled:opacity-30"
                                  title="ترتيب لأعلى"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveOptionItem(field.id, oIdx, 1)}
                                  disabled={oIdx === optionItems.length - 1}
                                  className="p-2 rounded-lg bg-depth/80 border border-authority/20 text-luminance/70 hover:text-white disabled:opacity-30"
                                  title="ترتيب لأسفل"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOptionItem(field.id, opt.id)}
                                  className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25"
                                  title="حذف الخيار"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Single Option Row */}
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
                            placeholder="اكتب نص الخيار الجديد هنا..."
                            className="flex-1 rounded-xl bg-void border border-authority/30 px-4 py-3 text-xs md:text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOptionToField(field.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-authority hover:bg-crown text-white font-bold text-xs md:text-sm px-5 py-3 transition-all whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ إضافة خيار</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Unqualified Redirect & Custom Message Settings */}
            <div className="glass rounded-3xl p-6 md:p-8 border border-authority/35 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  إعدادات تحويل العميل &quot;غير المؤهل&quot;
                </h2>
                <p className="text-xs text-luminance/65 mt-1">
                  تظهر هذه الرسالة للعميل الذي يختار خياراً مضبوطاً على &quot;غير مؤهل&quot;، ويتم تحويله تلقائياً للصفحة المختارة بالأسفل.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-luminance/85 mb-2">
                    الرسالة التي تظهر لغير المؤهل
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
                    placeholder="للأسف حاليًا غير مؤهل للعمل معنا، وده هدية مجانية لك"
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-authority resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-luminance/85">
                    الصفحة التي يتحوّل لها غير المؤهل (اختر Lead Magnet أو اكتب رابطاً مخصصاً)
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
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-authority"
                  >
                    <option value="">
                      أول ملف Lead Magnet متاح تلقائياً (الافتراضي)
                    </option>
                    {magnets.map(m => (
                      <option key={m.id} value={m.slug}>
                        ملف Lead Magnet: {m.title} (/d/{m.slug})
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
                    placeholder="أو اكتب رابطاً مخصصاً مثل: /d/xxxxx أو https://..."
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-xs font-mono text-white placeholder-luminance/35 focus:outline-none focus:border-authority"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={savingMainForm}
                  onClick={handleSaveMainForm}
                  className="inline-flex items-center gap-2 rounded-2xl bg-authority hover:bg-crown text-white font-bold text-sm px-8 py-4 shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ جميع إعدادات وخيارات الفورم</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            SECTION 3: محتوى الصفحة (FULL PAGE CONTENT CMS)
        ===================================================================== */}
        {activeSection === 'content' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  تعديل محتوى ونصوص الموقع
                </h1>
                <p className="text-xs md:text-sm text-luminance/65 mt-1">
                  تحكم كامل في نصوص جميع أقسام الصفحة الرئيسية، الـ VSL، الشهادات، الأسئلة الشائعة، وصفحة /booked.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handleRestoreDefaultPageContent}
                  className="inline-flex items-center gap-2 rounded-2xl bg-void border border-authority/35 hover:border-authority text-luminance hover:text-white font-bold text-xs md:text-sm px-5 py-3.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>استرجاع الافتراضي</span>
                </button>

                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() => saveSiteSettingsToServer(siteSettings)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-authority hover:bg-crown text-white font-bold text-sm md:text-base px-8 py-3.5 shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات فوراً'}</span>
                </button>
              </div>
            </div>

            {/* Section Sub-Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-authority/20 pb-4">
              {[
                { id: 'sec1_hero', label: '1. الـ Hero والـ VSL' },
                { id: 'sec2_metrics', label: '2. الأرقام والشركاء' },
                { id: 'sec3_problem', label: '3. قسم المشكلة' },
                { id: 'sec4_system', label: '4. خطوات العمل والمؤسس' },
                { id: 'sec5_testimonials', label: '5. النتائج والشهادات' },
                { id: 'sec6_fit', label: '6. مناسب / غير مناسب لك' },
                { id: 'sec8_faq_booked', label: '7 & 8. الأسئلة الشائعة وصفحة /booked' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setContentSubTab(t.id as ContentSubTab)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    contentSubTab === t.id
                      ? 'bg-authority text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                      : 'glass text-luminance/70 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* SUB-TAB 1: HERO & VSL */}
            {contentSubTab === 'sec1_hero' && (
              <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-5">
                <h2 className="text-lg font-bold text-white">القسم 1: الهيدر، العنوان الرئيسي، وفيديو الـ VSL</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      نص زر الحجز في الهيدر العلوي
                    </label>
                    <input
                      type="text"
                      value={pageContent.headerCtaText}
                      onChange={e => updatePageContent({ headerCtaText: e.target.value })}
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      الشارة أعلى العنوان (Eyebrow)
                    </label>
                    <input
                      type="text"
                      value={pageContent.eyebrowText}
                      onChange={e => updatePageContent({ eyebrowText: e.target.value })}
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      العنوان الرئيسي (الجزء الأول)
                    </label>
                    <input
                      type="text"
                      value={pageContent.heroTitle}
                      onChange={e => updatePageContent({ heroTitle: e.target.value })}
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      تكملة العنوان الرئيسي (الجزء الملون)
                    </label>
                    <input
                      type="text"
                      value={pageContent.heroTitleHighlight}
                      onChange={e => updatePageContent({ heroTitleHighlight: e.target.value })}
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-authority font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-luminance/80 mb-2">
                    الفقرة التوضيحية تحت العنوان الرئيسي
                  </label>
                  <textarea
                    rows={2}
                    value={pageContent.heroSubtitle}
                    onChange={e => updatePageContent({ heroSubtitle: e.target.value })}
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-authority/15">
                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      رابط فيديو الـ VSL المباشر (MP4 / WebM)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={pageContent.vslVideoUrl}
                      onChange={e => updatePageContent({ vslVideoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      صورة غلاف الـ VSL (Poster Image)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={pageContent.vslPosterUrl}
                        onChange={e => updatePageContent({ vslPosterUrl: e.target.value })}
                        placeholder="رابط الصورة أو ارفعها من الزر..."
                        className="flex-1 rounded-xl bg-void border border-authority/30 px-3 py-3 text-xs font-mono text-white"
                      />
                      <label className="cursor-pointer rounded-xl bg-authority/20 hover:bg-authority text-white text-xs font-bold px-4 py-3 border border-authority/40 whitespace-nowrap">
                        <span>{uploadingImage ? 'جاري الرفع...' : 'رفع صورة'}</span>
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
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      النص المكتوب داخل صندوق الـ VSL
                    </label>
                    <input
                      type="text"
                      value={pageContent.vslCaption}
                      onChange={e => updatePageContent({ vslCaption: e.target.value })}
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      نص زر الحجز الرئيسي تحت الفيديو
                    </label>
                    <input
                      type="text"
                      value={pageContent.heroCtaText}
                      onChange={e => updatePageContent({ heroCtaText: e.target.value })}
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      النص الصغير أسفل الزر
                    </label>
                    <input
                      type="text"
                      value={pageContent.heroSubCtaText}
                      onChange={e => updatePageContent({ heroSubCtaText: e.target.value })}
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: METRICS & BRANDS */}
            {contentSubTab === 'sec2_metrics' && (
              <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-6">
                <h2 className="text-lg font-bold text-white">القسم 2: شريط الأرقام والعلامات التجارية</h2>

                <div className="grid md:grid-cols-3 gap-4">
                  {(pageContent.heroMetrics || []).map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-void/70 border border-authority/25 p-4 space-y-3"
                    >
                      <label className="block text-xs text-authority font-bold">
                        الرقم الإحصائي #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={m.num}
                        onChange={e => {
                          const next = [...pageContent.heroMetrics]
                          next[idx] = { ...next[idx], num: e.target.value }
                          updatePageContent({ heroMetrics: next })
                        }}
                        placeholder="+80M"
                        className="w-full rounded-xl bg-void border border-authority/30 px-3 py-2 text-sm font-bold text-white"
                      />
                      <input
                        type="text"
                        value={m.label}
                        onChange={e => {
                          const next = [...pageContent.heroMetrics]
                          next[idx] = { ...next[idx], label: e.target.value }
                          updatePageContent({ heroMetrics: next })
                        }}
                        placeholder="مشاهدة أورجانيك"
                        className="w-full rounded-xl bg-void border border-authority/30 px-3 py-2 text-xs text-luminance"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-authority/15">
                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-2">
                      عنوان شريط العلامات التجارية
                    </label>
                    <input
                      type="text"
                      value={pageContent.brandsLabel}
                      onChange={e => updatePageContent({ brandsLabel: e.target.value })}
                      className="w-full max-w-md rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                    />
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
                          placeholder="الاسم بالعربي"
                          className="rounded-xl bg-void border border-authority/30 px-3.5 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={b.nameEn}
                          onChange={e => {
                            const next = [...pageContent.partnerBrands]
                            next[idx] = { ...next[idx], nameEn: e.target.value }
                            updatePageContent({ partnerBrands: next })
                          }}
                          placeholder="Name in English"
                          className="rounded-xl bg-void border border-authority/30 px-3.5 py-2 text-xs text-authority font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = pageContent.partnerBrands.filter((_, i) => i !== idx)
                            updatePageContent({ partnerBrands: next })
                          }}
                          className="p-2 rounded-lg bg-red-500/15 text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updatePageContent({
                          partnerBrands: [
                            ...(pageContent.partnerBrands || []),
                            { nameAr: 'علامة جديدة', nameEn: 'Brand' },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-authority/20 text-white text-xs font-bold px-4 py-2.5 border border-authority/40"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ إضافة علامة تجارية</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: PROBLEM */}
            {contentSubTab === 'sec3_problem' && (
              <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-5">
                <h2 className="text-lg font-bold text-white">القسم 3: المشكلة (The Challenge)</h2>
                <div>
                  <label className="block text-xs font-bold text-luminance/80 mb-2">
                    العنوان الرئيسي لقسم المشكلة
                  </label>
                  <input
                    type="text"
                    value={pageContent.problemHeading}
                    onChange={e => updatePageContent({ problemHeading: e.target.value })}
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {(pageContent.problemPoints || []).map((pt, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-void/70 border border-authority/25 p-4 space-y-3"
                    >
                      <span className="font-mono text-xs text-authority font-bold">
                        نقطة #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={pt.title}
                        onChange={e => {
                          const next = [...pageContent.problemPoints]
                          next[idx] = { ...next[idx], title: e.target.value }
                          updatePageContent({ problemPoints: next })
                        }}
                        className="w-full rounded-xl bg-void border border-authority/30 px-3 py-2 text-sm font-bold text-white"
                      />
                      <textarea
                        rows={3}
                        value={pt.body}
                        onChange={e => {
                          const next = [...pageContent.problemPoints]
                          next[idx] = { ...next[idx], body: e.target.value }
                          updatePageContent({ problemPoints: next })
                        }}
                        className="w-full rounded-xl bg-void border border-authority/30 px-3 py-2 text-xs text-luminance resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 4: SYSTEM STEPS & FOUNDER */}
            {contentSubTab === 'sec4_system' && (
              <div className="space-y-6">
                <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-5">
                  <h2 className="text-lg font-bold text-white">القسم 4: خطوات العمل (How It Works)</h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-2">
                        عنوان قسم خطوات العمل
                      </label>
                      <input
                        type="text"
                        value={pageContent.systemHeading}
                        onChange={e => updatePageContent({ systemHeading: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-2">
                        الوصف الفرعي تحت العنوان
                      </label>
                      <input
                        type="text"
                        value={pageContent.systemSubheading}
                        onChange={e => updatePageContent({ systemSubheading: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {(pageContent.systemSteps || []).map((st, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-void/70 border border-authority/25 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-authority font-bold">
                            خطوة #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={st.tag}
                            onChange={e => {
                              const next = [...pageContent.systemSteps]
                              next[idx] = { ...next[idx], tag: e.target.value }
                              updatePageContent({ systemSteps: next })
                            }}
                            className="w-32 rounded-lg bg-void border border-authority/30 px-2.5 py-1 text-[11px] font-mono text-authority"
                          />
                        </div>
                        <input
                          type="text"
                          value={st.title}
                          onChange={e => {
                            const next = [...pageContent.systemSteps]
                            next[idx] = { ...next[idx], title: e.target.value }
                            updatePageContent({ systemSteps: next })
                          }}
                          className="w-full rounded-xl bg-void border border-authority/30 px-3 py-2 text-sm font-bold text-white"
                        />
                        <textarea
                          rows={3}
                          value={st.body}
                          onChange={e => {
                            const next = [...pageContent.systemSteps]
                            next[idx] = { ...next[idx], body: e.target.value }
                            updatePageContent({ systemSteps: next })
                          }}
                          className="w-full rounded-xl bg-void border border-authority/30 px-3 py-2 text-xs text-luminance resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Founder Card Editor */}
                <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-4">
                  <h2 className="text-lg font-bold text-white">بطاقة المؤسس (Founder Section)</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        الاسم بالعربي
                      </label>
                      <input
                        type="text"
                        value={pageContent.founderInfo.nameAr}
                        onChange={e =>
                          updatePageContent({
                            founderInfo: { ...pageContent.founderInfo, nameAr: e.target.value },
                          })
                        }
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        الاسم بالإنجليزي
                      </label>
                      <input
                        type="text"
                        value={pageContent.founderInfo.nameEn}
                        onChange={e =>
                          updatePageContent({
                            founderInfo: { ...pageContent.founderInfo, nameEn: e.target.value },
                          })
                        }
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        المسمى الوظيفي
                      </label>
                      <input
                        type="text"
                        value={pageContent.founderInfo.roleAr}
                        onChange={e =>
                          updatePageContent({
                            founderInfo: { ...pageContent.founderInfo, roleAr: e.target.value },
                          })
                        }
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                      النبذة التعريفية للمؤسس
                    </label>
                    <textarea
                      rows={2}
                      value={pageContent.founderInfo.bio}
                      onChange={e =>
                        updatePageContent({
                          founderInfo: { ...pageContent.founderInfo, bio: e.target.value },
                        })
                      }
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 5: PROOF & TESTIMONIALS */}
            {contentSubTab === 'sec5_testimonials' && (
              <div className="space-y-6">
                <div className="glass rounded-3xl p-6 border border-authority/25 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-white">
                      القسم 5: النتائج وشهادات العملاء (Testimonials)
                    </h2>

                    <div className="flex flex-wrap gap-2">
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
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-red-500/15 border border-red-500/35 text-red-300'
                        }`}
                      >
                        {siteSettings.showTestimonialsSection ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>قسم الشهادات ظاهر (اضغط للإخفاء)</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>قسم الشهادات مخفي (اضغط للإظهار)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSiteSettings(prev => ({
                            ...prev,
                            showProofCards: !prev.showProofCards,
                          }))
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          siteSettings.showProofCards
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-red-500/15 border border-red-500/35 text-red-300'
                        }`}
                      >
                        {siteSettings.showProofCards ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>كروت الأرقام ظاهرة</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>كروت الأرقام مخفية</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        عنوان قسم النتائج والشهادات
                      </label>
                      <input
                        type="text"
                        value={pageContent.proofHeading}
                        onChange={e => updatePageContent({ proofHeading: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        عنوان فرعي للشهادات
                      </label>
                      <input
                        type="text"
                        value={pageContent.testimonialsSubheading}
                        onChange={e => updatePageContent({ testimonialsSubheading: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        نص زر الحجز أسفل الشهادات
                      </label>
                      <input
                        type="text"
                        value={pageContent.proofCtaText}
                        onChange={e => updatePageContent({ proofCtaText: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* Proof Metric Cards */}
                  <div className="grid md:grid-cols-3 gap-3 pt-2">
                    {(siteSettings.proofCards || []).map((card, idx) => (
                      <div
                        key={card.id || idx}
                        className="rounded-xl bg-void/70 border border-authority/25 p-3.5 space-y-2"
                      >
                        <input
                          type="text"
                          value={card.metric}
                          onChange={e => {
                            const next = [...siteSettings.proofCards]
                            next[idx] = { ...next[idx], metric: e.target.value }
                            setSiteSettings(prev => ({ ...prev, proofCards: next }))
                          }}
                          className="w-full rounded-lg bg-void border border-authority/25 px-3 py-1.5 text-xs font-bold text-authority"
                        />
                        <input
                          type="text"
                          value={card.unit}
                          onChange={e => {
                            const next = [...siteSettings.proofCards]
                            next[idx] = { ...next[idx], unit: e.target.value }
                            setSiteSettings(prev => ({ ...prev, proofCards: next }))
                          }}
                          className="w-full rounded-lg bg-void border border-authority/25 px-3 py-1.5 text-xs font-bold text-white"
                        />
                        <textarea
                          rows={2}
                          value={card.desc}
                          onChange={e => {
                            const next = [...siteSettings.proofCards]
                            next[idx] = { ...next[idx], desc: e.target.value }
                            setSiteSettings(prev => ({ ...prev, proofCards: next }))
                          }}
                          className="w-full rounded-lg bg-void border border-authority/25 px-3 py-1.5 text-[11px] text-luminance/80 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add / Edit Testimonial + List */}
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 glass rounded-3xl p-6 border border-authority/25 space-y-4">
                    <h3 className="text-base font-bold text-white">
                      {editingTestimonialId ? 'تعديل الشهادة' : 'إضافة شهادة عميل جديدة'}
                    </h3>
                    <form onSubmit={handleSaveTestimonial} className="space-y-3.5">
                      <input
                        type="text"
                        required
                        value={tClientTag}
                        onChange={e => setTClientTag(e.target.value)}
                        placeholder="اسم العميل أو صفته (مثال: مؤسس شركة استشارية — الرياض)"
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-xs md:text-sm text-white"
                      />
                      <textarea
                        rows={3}
                        value={tQuotePreview}
                        onChange={e => setTQuotePreview(e.target.value)}
                        placeholder="نص الشهادة أو رأي العميل..."
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-xs md:text-sm text-white resize-none"
                      />
                      <input
                        type="text"
                        value={tBeforeAfter}
                        onChange={e => setTBeforeAfter(e.target.value)}
                        placeholder="النتيجة باختصار (اختياري)"
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-xs md:text-sm text-white"
                      />
                      <div>
                        <label className="block text-xs text-luminance/70 mb-1.5">
                          صورة سكرين شوت للشهادة (اختياري)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async e => {
                            const f = e.target.files?.[0]
                            if (f) {
                              const url = await uploadMediaFile(f)
                              if (url) setTImageUrl(url)
                            }
                          }}
                          className="block w-full text-xs text-luminance/70 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-authority/20 file:text-authority"
                        />
                        {tImageUrl && (
                          <div className="mt-2 flex items-center justify-between bg-void p-2 rounded-xl border border-authority/25">
                            <img src={tImageUrl} alt="Preview" className="h-10 rounded" />
                            <button
                              type="button"
                              onClick={() => setTImageUrl('')}
                              className="text-xs text-red-300"
                            >
                              حذف الصورة
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={savingSettings || uploadingImage}
                        className="w-full rounded-xl bg-authority hover:bg-crown text-white font-bold py-3 text-xs md:text-sm"
                      >
                        {editingTestimonialId ? 'حفظ تعديلات الشهادة' : '+ إضافة الشهادة'}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-7 space-y-3">
                    {(siteSettings.testimonials || []).map(item => (
                      <div
                        key={item.id}
                        className={`glass rounded-2xl p-4 border ${
                          item.visible !== false ? 'border-authority/30' : 'border-white/10 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-bold text-white">{item.clientTag}</p>
                            {item.beforeAfter && (
                              <p className="text-xs text-authority">{item.beforeAfter}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleTestimonialVisible(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-void border border-authority/25 text-xs text-luminance"
                            >
                              {item.visible !== false ? 'إخفاء' : 'إظهار'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTestimonialId(item.id)
                                setTClientTag(item.clientTag)
                                setTBeforeAfter(item.beforeAfter)
                                setTQuotePreview(item.quotePreview)
                                setTImageUrl(item.imageUrl || '')
                              }}
                              className="px-3 py-1.5 rounded-lg bg-authority/20 text-xs text-white"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTestimonial(item.id)}
                              className="p-1.5 rounded-lg bg-red-500/15 text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {item.quotePreview && (
                          <p className="text-xs text-luminance/80 bg-void/60 p-3 rounded-xl">
                            {item.quotePreview}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 6: FIT / NOT FIT ("هل هذه المنظومة مناسبة لك؟") */}
            {contentSubTab === 'sec6_fit' && (
              <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-6">
                <h2 className="text-lg font-bold text-white">
                  القسم 6: الفلترة السريعة (&quot;هل هذه المنظومة مناسبة لك؟&quot;)
                </h2>

                <div>
                  <label className="block text-xs font-bold text-luminance/80 mb-2">
                    العنوان الرئيسي للقسم
                  </label>
                  <input
                    type="text"
                    value={pageContent.fitHeading}
                    onChange={e => updatePageContent({ fitHeading: e.target.value })}
                    className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Column 1: Fit For List */}
                  <div className="rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/30 p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                        عنوان العمود الأول (المؤهل)
                      </label>
                      <input
                        type="text"
                        value={pageContent.fitYesTitle}
                        onChange={e => updatePageContent({ fitYesTitle: e.target.value })}
                        className="w-full rounded-xl bg-void border border-emerald-500/35 px-3.5 py-2.5 text-sm font-bold text-white"
                      />
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
                            className="flex-1 rounded-xl bg-void border border-authority/25 px-3.5 py-2.5 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = pageContent.fitForList.filter((_, i) => i !== idx)
                              updatePageContent({ fitForList: next })
                            }}
                            className="p-2 rounded-lg bg-red-500/15 text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updatePageContent({
                            fitForList: [...(pageContent.fitForList || []), 'نقطة جديدة...'],
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold px-4 py-2 border border-emerald-500/35"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ إضافة نقطة</span>
                      </button>
                    </div>
                  </div>

                  {/* Column 2: Not Fit For List */}
                  <div className="rounded-2xl bg-red-500/[0.03] border border-red-500/30 p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-red-300 mb-1.5">
                        عنوان العمود الثاني (غير المؤهل)
                      </label>
                      <input
                        type="text"
                        value={pageContent.fitNoTitle}
                        onChange={e => updatePageContent({ fitNoTitle: e.target.value })}
                        className="w-full rounded-xl bg-void border border-red-500/35 px-3.5 py-2.5 text-sm font-bold text-white"
                      />
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
                            className="flex-1 rounded-xl bg-void border border-authority/25 px-3.5 py-2.5 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = pageContent.notFitForList.filter((_, i) => i !== idx)
                              updatePageContent({ notFitForList: next })
                            }}
                            className="p-2 rounded-lg bg-red-500/15 text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updatePageContent({
                            notFitForList: [...(pageContent.notFitForList || []), 'نقطة جديدة...'],
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold px-4 py-2 border border-red-500/35"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ إضافة نقطة</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 8: FAQ, FOOTER & /BOOKED PAGE */}
            {contentSubTab === 'sec8_faq_booked' && (
              <div className="space-y-6">
                {/* FAQ & Footer */}
                <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">القسم 8: الأسئلة الشائعة (FAQ) والفوتر</h2>
                    <button
                      type="button"
                      onClick={() =>
                        updatePageContent({
                          faqItems: [
                            ...(pageContent.faqItems || []),
                            { q: 'سؤال جديد؟', a: 'الإجابة هنا...' },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-authority/20 text-white text-xs font-bold px-4 py-2.5 border border-authority/40"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ إضافة سؤال شائع</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(pageContent.faqItems || []).map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-void/70 border border-authority/25 p-4 space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={faq.q}
                            onChange={e => {
                              const next = [...pageContent.faqItems]
                              next[idx] = { ...next[idx], q: e.target.value }
                              updatePageContent({ faqItems: next })
                            }}
                            className="flex-1 rounded-xl bg-void border border-authority/30 px-3.5 py-2 text-sm font-bold text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = pageContent.faqItems.filter((_, i) => i !== idx)
                              updatePageContent({ faqItems: next })
                            }}
                            className="p-2 rounded-lg bg-red-500/15 text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={faq.a}
                          onChange={e => {
                            const next = [...pageContent.faqItems]
                            next[idx] = { ...next[idx], a: e.target.value }
                            updatePageContent({ faqItems: next })
                          }}
                          className="w-full rounded-xl bg-void border border-authority/30 px-3.5 py-2 text-xs text-luminance resize-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-authority/15">
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        شعار الفوتر (Tagline)
                      </label>
                      <input
                        type="text"
                        value={pageContent.footerTagline}
                        onChange={e => updatePageContent({ footerTagline: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        نص حقوق النشر في الفوتر
                      </label>
                      <input
                        type="text"
                        value={pageContent.footerCopyright}
                        onChange={e => updatePageContent({ footerCopyright: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* /booked Page Content */}
                <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-5">
                  <h2 className="text-lg font-bold text-white">
                    محتوى صفحة تأكيد الحجز (/booked)
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        العنوان الرئيسي في صفحة /booked
                      </label>
                      <input
                        type="text"
                        value={pageContent.bookedTitle}
                        onChange={e => updatePageContent({ bookedTitle: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        الوصف الفرعي في صفحة /booked
                      </label>
                      <input
                        type="text"
                        value={pageContent.bookedSubtitle}
                        onChange={e => updatePageContent({ bookedSubtitle: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        نص زر تأكيد الواتساب
                      </label>
                      <input
                        type="text"
                        value={pageContent.bookedWhatsappBtnText}
                        onChange={e => updatePageContent({ bookedWhatsappBtnText: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-luminance/80 mb-1.5">
                        نص الرسالة التلقائية التي تُرسل على واتساب
                      </label>
                      <input
                        type="text"
                        value={pageContent.bookedWhatsappMessage}
                        onChange={e => updatePageContent({ bookedWhatsappMessage: e.target.value })}
                        className="w-full rounded-xl bg-void border border-authority/30 px-4 py-2.5 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {(pageContent.bookedSteps || []).map((st, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-void/70 border border-authority/25 p-4 space-y-2"
                      >
                        <input
                          type="text"
                          value={st.title}
                          onChange={e => {
                            const next = [...pageContent.bookedSteps]
                            next[idx] = { ...next[idx], title: e.target.value }
                            updatePageContent({ bookedSteps: next })
                          }}
                          className="w-full rounded-xl bg-void border border-authority/30 px-3 py-2 text-xs font-bold text-white"
                        />
                        <textarea
                          rows={2}
                          value={st.desc}
                          onChange={e => {
                            const next = [...pageContent.bookedSteps]
                            next[idx] = { ...next[idx], desc: e.target.value }
                            updatePageContent({ bookedSteps: next })
                          }}
                          className="w-full rounded-xl bg-void border border-authority/30 px-3 py-2 text-xs text-luminance resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            SECTION 4: الـ LEAD MAGNETS
        ===================================================================== */}
        {activeSection === 'magnets' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                ملفات الـ Lead Magnets والروابط المشفرة
              </h1>
              <p className="text-xs md:text-sm text-luminance/65 mt-1">
                ارفع ملفات الهدايا المجانية لجمهورك المستهدف أو اربطها بتحويل العملاء غير المؤهلين.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Upload Magnet Form */}
              <div className="lg:col-span-5 glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-5">
                <h2 className="text-lg font-bold text-white">إضافة ملف Lead Magnet جديد</h2>

                <form onSubmit={handleCreateMagnet} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-luminance/85 mb-1.5">
                      عنوان الملف <span className="text-authority">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="مثال: دليل صناعة المحتوى البيعي 2025"
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-luminance/85 mb-1.5">
                      وصف مختصر للملف
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="ماذا سيستفيد العميل من هذا الملف؟"
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-sm text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-void border border-authority/20">
                    <button
                      type="button"
                      onClick={() => setSourceType('upload')}
                      className={`py-2.5 rounded-lg text-xs font-bold ${
                        sourceType === 'upload' ? 'bg-authority text-white' : 'text-luminance/60'
                      }`}
                    >
                      رفع ملف من جهازك
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceType('external')}
                      className={`py-2.5 rounded-lg text-xs font-bold ${
                        sourceType === 'external' ? 'bg-authority text-white' : 'text-luminance/60'
                      }`}
                    >
                      رابط خارجي (Drive / Notion)
                    </button>
                  </div>

                  {sourceType === 'upload' ? (
                    <div className="rounded-2xl border-2 border-dashed border-authority/35 bg-void/50 p-5 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-luminance/80 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-authority file:text-white"
                      />
                      {selectedFile && (
                        <p className="text-xs text-emerald-300 mt-2">
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
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3 text-xs font-mono text-white"
                    />
                  )}

                  <div className="rounded-xl bg-void/60 border border-authority/20 p-4 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-white">
                        طلب بيانات العميل قبل التحميل
                      </span>
                      <input
                        type="checkbox"
                        checked={requireLead}
                        onChange={e => setRequireLead(e.target.checked)}
                        className="w-4 h-4 accent-authority"
                      />
                    </label>

                    {requireLead && (
                      <div className="flex flex-wrap gap-4 pt-2 border-t border-authority/15 text-xs">
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={collectName}
                            onChange={e => setCollectName(e.target.checked)}
                            className="accent-authority"
                          />
                          <span>الاسم</span>
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={collectEmail}
                            onChange={e => setCollectEmail(e.target.checked)}
                            className="accent-authority"
                          />
                          <span>الإيميل</span>
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={collectPhone}
                            onChange={e => setCollectPhone(e.target.checked)}
                            className="accent-authority"
                          />
                          <span>رقم الواتساب</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingMagnet}
                    className="w-full rounded-2xl bg-authority hover:bg-crown text-white font-bold py-4 px-6 text-sm shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all disabled:opacity-50"
                  >
                    {submittingMagnet
                      ? uploadProgress > 0
                        ? `جاري الرفع ${uploadProgress}%...`
                        : 'جاري الحفظ...'
                      : 'رفع الملف وتوليد اللينك المشفر'}
                  </button>
                </form>
              </div>

              {/* List of Lead Magnets */}
              <div className="lg:col-span-7 space-y-4">
                {magnets.length === 0 ? (
                  <div className="glass rounded-3xl p-10 text-center border border-authority/20">
                    <FolderOpen className="w-10 h-10 text-authority/50 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">لا توجد ملفات مرفوعة حالياً</p>
                  </div>
                ) : (
                  magnets.map(magnet => (
                    <div
                      key={magnet.id}
                      className="glass rounded-2xl p-5 border border-authority/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-authority/20 text-authority font-mono text-[10px] font-bold">
                            {magnet.fileType}
                          </span>
                          <h3 className="text-base font-bold text-white">{magnet.title}</h3>
                        </div>
                        <p className="text-xs font-mono text-luminance/55" dir="ltr">
                          /d/{magnet.slug} · {magnet.downloads || 0} تحميل
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(magnet)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-authority hover:bg-crown text-white text-xs font-bold px-4 py-2.5"
                        >
                          {copiedId === magnet.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>نسخ اللينك</span>
                            </>
                          )}
                        </button>
                        <a
                          href={buildMagnetShareUrl(magnet)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-void border border-authority/25 text-luminance hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteMagnet(magnet.id)}
                          className="p-2.5 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            SECTION 5: الإعدادات (SETTINGS & CALENDLY)
        ===================================================================== */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">إعدادات الموقع و Calendly</h1>
                <p className="text-xs md:text-sm text-luminance/65 mt-1">
                  تحكم في رابط تقويم Calendly، طريقة الحجز، وإظهار/إخفاء الأقسام.
                </p>
              </div>

              <button
                type="button"
                disabled={savingSettings}
                onClick={() => saveSiteSettingsToServer(siteSettings)}
                className="inline-flex items-center gap-2 rounded-2xl bg-authority hover:bg-crown text-white font-bold text-sm px-8 py-4 shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all"
              >
                <Save className="w-5 h-5" />
                <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
              </button>
            </div>

            <div className="glass rounded-3xl p-6 md:p-8 border border-authority/25 space-y-6">
              <div>
                <label className="block text-xs md:text-sm font-bold text-white mb-2">
                  رابط تقويم Calendly المدمج في الصفحة الرئيسية
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={siteSettings.calendlyUrl}
                  onChange={e =>
                    setSiteSettings(prev => ({ ...prev, calendlyUrl: e.target.value }))
                  }
                  placeholder="https://calendly.com/zyaddonga/30min?hide_gdpr_banner=1&primary_color=8b5cf6"
                  className="w-full rounded-xl bg-void border border-authority/30 px-4 py-3.5 text-xs md:text-sm font-mono text-white"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl bg-void/70 border border-authority/25 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">طريقة عرض تقويم Calendly</h3>
                  <p className="text-xs text-luminance/65">
                    اختر بين عرض فورم التأهيل أولاً أو فتح تقويم Calendly مباشرة للعميل بدون أسئلة مسبقة.
                  </p>
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
                        ? 'bg-authority text-white'
                        : 'bg-authority/15 border border-authority/35 text-luminance'
                    }`}
                  >
                    {siteSettings.skipQualificationForm
                      ? 'الوضع الحالي: عرض Calendly مباشرة'
                      : 'الوضع الحالي: فورم التأهيل ثم Calendly'}
                  </button>
                </div>

                <div className="rounded-2xl bg-void/70 border border-authority/25 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">قسم شهادات العملاء</h3>
                  <p className="text-xs text-luminance/65">
                    إظهار أو إخفاء قسم شهادات ورسائل العملاء بالكامل من الصفحة الرئيسية.
                  </p>
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
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-500/15 border border-red-500/35 text-red-300'
                    }`}
                  >
                    {siteSettings.showTestimonialsSection ? 'ظاهر في الموقع' : 'مخفي من الموقع'}
                  </button>
                </div>

                <div className="rounded-2xl bg-void/70 border border-authority/25 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">كروت الأرقام والنتائج</h3>
                  <p className="text-xs text-luminance/65">
                    إظهار أو إخفاء كروت الأرقام الثلاثة (+185K / +80M / +7 سنوات).
                  </p>
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
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-500/15 border border-red-500/35 text-red-300'
                    }`}
                  >
                    {siteSettings.showProofCards ? 'ظاهرة في الموقع' : 'مخفية من الموقع'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-authority/15 flex items-center justify-between text-xs text-luminance/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-authority" />
                  <span>
                    وضع التخزين الحالي:{' '}
                    <strong className="text-white font-mono">{storageMode}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
