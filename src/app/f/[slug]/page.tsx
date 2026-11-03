'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Send, AlertCircle, ClipboardList } from 'lucide-react'
import type { CustomForm } from '@/lib/storage'

export default function PublicFormPage({
  params,
}: {
  params: { slug: string }
}) {
  const [form, setForm] = useState<CustomForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundErr, setNotFoundErr] = useState(false)

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submittedMsg, setSubmittedMsg] = useState('')

  useEffect(() => {
    const loadForm = async () => {
      try {
        const search = typeof window !== 'undefined' ? window.location.search : ''
        const res = await fetch(`/api/forms/${encodeURIComponent(params.slug)}${search}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          setNotFoundErr(true)
          return
        }
        const data = await res.json()
        setForm(data.form)
      } catch {
        setNotFoundErr(true)
      } finally {
        setLoading(false)
      }
    }
    loadForm()
  }, [params.slug])

  const getFallbackParam = () => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('d')
  }

  const handleFieldChange = (label: string, val: string) => {
    setAnswers(prev => ({ ...prev, [label]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(params.slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          fallbackData: getFallbackParam(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'يرجى التأكد من ملء جميع الحقول المطلوبة')
        return
      }
      setSubmittedMsg(data.successMessage || 'تم استلام بياناتك بنجاح! شكراً لك.')
    } catch {
      setError('حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-6 font-ar cursor-auto"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-authority border-t-transparent animate-spin" />
          <p className="text-sm text-luminance/70">جاري تحميل الفورم...</p>
        </div>
      </main>
    )
  }

  if (notFoundErr || !form) {
    return (
      <main
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center font-ar cursor-auto"
      >
        <div className="glass max-w-md w-full rounded-2xl p-10 border border-authority/25 space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-authority/15 border border-authority/30 flex items-center justify-center text-authority mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">هذا الفورم غير متاح</h1>
          <p className="text-sm text-luminance/65 leading-relaxed">
            تأكد من صحة الرابط المرسل إليك، أو ربما تم إغلاق الفورم.
          </p>
          <Link
            href="/"
            className="inline-block w-full rounded-xl bg-authority hover:bg-crown text-white font-bold py-3.5 px-6 transition-all"
          >
            الذهاب للصفحة الرئيسية
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen flex flex-col justify-between px-6 py-10 font-ar cursor-auto relative overflow-hidden"
    >
      {/* Top Minimal Brand Header with Real Logo */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img
            src="/logo/logo-white.png"
            alt="APX"
            className="h-7 md:h-8 w-auto object-contain"
          />
        </Link>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-authority bg-authority/10 border border-authority/30 px-3 py-1 rounded-full">
          Official Form
        </span>
      </header>

      {/* Main Form Card */}
      <div className="my-12 max-w-xl w-full mx-auto">
        <div className="glass rounded-3xl p-8 md:p-12 border border-authority/30 shadow-[0_0_80px_rgba(139,92,246,0.18)] space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-authority/25 rounded-full blur-3xl pointer-events-none" />

          {submittedMsg ? (
            <div className="py-10 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-white">{submittedMsg}</h2>
              <p className="text-sm text-luminance/65">
                تم تسجيل إجابتك بنجاح لدى APX.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                  {form.title}
                </h1>
                {form.description && (
                  <p className="text-sm md:text-base text-luminance/75 leading-relaxed whitespace-pre-line">
                    {form.description}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 pt-2 border-t border-authority/20">
                {form.fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-luminance/90 mb-2">
                      {field.label}{' '}
                      {field.required && <span className="text-authority">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        rows={4}
                        required={field.required}
                        value={answers[field.label] || ''}
                        onChange={e => handleFieldChange(field.label, e.target.value)}
                        placeholder={field.placeholder || `اكتب ${field.label}...`}
                        className="w-full rounded-xl bg-void/85 border border-authority/30 px-4 py-3.5 text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority resize-none"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={answers[field.label] || ''}
                        onChange={e => handleFieldChange(field.label, e.target.value)}
                        className="w-full rounded-xl bg-void/85 border border-authority/30 px-4 py-3.5 text-sm text-white focus:outline-none focus:border-authority"
                      >
                        <option value="">اختر من القائمة...</option>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        dir={field.type === 'tel' || field.type === 'email' ? 'ltr' : 'rtl'}
                        required={field.required}
                        value={answers[field.label] || ''}
                        onChange={e => handleFieldChange(field.label, e.target.value)}
                        placeholder={
                          field.placeholder ||
                          (field.type === 'tel' ? '+966 50 000 0000' : `اكتب ${field.label}...`)
                        }
                        className={`w-full rounded-xl bg-void/85 border border-authority/30 px-4 py-3.5 text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority ${
                          field.type === 'tel' || field.type === 'email' ? 'text-right font-mono' : ''
                        }`}
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-authority hover:bg-crown text-white font-bold text-base py-4 px-8 transition-all duration-300 shadow-[0_0_35px_rgba(139,92,246,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'جاري الإرسال...' : form.buttonText || 'إرسال البيانات'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-luminance/40 font-ar">
        © 2025 APX — جميع الحقوق محفوظة.
      </footer>
    </main>
  )
}
