'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle2, Send, AlertCircle, ClipboardList, Sparkles, Check } from 'lucide-react'
import CountryPhoneInput from '@/components/CountryPhoneInput'
import { apxFontVariables } from '@/modules/audit/theme/fonts'
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

  const completionPct = useMemo(() => {
    if (!form || !form.fields.length) return 0
    const reqFields = form.fields.filter(f => f.required)
    const targetFields = reqFields.length > 0 ? reqFields : form.fields
    const filled = targetFields.filter(f => String(answers[f.label] || '').trim().length > 0).length
    return Math.round((filled / targetFields.length) * 100)
  }, [form, answers])

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
        className={`${apxFontVariables} min-h-screen flex items-center justify-center px-6 font-ar bg-[#07060B] text-white cursor-auto`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin" />
          <p className="text-sm text-[#E2D9F3]/70">جاري تحميل النموذج...</p>
        </div>
      </main>
    )
  }

  if (notFoundErr || !form) {
    return (
      <main
        dir="rtl"
        className={`${apxFontVariables} min-h-screen flex flex-col items-center justify-center px-6 text-center font-ar bg-[#07060B] text-white cursor-auto`}
      >
        <div className="max-w-md w-full rounded-3xl p-10 bg-[#110D1B]/90 border border-[#8B5CF6]/25 space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA] mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">هذا النموذج غير متاح</h1>
          <p className="text-sm text-[#E2D9F3]/65 leading-relaxed">
            تأكد من صحة الرابط المرسل إليك، أو ربما تم إغلاق النموذج.
          </p>
          <Link
            href="/"
            className="inline-block w-full rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold py-3.5 px-6 transition-all shadow-lg shadow-[#8B5CF6]/25"
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
      className={`${apxFontVariables} min-h-screen flex flex-col justify-between px-4 sm:px-6 py-8 sm:py-12 font-ar bg-[#07060B] text-white cursor-auto relative overflow-x-hidden`}
    >
      {/* Subtle Ambient Brand Glow */}
      <div className="fixed top-[-160px] left-1/2 -translate-x-1/2 w-[680px] h-[360px] bg-[#8B5CF6]/14 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Minimal Brand Header with Real Logo */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center group">
          <img
            src="/logo/logo-white.png"
            alt="APX"
            className="h-7 md:h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#C4B5FD] bg-[#8B5CF6]/12 border border-[#8B5CF6]/30 px-3.5 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>نموذج رسمي معتمد — APX</span>
        </span>
      </header>

      {/* Main Form Card */}
      <div className="my-8 sm:my-12 max-w-2xl w-full mx-auto relative z-10">
        <div className="rounded-3xl bg-[#100C1A]/90 backdrop-blur-xl p-6 sm:p-10 md:p-12 border border-[#8B5CF6]/30 shadow-[0_24px_80px_rgba(0,0,0,0.65)] space-y-8 relative overflow-hidden">
          {!submittedMsg && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#E2D9F3]/60 font-bold">
                <span>نسبة إكمال النموذج</span>
                <span className="font-en text-[#C4B5FD]">{completionPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1B142B] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          )}

          {submittedMsg ? (
            <div className="py-12 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-[#5E9E7E]/20 border border-[#5E9E7E]/45 flex items-center justify-center text-[#7BC4A0] mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-white leading-snug">{submittedMsg}</h2>
              <p className="text-sm text-[#E2D9F3]/65">
                تم تسجيل إجابتك وحفظها بنجاح في نظام APX.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                  {form.title}
                </h1>
                {form.description && (
                  <p className="text-sm sm:text-base text-[#E2D9F3]/70 leading-relaxed whitespace-pre-line">
                    {form.description}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-[#8B5CF6]/20">
                {form.fields.map((field, idx) => {
                  const currentVal = answers[field.label] || ''
                  const options = field.options || []

                  return (
                    <div key={field.id} className="space-y-2.5">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#F5F2FF]">
                        <span className="w-6 h-6 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center font-en text-[11px] text-[#C4B5FD] flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>
                          {field.label}{' '}
                          {field.required && <span className="text-[#A78BFA]">*</span>}
                        </span>
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          rows={4}
                          required={field.required}
                          value={currentVal}
                          onChange={e => handleFieldChange(field.label, e.target.value)}
                          placeholder={field.placeholder || `اكتب ${field.label}...`}
                          className="w-full rounded-2xl bg-[#08060C] border border-[#8B5CF6]/30 px-4 py-3.5 text-sm text-white placeholder-[#E2D9F3]/35 focus:outline-none focus:border-[#8B5CF6] resize-none transition-colors"
                        />
                      ) : field.type === 'select' && options.length <= 7 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {options.map(opt => {
                            const selected = currentVal === opt
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleFieldChange(field.label, opt)}
                                className={`w-full text-start rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold border transition-all flex items-center justify-between gap-3 ${
                                  selected
                                    ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-[0_0_25px_rgba(139,92,246,0.2)]'
                                    : 'bg-[#08060C] border-[#8B5CF6]/25 text-[#E2D9F3]/80 hover:border-[#8B5CF6]/55 hover:text-white'
                                }`}
                              >
                                <span>{opt}</span>
                                <span
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                    selected
                                      ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                                      : 'border-[#8B5CF6]/40'
                                  }`}
                                >
                                  {selected && <Check className="w-3 h-3" />}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ) : field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={currentVal}
                          onChange={e => handleFieldChange(field.label, e.target.value)}
                          className="w-full rounded-2xl bg-[#08060C] border border-[#8B5CF6]/30 px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                        >
                          <option value="">اختر من القائمة...</option>
                          {options.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'tel' ? (
                        <CountryPhoneInput
                          value={currentVal}
                          onChange={val => handleFieldChange(field.label, val)}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.type}
                          dir={
                            field.type === 'email' ||
                            field.placeholder?.startsWith('http') ||
                            field.label.toLowerCase().includes('link') ||
                            field.label.includes('رابط')
                              ? 'ltr'
                              : 'rtl'
                          }
                          required={field.required}
                          value={currentVal}
                          onChange={e => handleFieldChange(field.label, e.target.value)}
                          placeholder={field.placeholder || `اكتب ${field.label}...`}
                          className="w-full rounded-2xl bg-[#08060C] border border-[#8B5CF6]/30 px-4 py-3.5 text-sm text-white placeholder-[#E2D9F3]/35 focus:outline-none focus:border-[#8B5CF6] transition-colors"
                        />
                      )}
                    </div>
                  )
                })}

                {error && (
                  <div className="flex items-center gap-2 text-xs text-[#F2B8C0] bg-[#B86B77]/15 border border-[#B86B77]/40 rounded-2xl px-4 py-3.5 leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-bold text-base py-4 px-8 transition-all duration-300 shadow-[0_12px_35px_rgba(139,92,246,0.35)] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting ? 'جاري الإرسال...' : form.buttonText || 'إرسال البيانات'}
                  </span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto text-center text-xs text-[#E2D9F3]/40 font-ar relative z-10">
        © {new Date().getFullYear()} APX — جميع الحقوق محفوظة.
      </footer>
    </main>
  )
}
