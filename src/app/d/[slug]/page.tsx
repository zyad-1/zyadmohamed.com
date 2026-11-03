'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Download,
  FileText,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import CountryPhoneInput from '@/components/CountryPhoneInput'
import { DEFAULT_UNQUALIFIED_MESSAGE } from '@/lib/constants'

interface PublicMagnet {
  id: string
  slug: string
  title: string
  description: string
  fileName: string
  fileSize: number
  fileType: string
  requireLead: boolean
  collectFields: {
    name: boolean
    phone: boolean
    email: boolean
  }
  buttonText: string
  fileUrl: string | null
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

export default function LeadMagnetPublicPage({
  params,
}: {
  params: { slug: string }
}) {
  const [magnet, setMagnet] = useState<PublicMagnet | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundErr, setNotFoundErr] = useState(false)
  const [fromFunnel, setFromFunnel] = useState(false)
  const [unqualifiedMsg, setUnqualifiedMsg] = useState(DEFAULT_UNQUALIFIED_MESSAGE)

  // Lead form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('from') === 'funnel') {
        setFromFunnel(true)
        fetch('/api/funnel/qualify')
          .then(r => r.json())
          .then(d => {
            if (d?.siteSettings?.unqualifiedMessage) {
              setUnqualifiedMsg(d.siteSettings.unqualifiedMessage)
            }
          })
          .catch(() => {})
      }
    }

    const loadMagnet = async () => {
      try {
        const search = typeof window !== 'undefined' ? window.location.search : ''
        const res = await fetch(`/api/magnets/${encodeURIComponent(params.slug)}${search}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          setNotFoundErr(true)
          return
        }
        const data = await res.json()
        setMagnet(data.magnet)
        if (!data.magnet.requireLead && data.magnet.fileUrl) {
          setUnlockedUrl(data.magnet.fileUrl)
        }
      } catch {
        setNotFoundErr(true)
      } finally {
        setLoading(false)
      }
    }
    loadMagnet()
  }, [params.slug])

  const getFallbackParam = () => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('d')
  }

  const triggerBrowserDownload = (url: string, fileName?: string) => {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    if (fileName && url.startsWith('/')) {
      a.download = fileName
    }
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDirectDownload = async () => {
    if (!magnet) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/magnets/${encodeURIComponent(params.slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download', fallbackData: getFallbackParam() }),
      })
      const data = await res.json()
      const targetUrl = data.fileUrl || unlockedUrl
      if (targetUrl) {
        setUnlockedUrl(targetUrl)
        setDownloaded(true)
        triggerBrowserDownload(targetUrl, magnet.fileName)
      }
    } catch {
      if (unlockedUrl) {
        triggerBrowserDownload(unlockedUrl, magnet.fileName)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!magnet) return
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/magnets/${encodeURIComponent(params.slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lead',
          name,
          phone,
          email,
          fallbackData: getFallbackParam(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'يرجى التأكد من البيانات المدخلة')
        return
      }
      if (data.fileUrl) {
        setUnlockedUrl(data.fileUrl)
        setDownloaded(true)
        triggerBrowserDownload(data.fileUrl, magnet.fileName)
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال، يرجى المحاولة مرة أخرى')
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
          <p className="text-sm text-luminance/70">جاري تجهيز الملف...</p>
        </div>
      </main>
    )
  }

  if (notFoundErr || !magnet) {
    return (
      <main
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center font-ar cursor-auto"
      >
        <div className="glass max-w-md w-full rounded-2xl p-10 border border-authority/25 space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-authority/15 border border-authority/30 flex items-center justify-center text-authority mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">هذا الرابط غير متاح</h1>
          <p className="text-sm text-luminance/65 leading-relaxed">
            تأكد من صحة الرابط المرسل إليك، أو ربما تم تحديث الملف.
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
          Exclusive Resource
        </span>
      </header>

      {/* Main Lead Magnet Card */}
      <div className="my-12 max-w-xl w-full mx-auto space-y-6">
        {fromFunnel && (
          <div className="glass rounded-2xl p-6 border border-authority/40 bg-authority/10 space-y-3">
            <p className="text-sm md:text-base font-bold text-white leading-relaxed">
              {unqualifiedMsg}
            </p>
            <div className="pt-2 border-t border-authority/25">
              <Link
                href="/#book"
                className="inline-flex items-center gap-2 text-xs text-authority hover:text-white font-bold transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>
                  إذا اخترت الخيار السابق بالخطأ، اضغط هنا للعودة وحجز مكالمتك الاستراتيجية.
                </span>
              </Link>
            </div>
          </div>
        )}

        <div className="glass rounded-3xl p-8 md:p-12 border border-authority/30 shadow-[0_0_80px_rgba(139,92,246,0.18)] space-y-8 relative overflow-hidden">
          {/* Top Accent Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-authority/25 rounded-full blur-3xl pointer-events-none" />

          {/* File Icon + Meta */}
          <div className="flex items-center justify-between gap-4">
            <div className="w-14 h-14 rounded-2xl bg-authority/20 border border-authority/40 flex items-center justify-center text-authority shadow-[0_0_25px_rgba(139,92,246,0.25)]">
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-authority/20 border border-authority/40 text-luminance font-mono text-xs font-bold">
                {magnet.fileType || 'FILE'}
              </span>
              {magnet.fileSize > 0 && (
                <span className="px-3 py-1 rounded-lg bg-void/70 border border-authority/20 text-luminance/70 font-mono text-xs">
                  {formatBytes(magnet.fileSize)}
                </span>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug">
              {magnet.title}
            </h1>
            {magnet.description && (
              <p className="text-sm md:text-base text-luminance/75 leading-relaxed whitespace-pre-line">
                {magnet.description}
              </p>
            )}
          </div>

          {/* Action Area: Either Direct Download OR Lead Capture Form */}
          {!magnet.requireLead || downloaded ? (
            <div className="space-y-4 pt-2">
              {downloaded && (
                <div className="flex items-center gap-2.5 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>تم تأكيد بياناتك وتجهيز النسخة الخاصة بك! إذا لم يبدأ التحميل تلقائياً اضغط الزر بالأسفل:</span>
                </div>
              )}

              <button
                onClick={() =>
                  downloaded && unlockedUrl
                    ? triggerBrowserDownload(unlockedUrl, magnet.fileName)
                    : handleDirectDownload()
                }
                disabled={submitting}
                className="w-full rounded-2xl bg-authority hover:bg-crown text-white font-bold text-base py-4 px-8 transition-all duration-300 shadow-[0_0_35px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span>{submitting ? 'جاري التحميل...' : magnet.buttonText || 'تحميل الملف الآن'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-5 pt-4 border-t border-authority/20">
              {magnet.collectFields?.name && (
                <div>
                  <label className="block text-xs font-bold text-luminance/90 mb-2">
                    الاسم الكامل <span className="text-authority">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="اكتب اسمك الكامل..."
                    className="w-full rounded-xl bg-void/85 border border-authority/30 px-4 py-3.5 text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority"
                  />
                </div>
              )}

              {magnet.collectFields?.email && (
                <div>
                  <label className="block text-xs font-bold text-luminance/90 mb-2">
                    البريد الإلكتروني الحقيقي (سيتم إرسال الفايل عليه) <span className="text-authority">*</span>
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full rounded-xl bg-void/85 border border-authority/30 px-4 py-3.5 text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority text-right font-mono"
                  />
                  <p className="text-[11px] text-amber-300/90 mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>تأكد من كتابة إيميلك الحقيقي لأن الفايل سيُرسل عليه.</span>
                  </p>
                </div>
              )}

              {magnet.collectFields?.phone && (
                <div>
                  <label className="block text-xs font-bold text-luminance/90 mb-2">
                    رقم الواتساب أو الهاتف <span className="text-authority">*</span>
                  </label>
                  <CountryPhoneInput
                    value={phone}
                    onChange={val => setPhone(val)}
                    required
                  />
                </div>
              )}

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
                <Sparkles className="w-5 h-5" />
                <span>
                  {submitting
                    ? 'جاري التحقق وإرسال الفايل...'
                    : magnet.collectFields?.email
                    ? 'إرسال الفايل إلى إيميلي وتحميله الآن'
                    : magnet.buttonText || 'تحميل الملف الآن'}
                </span>
              </button>
            </form>
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
