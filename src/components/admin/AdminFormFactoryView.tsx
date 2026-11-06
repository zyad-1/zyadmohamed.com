'use client'

import React, { useState, useMemo } from 'react'
import {
  Plus,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  ClipboardList,
  Briefcase,
  UserPlus,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Save,
  Eye,
  Users,
  MessageCircle,
  Download,
  Edit3,
  CheckCircle2,
  X,
} from 'lucide-react'
import type { CustomForm, FormField, FormSubmission } from '@/lib/storage'
import type { AdminLocale } from '@/modules/audit/i18n/adminDict'

interface AdminFormFactoryViewProps {
  adminLang: AdminLocale
  forms: CustomForm[]
  submissions: FormSubmission[]
  onRefresh: () => Promise<void>
  showSuccessToast: (msg: string) => void
  showErrorToast: (msg: string) => void
}

const HIRING_TEMPLATE_FIELDS_AR: FormField[] = [
  {
    id: 'fld_hire_name',
    label: 'الاسم الثلاثي بالكامل',
    type: 'text',
    placeholder: 'اكتب اسمك الثلاثي...',
    required: true,
  },
  {
    id: 'fld_hire_phone',
    label: 'رقم الواتساب للتواصل',
    type: 'tel',
    placeholder: 'رقم الهاتف',
    required: true,
  },
  {
    id: 'fld_hire_email',
    label: 'البريد الإلكتروني',
    type: 'email',
    placeholder: 'name@example.com',
    required: true,
  },
  {
    id: 'fld_hire_role',
    label: 'المسمى الوظيفي المتقدم له',
    type: 'select',
    required: true,
    options: [
      'Video Editor (مونتير ريلز وفيديوهات قصيرة)',
      'Creative Content Strategist (مخطط محتوى وكاتب سكربتات)',
      'Account Manager (مدير حسابات عملاء)',
      'Media Buyer (مشتري إعلانات وممول)',
      'Operations & Sales Specialist (مبيعات وتشغيل)',
    ],
  },
  {
    id: 'fld_hire_exp',
    label: 'عدد سنوات الخبرة العملية في المجال',
    type: 'select',
    required: true,
    options: ['أقل من سنة', 'من سنة إلى سنتين', 'من 3 إلى 5 سنوات', 'أكثر من 5 سنوات'],
  },
  {
    id: 'fld_hire_mode',
    label: 'نظام التفرغ المتاح لديك حالياً',
    type: 'select',
    required: true,
    options: [
      'متفرغ بالكامل (Full-Time)',
      'دوام جزئي (Part-Time)',
      'عمل بالمشروع أو القطعة (Freelance)',
    ],
  },
  {
    id: 'fld_hire_portfolio',
    label: 'رابط معرض الأعمال (Portfolio / Drive / Behance)',
    type: 'text',
    placeholder: 'https://drive.google.com/...',
    required: true,
  },
  {
    id: 'fld_hire_why',
    label: 'لماذا ترى نفسك الإضافة الأقوى لفريق APX؟ وما أقوى نتيجة حققتها سابقاً؟',
    type: 'textarea',
    placeholder: 'حدثنا باختصار عن خبرتك وأبرز أرقامك أو أعمالك...',
    required: true,
  },
]

const ONBOARDING_TEMPLATE_FIELDS_AR: FormField[] = [
  {
    id: 'fld_onb_name',
    label: 'اسم المؤسس / المسؤول عن المشروع',
    type: 'text',
    placeholder: 'الاسم الكامل...',
    required: true,
  },
  {
    id: 'fld_onb_phone',
    label: 'رقم الواتساب المباشر للمتابعة',
    type: 'tel',
    required: true,
  },
  {
    id: 'fld_onb_ig',
    label: 'رابط حساب إنستجرام الأساسي',
    type: 'text',
    placeholder: 'https://www.instagram.com/...',
    required: true,
  },
  {
    id: 'fld_onb_offer',
    label: 'ما هو العرض الأساسي (Core Offer) أو الخدمة الأهم التي تقدمها وما متوسط سعرها؟',
    type: 'textarea',
    placeholder: 'اشرح المنتج أو الخدمة الرئيسية وتفاصيل السعر...',
    required: true,
  },
  {
    id: 'fld_onb_audience',
    label: 'من هو العميل المثالي المستهدف (البلد، الفئة، والقدرة الشرائية)؟',
    type: 'textarea',
    placeholder: 'صف جمهورك المستهدف بدقة...',
    required: true,
  },
  {
    id: 'fld_onb_assets',
    label: 'رابط الهوية البصرية أو اللوجو والخطوط المعتمدة (إن وجد)',
    type: 'text',
    placeholder: 'https://drive.google.com/...',
    required: false,
  },
]

function encodeShareFallback(form: CustomForm): string {
  try {
    const compact = {
      id: form.id,
      t: form.title,
      d: form.description,
      bt: form.buttonText,
      sm: form.successMessage,
      f: form.fields.map(fld => ({
        id: fld.id,
        label: fld.label,
        type: fld.type,
        placeholder: fld.placeholder,
        required: fld.required,
        options: fld.options,
      })),
    }
    const json = JSON.stringify(compact)
    return btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  } catch {
    return ''
  }
}

export default function AdminFormFactoryView({
  adminLang,
  forms,
  submissions,
  onRefresh,
  showSuccessToast,
  showErrorToast,
}: AdminFormFactoryViewProps) {
  const isRtl = adminLang === 'ar'

  const customForms = useMemo(
    () =>
      forms.filter(
        f => f.id !== 'frm_funnel_main' && f.slug !== 'funnel-qualification' && !f.isMainFunnel
      ),
    [forms]
  )

  const [editingForm, setEditingForm] = useState<CustomForm | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null)
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('ALL')
  const [newOptionText, setNewOptionText] = useState<Record<string, string>>({})

  const customSubmissions = useMemo(() => {
    const customIds = new Set(customForms.map(f => f.id))
    const customSlugs = new Set(customForms.map(f => f.slug))
    return submissions.filter(
      s =>
        (customIds.has(s.formId) || customSlugs.has(s.formSlug)) &&
        s.formId !== 'frm_funnel_main' &&
        s.formSlug !== 'funnel-qualification'
    )
  }, [submissions, customForms])

  const filteredSubmissions = useMemo(() => {
    if (selectedFormFilter === 'ALL') return customSubmissions
    return customSubmissions.filter(
      s => s.formId === selectedFormFilter || s.formSlug === selectedFormFilter
    )
  }, [customSubmissions, selectedFormFilter])

  const startTemplate = (preset: 'hiring' | 'onboarding' | 'blank') => {
    setIsCreatingNew(true)
    if (preset === 'hiring') {
      setEditingForm({
        id: '',
        slug: '',
        title: isRtl
          ? 'نموذج الانضمام لفريق APX — التوظيف والتعيين'
          : 'Join the APX Team — Talent Application Form',
        description: isRtl
          ? 'نبحث دائماً عن النخبة في صناعة المحتوى، المونتاج، وإدارة النمو. املأ البيانات التالية بدقة وسيقوم فريقنا بمراجعة معرض أعمالك والتواصل معك.'
          : 'We are looking for top A-players in content strategy, editing, and growth. Complete the form below and attach your portfolio.',
        buttonText: isRtl ? 'إرسال طلب التوظيف الآن' : 'Submit Application',
        successMessage: isRtl
          ? 'تم استلام طلب الانضمام بنجاح! سيقوم فريق APX بمراجعة أعمالك والتواصل معك عبر الواتساب.'
          : 'Your application has been received! Our team will review your portfolio and reach out shortly.',
        fields: HIRING_TEMPLATE_FIELDS_AR.map(f => ({ ...f, id: `${f.id}_${Date.now()}` })),
        views: 0,
        submissionsCount: 0,
        createdAt: new Date().toISOString(),
      })
    } else if (preset === 'onboarding') {
      setEditingForm({
        id: '',
        slug: '',
        title: isRtl
          ? 'استمارة انطلاق الشراكة واستلام بيانات الحساب — APX'
          : 'Client Onboarding & Brand Discovery Form — APX',
        description: isRtl
          ? 'مرحباً بك في منظومة APX. يرجى تزويدنا بالمعلومات الأساسية التالية لنبدأ في بناء استراتيجية المحتوى ونظام الاستحواذ الخاص بك.'
          : 'Welcome to APX. Please complete the brand discovery questions below so our team can architect your content growth system.',
        buttonText: isRtl ? 'اعتماد وإرسال بيانات الانطلاق' : 'Submit Onboarding Data',
        successMessage: isRtl
          ? 'تم استلام بيانات الانطلاق بنجاح! فريقنا يعمل الآن على إعداد خطة العمل.'
          : 'Onboarding data received! Our team is now preparing your roadmap.',
        fields: ONBOARDING_TEMPLATE_FIELDS_AR.map(f => ({ ...f, id: `${f.id}_${Date.now()}` })),
        views: 0,
        submissionsCount: 0,
        createdAt: new Date().toISOString(),
      })
    } else {
      setEditingForm({
        id: '',
        slug: '',
        title: isRtl ? 'نموذج مخصص جديد' : 'New Custom Form',
        description: isRtl
          ? 'يرجى ملء البيانات المطلوبة بالأسفل بدقة.'
          : 'Please complete the required fields below.',
        buttonText: isRtl ? 'إرسال البيانات' : 'Submit Form',
        successMessage: isRtl
          ? 'تم استلام إجابتك بنجاح! شكراً لك.'
          : 'Your response has been recorded! Thank you.',
        fields: [
          {
            id: `fld_name_${Date.now()}`,
            label: isRtl ? 'الاسم الكامل' : 'Full Name',
            type: 'text',
            required: true,
          },
          {
            id: `fld_phone_${Date.now() + 1}`,
            label: isRtl ? 'رقم الواتساب' : 'WhatsApp Number',
            type: 'tel',
            required: true,
          },
        ],
        views: 0,
        submissionsCount: 0,
        createdAt: new Date().toISOString(),
      })
    }
  }

  const handleSaveEditor = async () => {
    if (!editingForm) return
    if (!editingForm.title.trim()) {
      showErrorToast(isRtl ? 'يرجى كتابة عنوان الفورم' : 'Please enter a form title')
      return
    }
    if (editingForm.fields.length === 0) {
      showErrorToast(isRtl ? 'يرجى إضافة حقل واحد على الأقل' : 'Please add at least one field')
      return
    }

    setSaving(true)
    try {
      const method = isCreatingNew ? 'POST' : 'PUT'
      const res = await fetch('/api/admin/forms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingForm),
      })
      const data = await res.json()
      if (!res.ok) {
        showErrorToast(data.error || (isRtl ? 'تعذر حفظ الفورم' : 'Failed to save form'))
        return
      }
      await onRefresh()
      setEditingForm(null)
      setIsCreatingNew(false)
      showSuccessToast(
        isRtl
          ? isCreatingNew
            ? 'تم إنشاء الفورم وتوليد رابط المشاركة بنجاح!'
            : 'تم تحديث الفورم بنجاح!'
          : isCreatingNew
          ? 'Form created and shareable link generated!'
          : 'Form updated successfully!'
      )
    } catch {
      showErrorToast(isRtl ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteForm = async (formId: string) => {
    if (
      !window.confirm(
        isRtl
          ? 'هل أنت متأكد من حذف هذا الفورم وجميع ردوده نهائياً؟'
          : 'Delete this form and all of its submissions?'
      )
    ) {
      return
    }
    try {
      const res = await fetch(`/api/admin/forms?formId=${encodeURIComponent(formId)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await onRefresh()
        showSuccessToast(isRtl ? 'تم حذف الفورم بنجاح' : 'Form deleted')
      }
    } catch {
      showErrorToast(isRtl ? 'تعذر حذف الفورم' : 'Failed to delete form')
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      const res = await fetch(`/api/admin/forms?submissionId=${encodeURIComponent(submissionId)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await onRefresh()
        showSuccessToast(isRtl ? 'تم حذف الرد' : 'Submission deleted')
      }
    } catch {
      showErrorToast(isRtl ? 'تعذر الحذف' : 'Failed to delete')
    }
  }

  const buildShareUrl = (form: CustomForm) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const fallback = encodeShareFallback(form)
    return `${origin}/f/${encodeURIComponent(form.slug)}${fallback ? `?d=${fallback}` : ''}`
  }

  const handleCopyLink = (form: CustomForm) => {
    const url = buildShareUrl(form)
    navigator.clipboard.writeText(url)
    setCopiedFormId(form.id)
    showSuccessToast(
      isRtl ? 'تم نسخ رابط الفورم الجاهز للمشاركة!' : 'Shareable form link copied!'
    )
    setTimeout(() => setCopiedFormId(null), 2500)
  }

  const updateEditorField = (fieldId: string, patch: Partial<FormField>) => {
    if (!editingForm) return
    setEditingForm({
      ...editingForm,
      fields: editingForm.fields.map(f => (f.id === fieldId ? { ...f, ...patch } : f)),
    })
  }

  const addEditorField = () => {
    if (!editingForm) return
    const nextField: FormField = {
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: isRtl ? 'سؤال جديد' : 'New Question',
      type: 'text',
      placeholder: '',
      required: true,
      options: isRtl ? ['خيار 1', 'خيار 2'] : ['Option 1', 'Option 2'],
    }
    setEditingForm({
      ...editingForm,
      fields: [...editingForm.fields, nextField],
    })
  }

  const removeEditorField = (fieldId: string) => {
    if (!editingForm || editingForm.fields.length <= 1) return
    setEditingForm({
      ...editingForm,
      fields: editingForm.fields.filter(f => f.id !== fieldId),
    })
  }

  const moveEditorField = (idx: number, dir: -1 | 1) => {
    if (!editingForm) return
    const target = idx + dir
    if (target < 0 || target >= editingForm.fields.length) return
    const list = [...editingForm.fields]
    const temp = list[idx]
    list[idx] = list[target]
    list[target] = temp
    setEditingForm({ ...editingForm, fields: list })
  }

  const addOptionToEditorField = (fieldId: string) => {
    if (!editingForm) return
    const txt = (newOptionText[fieldId] || '').trim()
    if (!txt) return
    const fld = editingForm.fields.find(f => f.id === fieldId)
    if (!fld) return
    const nextOptions = [...(fld.options || []), txt]
    updateEditorField(fieldId, { options: nextOptions })
    setNewOptionText(prev => ({ ...prev, [fieldId]: '' }))
  }

  const removeOptionFromEditorField = (fieldId: string, optIdx: number) => {
    if (!editingForm) return
    const fld = editingForm.fields.find(f => f.id === fieldId)
    if (!fld) return
    const nextOptions = (fld.options || []).filter((_, i) => i !== optIdx)
    updateEditorField(fieldId, { options: nextOptions })
  }

  const exportSubmissionsCsv = () => {
    if (filteredSubmissions.length === 0) return
    const allKeys = Array.from(
      new Set(filteredSubmissions.flatMap(s => Object.keys(s.answers || {})))
    )
    const headers = ['Form', 'Date', ...allKeys]
    const rows = filteredSubmissions.map(s => [
      s.formTitle,
      new Date(s.createdAt).toLocaleString('en-US'),
      ...allKeys.map(k => `"${String(s.answers?.[k] || '').replace(/"/g, '""')}"`),
    ])
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `apx-forms-responses-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Templates */}
      <div className="apx-bento-card p-6 space-y-5 border border-[#8B5CF6]/35">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 text-[#A78BFA] text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مصنع النماذج والروابط المستقلة' : 'APX Custom Form Factory'}</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {isRtl
                ? 'إنشاء نماذج التعيين والاستبيانات بهوية الموقع'
                : 'Shareable Branded Forms (Hiring, Onboarding & Custom)'}
            </h2>
            <p className="text-xs sm:text-sm text-[#E2D9F3]/65 mt-1">
              {isRtl
                ? 'صمّم أي فورم مخصص (مثل فورم التوظيف والتعيين أو استلام بيانات عميل) بنفس هوية وتأثيرات الموقع وانسخ رابطه المباشر لإرساله لأي شخص.'
                : 'Create custom standalone forms with the full APX visual identity and copy a direct shareable link for candidates or clients.'}
            </p>
          </div>
        </div>

        {/* 3 One-Click Starter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <button
            type="button"
            onClick={() => startTemplate('hiring')}
            className="text-start group rounded-2xl p-5 bg-[#120D1D]/90 hover:bg-[#191229] border border-[#8B5CF6]/30 hover:border-[#8B5CF6] transition-all flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#5E9E7E]/20 text-[#7BC4A0] border border-[#5E9E7E]/35">
                {isRtl ? 'قالب جاهز بضغطة واحدة' : '1-Click Preset'}
              </span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isRtl ? 'فورم تعيين وتوظيف (Hiring Form)' : 'Hiring & Talent Application Form'}
              </h3>
              <p className="text-xs text-[#E2D9F3]/60 mt-1 leading-relaxed">
                {isRtl
                  ? 'جاهز بحقول الاسم، الواتساب، التخصص، سنوات الخبرة، ورابط البورتفوليو لإرساله للمتقدمين.'
                  : 'Pre-built with Name, WhatsApp, Role, Experience, and Portfolio link for job applicants.'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => startTemplate('onboarding')}
            className="text-start group rounded-2xl p-5 bg-[#120D1D]/90 hover:bg-[#191229] border border-[#8B5CF6]/30 hover:border-[#8B5CF6] transition-all flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-[#C89D54]/20 border border-[#C89D54]/40 flex items-center justify-center text-[#E0B973] group-hover:scale-105 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#C89D54]/20 text-[#E0B973] border border-[#C89D54]/35">
                {isRtl ? 'قالب عملاء' : 'Client Preset'}
              </span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isRtl ? 'فورم استلام عميل جديد (Onboarding)' : 'Client Onboarding Discovery Form'}
              </h3>
              <p className="text-xs text-[#E2D9F3]/60 mt-1 leading-relaxed">
                {isRtl
                  ? 'استمارة جمع تفاصيل العرض الأساسي، الفئة المستهدفة، وروابط الهوية البصرية من العميل.'
                  : 'Collect core offer details, target audience, and brand assets from new clients.'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => startTemplate('blank')}
            className="text-start group rounded-2xl p-5 bg-[#120D1D]/90 hover:bg-[#191229] border border-[#8B5CF6]/30 hover:border-[#8B5CF6] transition-all flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/35">
                {isRtl ? 'تخصيص كامل' : 'Custom Builder'}
              </span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isRtl ? 'إنشاء فورم مخصص من الصفر' : 'Create Blank Custom Form'}
              </h3>
              <p className="text-xs text-[#E2D9F3]/60 mt-1 leading-relaxed">
                {isRtl
                  ? 'اختر الأسئلة ونوع الحقول (نص، اختيارات، رقم هاتف مع رمز الدولة، بريد) بحرية تامة.'
                  : 'Build any custom questionnaire with text, multiple-choice, phone, and email fields.'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Active Form Editor Drawer / Card */}
      {editingForm && (
        <div className="apx-bento-card p-6 border-2 border-[#8B5CF6] space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#8B5CF6]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isCreatingNew
                    ? isRtl
                      ? 'إعداد ونشر فورم جديد'
                      : 'Configure & Publish New Form'
                    : isRtl
                    ? `تعديل الفورم: ${editingForm.title}`
                    : `Editing Form: ${editingForm.title}`}
                </h3>
                <p className="text-xs text-[#E2D9F3]/60">
                  {isRtl
                    ? 'عدّل العناوين والأسئلة ثم اضغط حفظ لتوليد رابط المشاركة المباشر.'
                    : 'Customize headlines and fields, then click Save to generate the shareable link.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditingForm(null)
                  setIsCreatingNew(false)
                }}
                className="px-4 py-2.5 rounded-xl bg-[#080608] border border-[#8B5CF6]/30 text-xs font-bold text-[#E2D9F3]/75 hover:text-white flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>{isRtl ? 'إلغاء' : 'Cancel'}</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveEditor}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? isRtl
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : isRtl
                    ? 'حفظ الفورم وتفعيل الرابط'
                    : 'Save & Activate Link'}
                </span>
              </button>
            </div>
          </div>

          {/* Form Meta Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#E2D9F3]/85 mb-1.5">
                {isRtl ? 'عنوان الفورم الرئيسي' : 'Form Headline'}
              </label>
              <input
                type="text"
                value={editingForm.title}
                onChange={e => setEditingForm({ ...editingForm, title: e.target.value })}
                className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#E2D9F3]/85 mb-1.5">
                {isRtl ? 'نص زر الإرسال' : 'Submit Button Text'}
              </label>
              <input
                type="text"
                value={editingForm.buttonText}
                onChange={e => setEditingForm({ ...editingForm, buttonText: e.target.value })}
                className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#E2D9F3]/85 mb-1.5">
                {isRtl ? 'وصف الفورم التوضيحي تحت العنوان' : 'Form Description / Intro'}
              </label>
              <textarea
                rows={2}
                value={editingForm.description}
                onChange={e => setEditingForm({ ...editingForm, description: e.target.value })}
                className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6] resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#E2D9F3]/85 mb-1.5">
                {isRtl
                  ? 'رسالة النجاح بعد إرسال الفورم'
                  : 'Confirmation Message Shown After Submission'}
              </label>
              <input
                type="text"
                value={editingForm.successMessage}
                onChange={e => setEditingForm({ ...editingForm, successMessage: e.target.value })}
                className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#A78BFA]">
                {isRtl
                  ? `أسئلة وحقول الفورم (${editingForm.fields.length})`
                  : `Form Questions & Fields (${editingForm.fields.length})`}
              </h4>
              <button
                type="button"
                onClick={addEditorField}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] text-white text-xs font-bold px-4 py-2 border border-[#8B5CF6]/40 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'إضافة سؤال جديد' : 'Add Question'}</span>
              </button>
            </div>

            {editingForm.fields.map((fld, idx) => (
              <div
                key={fld.id}
                className="rounded-2xl bg-[#0C0814] border border-[#8B5CF6]/25 p-4 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center font-en text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#E2D9F3]/75 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fld.required}
                        onChange={e => updateEditorField(fld.id, { required: e.target.checked })}
                        className="accent-[#8B5CF6]"
                      />
                      <span>{isRtl ? 'حقل إجباري' : 'Required'}</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveEditorField(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-[#140D22] border border-[#8B5CF6]/25 text-[#E2D9F3]/70 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveEditorField(idx, 1)}
                      disabled={idx === editingForm.fields.length - 1}
                      className="p-1.5 rounded-lg bg-[#140D22] border border-[#8B5CF6]/25 text-[#E2D9F3]/70 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEditorField(fld.id)}
                      className="p-1.5 rounded-lg bg-[#B86B77]/15 border border-[#B86B77]/35 text-[#E598A4] hover:bg-[#B86B77]/25"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={fld.label}
                      onChange={e => updateEditorField(fld.id, { label: e.target.value })}
                      placeholder={isRtl ? 'عنوان السؤال...' : 'Question label...'}
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                  <div>
                    <select
                      value={fld.type}
                      onChange={e =>
                        updateEditorField(fld.id, { type: e.target.value as FormField['type'] })
                      }
                      className="w-full rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                    >
                      <option value="text">{isRtl ? 'نص قصير / رابط' : 'Short Text / Link'}</option>
                      <option value="textarea">
                        {isRtl ? 'فقرة نصية مفصلة' : 'Long Paragraph'}
                      </option>
                      <option value="tel">
                        {isRtl ? 'رقم هاتف مع كود الدولة' : 'Phone Number (Country Code)'}
                      </option>
                      <option value="email">{isRtl ? 'بريد إلكتروني' : 'Email Address'}</option>
                      <option value="select">
                        {isRtl ? 'اختيار من متعدد' : 'Multiple Choice'}
                      </option>
                    </select>
                  </div>
                </div>

                {fld.type === 'select' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap gap-2">
                      {(fld.options || []).map((opt, oIdx) => (
                        <span
                          key={`${fld.id}_opt_${oIdx}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#161024] border border-[#8B5CF6]/30 px-3 py-1.5 text-xs text-white"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => removeOptionFromEditorField(fld.id, oIdx)}
                            className="text-[#E598A4] hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newOptionText[fld.id] || ''}
                        onChange={e =>
                          setNewOptionText(prev => ({ ...prev, [fld.id]: e.target.value }))
                        }
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addOptionToEditorField(fld.id)
                          }
                        }}
                        placeholder={isRtl ? 'اكتب خياراً جديداً واضغط إضافة...' : 'New option...'}
                        className="flex-1 rounded-xl bg-[#080608] border border-[#8B5CF6]/25 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                      />
                      <button
                        type="button"
                        onClick={() => addOptionToEditorField(fld.id)}
                        className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold"
                      >
                        {isRtl ? 'إضافة خيار' : 'Add Option'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List of Created Custom Shareable Forms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#A78BFA]" />
            <span>
              {isRtl
                ? `النماذج والروابط المنشورة (${customForms.length})`
                : `Published Shareable Forms (${customForms.length})`}
            </span>
          </h3>
        </div>

        {customForms.length === 0 ? (
          <div className="apx-bento-card p-10 text-center space-y-3 border border-dashed border-[#8B5CF6]/30">
            <ClipboardList className="w-10 h-10 text-[#8B5CF6]/50 mx-auto" />
            <p className="text-sm sm:text-base font-bold text-white">
              {isRtl
                ? 'لم تقم بإنشاء أي فورم خارجي بعد'
                : 'No custom shareable forms created yet'}
            </p>
            <p className="text-xs text-[#E2D9F3]/60 max-w-md mx-auto">
              {isRtl
                ? 'اضغط على "فورم تعيين وتوظيف" بالأعلى لإنشاء أول نموذج جاهز بهوية الموقع ونسخ رابطه فوراً.'
                : 'Click one of the preset cards above (e.g. Hiring Form) to generate your first shareable form link.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customForms.map(frm => {
              const formSubsCount = submissions.filter(
                s => s.formId === frm.id || s.formSlug === frm.slug
              ).length
              const shareUrl = buildShareUrl(frm)
              return (
                <div
                  key={frm.id}
                  className="apx-bento-card p-5 flex flex-col justify-between gap-4 border border-[#8B5CF6]/25 hover:border-[#8B5CF6]/55 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-base font-bold text-white leading-snug">{frm.title}</h4>
                      <span className="font-en text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C4B5FD] whitespace-nowrap">
                        {frm.fields.length} {isRtl ? 'حقول' : 'fields'}
                      </span>
                    </div>
                    {frm.description && (
                      <p className="text-xs text-[#E2D9F3]/60 line-clamp-2 leading-relaxed">
                        {frm.description}
                      </p>
                    )}
                  </div>

                  {/* Stats & Actions */}
                  <div className="pt-3 border-t border-[#8B5CF6]/15 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs text-[#E2D9F3]/70">
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <strong className="font-en text-white">{frm.views || 0}</strong>
                        <span>{isRtl ? 'مشاهدة' : 'views'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#7BC4A0]" />
                        <strong className="font-en text-[#7BC4A0]">{formSubsCount}</strong>
                        <span>{isRtl ? 'ردود مسجلة' : 'responses'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(frm)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-all shadow-md shadow-[#8B5CF6]/25"
                      >
                        {copiedFormId === frm.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'تم النسخ' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'نسخ الرابط' : 'Copy Link'}</span>
                          </>
                        )}
                      </button>

                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-[#140D22] border border-[#8B5CF6]/30 text-[#C4B5FD] hover:text-white transition-colors"
                        title={isRtl ? 'معاينة الفورم' : 'Open Form'}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNew(false)
                          setEditingForm(frm)
                        }}
                        className="p-2 rounded-xl bg-[#140D22] border border-[#8B5CF6]/30 text-[#C4B5FD] hover:text-white transition-colors"
                        title={isRtl ? 'تعديل أسئلة الفورم' : 'Edit Form'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteForm(frm.id)}
                        className="p-2 rounded-xl bg-[#B86B77]/15 border border-[#B86B77]/30 text-[#E598A4] hover:bg-[#B86B77]/25 transition-colors"
                        title={isRtl ? 'حذف الفورم' : 'Delete Form'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Submissions Table for Custom Forms */}
      {customForms.length > 0 && (
        <div className="apx-bento-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isRtl
                  ? `ردود المتقدمين والعملاء على النماذج (${filteredSubmissions.length})`
                  : `Form Responses & Applications (${filteredSubmissions.length})`}
              </h3>
              <p className="text-xs text-[#E2D9F3]/60 mt-0.5">
                {isRtl
                  ? 'جميع الإجابات المرسلة عبر روابط النماذج المخصصة مع إمكانية التواصل المباشر عبر واتساب.'
                  : 'All responses submitted via your custom shareable forms.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedFormFilter}
                onChange={e => setSelectedFormFilter(e.target.value)}
                className="rounded-xl bg-[#080608] border border-[#8B5CF6]/30 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="ALL">
                  {isRtl ? 'جميع النماذج المخصصة' : 'All Custom Forms'}
                </option>
                {customForms.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>

              {filteredSubmissions.length > 0 && (
                <button
                  type="button"
                  onClick={exportSubmissionsCsv}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#140D22] border border-[#8B5CF6]/35 px-3.5 py-2 text-xs font-bold text-[#C4B5FD] hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
                </button>
              )}
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#E2D9F3]/55 bg-[#080608]/60 rounded-2xl border border-[#8B5CF6]/15">
              {isRtl
                ? 'لا توجد ردود مسجلة لهذا النموذج حتى الآن. انسخ رابط النموذج وشاركه لتبدأ الردود بالظهور هنا فوراً.'
                : 'No responses recorded for this form yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map(sub => {
                const phoneEntry = Object.entries(sub.answers || {}).find(
                  ([k, v]) =>
                    k.includes('هاتف') ||
                    k.includes('واتساب') ||
                    k.includes('تواصل') ||
                    k.toLowerCase().includes('phone') ||
                    k.toLowerCase().includes('whatsapp') ||
                    /^\+?\d[\d\s-]{7,}$/.test(String(v || ''))
                )
                const cleanPhone = phoneEntry
                  ? String(phoneEntry[1] || '').replace(/[^\d+]/g, '')
                  : ''

                return (
                  <div
                    key={sub.id}
                    className="rounded-2xl bg-[#09060E] border border-[#8B5CF6]/20 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5CF6]/15 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C4B5FD] text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{sub.formTitle}</span>
                        </span>
                        <span className="font-en text-xs text-[#E2D9F3]/50">
                          {new Date(sub.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {cleanPhone.length >= 7 && (
                          <a
                            href={`https://wa.me/${cleanPhone.replace(/^\+/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/35 text-[#4ADE80] text-xs font-bold hover:bg-[#25D366] hover:text-[#080608] transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'مراسلة واتساب' : 'WhatsApp'}</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(sub.id)}
                          className="p-1.5 rounded-xl text-[#E598A4] hover:bg-[#B86B77]/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {Object.entries(sub.answers || {}).map(([question, answer]) => {
                        const isUrl = /^https?:\/\//i.test(String(answer || '').trim())
                        return (
                          <div
                            key={question}
                            className="rounded-xl bg-[#120D1D]/85 border border-[#8B5CF6]/15 px-3.5 py-2.5 text-xs space-y-1"
                          >
                            <div className="text-[#A78BFA] font-bold">{question}</div>
                            {isUrl ? (
                              <a
                                href={String(answer).trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white underline hover:text-[#C4B5FD] break-all inline-flex items-center gap-1 font-en"
                              >
                                <span>{answer}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <div className="text-white font-medium whitespace-pre-wrap break-words">
                                {answer || '—'}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
