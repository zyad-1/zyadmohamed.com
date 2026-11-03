'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import {
  Play,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ArrowUpLeft,
  MessageSquareQuote,
  AlertCircle,
  Check,
  Gift,
} from 'lucide-react'
import {
  CALENDLY_EMBED_URL,
  DEFAULT_MAIN_FUNNEL_FORM,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PAGE_CONTENT,
  type SiteSettings,
} from '@/lib/constants'
import type { CustomForm } from '@/lib/storage'
import CountryPhoneInput from '@/components/CountryPhoneInput'
import { trackFunnelEvent } from '@/lib/analytics'

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string
        parentElement: HTMLElement
      }) => void
    }
  }
}

export default function SalesFunnelHomePage() {
  const router = useRouter()

  // VSL state
  const [vslPlaying, setVslPlaying] = useState(false)

  // Dynamic Qualification Form & Site Settings (configurable from /admin)
  const [funnelForm, setFunnelForm] = useState<CustomForm>(DEFAULT_MAIN_FUNNEL_FORM)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [formStarted, setFormStarted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [qualified, setQualified] = useState(false)
  const [unqualifiedState, setUnqualifiedState] = useState<{
    message: string
    redirectUrl: string
  } | null>(null)

  // Calendly inline container ref
  const calendlyRef = useRef<HTMLDivElement | null>(null)
  const [calendlyScriptLoaded, setCalendlyScriptLoaded] = useState(false)

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const pageContent = {
    ...DEFAULT_PAGE_CONTENT,
    ...(siteSettings.pageContent || {}),
    founderInfo: {
      ...DEFAULT_PAGE_CONTENT.founderInfo,
      ...(siteSettings.pageContent?.founderInfo || {}),
    },
  }

  // Fetch live form & siteSettings from /api/funnel/qualify
  useEffect(() => {
    fetch('/api/funnel/qualify', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data?.form && Array.isArray(data.form.fields) && data.form.fields.length > 0) {
          setFunnelForm(data.form)
        }
        if (data?.siteSettings) {
          setSiteSettings(data.siteSettings)
        }
      })
      .catch(() => {})
  }, [])

  // Listen for Calendly booking completion event
  useEffect(() => {
    const handleCalendlyEvent = (e: MessageEvent) => {
      if (e.data && e.data.event === 'calendly.event_scheduled') {
        trackFunnelEvent('Schedule_Call', { source: 'calendly_inline_widget' })
        router.push('/booked')
      }
    }
    window.addEventListener('message', handleCalendlyEvent)
    return () => window.removeEventListener('message', handleCalendlyEvent)
  }, [router])

  const showCalendlyDirectly = siteSettings.skipQualificationForm || qualified

  const buildCalendlyUrl = () => {
    const baseUrl = (siteSettings.calendlyUrl || CALENDLY_EMBED_URL).trim()
    try {
      const url = new URL(baseUrl)
      if (!url.searchParams.has('hide_gdpr_banner')) {
        url.searchParams.set('hide_gdpr_banner', '1')
      }
      if (!url.searchParams.has('primary_color')) {
        url.searchParams.set('primary_color', '8b5cf6')
      }
      return url.toString()
    } catch {
      return CALENDLY_EMBED_URL
    }
  }

  // Re-initialize Calendly inline widget whenever it becomes visible
  useEffect(() => {
    if (!showCalendlyDirectly || !calendlyRef.current) return
    if (typeof window !== 'undefined' && window.Calendly) {
      calendlyRef.current.innerHTML = ''
      window.Calendly.initInlineWidget({
        url: buildCalendlyUrl(),
        parentElement: calendlyRef.current,
      })
    }
  }, [showCalendlyDirectly, calendlyScriptLoaded, siteSettings.calendlyUrl])

  const handleVslPlay = () => {
    setVslPlaying(true)
    trackFunnelEvent('VSL_Play', { location: 'hero_vsl' })
  }

  const handleFormInteraction = () => {
    if (!formStarted) {
      setFormStarted(true)
      trackFunnelEvent('Form_Start', { location: 'qualification_gate' })
    }
  }

  const handleAnswerChange = (label: string, val: string) => {
    handleFormInteraction()
    setAnswers(prev => ({ ...prev, [label]: val }))
  }

  const handleQualificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    for (const field of funnelForm.fields) {
      const val = (answers[field.label] || '').trim()
      if (field.required && !val) {
        setFormError(`يرجى إكمال الحقل المطلوب: ${field.label}`)
        return
      }
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/funnel/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || 'يرجى التأكد من صحة البيانات المدخلة.')
        setSubmitting(false)
        return
      }

      if (data.qualified === false && data.redirectUrl) {
        trackFunnelEvent('Lead_Unqualified', { answers })
        setUnqualifiedState({
          message:
            data.unqualifiedMessage ||
            siteSettings.unqualifiedMessage ||
            'للأسف حاليًا غير مؤهل للعمل معنا، وده هدية مجانية لك',
          redirectUrl: data.redirectUrl,
        })
        setSubmitting(false)
        setTimeout(() => {
          if (data.redirectUrl.startsWith('http://') || data.redirectUrl.startsWith('https://')) {
            window.location.href = data.redirectUrl
          } else {
            router.push(data.redirectUrl)
          }
        }, 1800)
        return
      }

      trackFunnelEvent('Lead_Qualified', { answers })
      setQualified(true)
      setSubmitting(false)
    } catch {
      setFormError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.')
      setSubmitting(false)
    }
  }

  const visibleProofCards = (siteSettings.proofCards || []).filter(c => c.visible !== false)
  const visibleTestimonials = (siteSettings.testimonials || []).filter(t => t.visible !== false)
  const showAnyProofSection =
    (siteSettings.showProofCards && visibleProofCards.length > 0) ||
    (siteSettings.showTestimonialsSection && visibleTestimonials.length > 0)

  const vslUrl = pageContent.vslVideoUrl || ''

  return (
    <main className="min-h-screen bg-void text-luminance relative overflow-x-hidden">
      {/* Calendly External Script (Lazy-loaded when calendar is shown) */}
      {showCalendlyDirectly && (
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
          onLoad={() => setCalendlyScriptLoaded(true)}
        />
      )}

      {/* Ambient Brand Glows */}
      <div
        className="pointer-events-none fixed top-[-150px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-25 blur-[150px] -z-10"
        style={{
          background: 'radial-gradient(circle, #8B5CF6 0%, #4C1D95 50%, transparent 75%)',
        }}
      />

      {/* =====================================================================
          HEADER (شعار APX + زر CTA واحد فقط)
      ===================================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-void/85 border-b border-authority/20">
        <div className="max-w-6xl mx-auto px-5 md:px-10 h-20 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group">
            <img
              src="/logo/logo-white.png"
              alt="شعار وكالة APX لبناء البراند الشخصي وصناعة المحتوى — زياد سعدون (Zyad Saadon)"
              width={112}
              height={32}
              className="h-7 md:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </a>

          <a
            href="#book"
            className="inline-flex items-center gap-2 rounded-xl bg-authority hover:bg-crown text-white font-bold text-xs md:text-sm px-5 py-3 shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300"
          >
            <Calendar className="w-4 h-4" />
            <span>{pageContent.headerCtaText}</span>
          </a>
        </div>
      </header>

      {/* =====================================================================
          القسم 1: HERO + VSL
      ===================================================================== */}
      <section id="hero" className="pt-10 pb-14 md:pt-16 md:pb-20 px-5 md:px-10">
        <div id="about" className="sr-only" aria-hidden="true" />
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Eyebrow */}
          {pageContent.eyebrowText && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-depth/90 border border-authority/35 text-xs md:text-sm text-luminance/90">
              <Sparkles className="w-4 h-4 text-authority flex-shrink-0" />
              <span>{pageContent.eyebrowText}</span>
            </div>
          )}

          {/* H1 */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.35] max-w-4xl mx-auto">
            {pageContent.heroTitle}{' '}
            {pageContent.heroTitleHighlight && (
              <span className="text-gradient">{pageContent.heroTitleHighlight}</span>
            )}
          </h1>

          {/* Subtitle */}
          {pageContent.heroSubtitle && (
            <p className="text-sm sm:text-base md:text-lg text-luminance/80 max-w-2xl mx-auto leading-[1.85]">
              {pageContent.heroSubtitle}
            </p>
          )}

          {/* VSL Video Box */}
          <div className="max-w-4xl mx-auto pt-2">
            <div className="relative rounded-3xl overflow-hidden border-2 border-authority/40 bg-depth/80 shadow-[0_0_80px_rgba(139,92,246,0.22)] aspect-video">
              {vslPlaying && vslUrl ? (
                <video
                  src={vslUrl}
                  poster={pageContent.vslPosterUrl || undefined}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleVslPlay}
                  className="w-full h-full relative flex flex-col items-center justify-center p-6 md:p-12 text-center group cursor-pointer bg-gradient-to-b from-depth/90 via-void/90 to-depth/95 overflow-hidden"
                >
                  {pageContent.vslPosterUrl && (
                    <img
                      src={pageContent.vslPosterUrl}
                      alt="غلاف الفيديو التعريفي لمنظومة الـ 90 يوماً من APX — زياد سعدون"
                      width={1280}
                      height={720}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                    />
                  )}
                  <div
                    className="absolute inset-0 opacity-25 group-hover:opacity-40 transition-opacity duration-500"
                    style={{
                      background:
                        'radial-gradient(circle at center, rgba(139,92,246,0.45) 0%, transparent 65%)',
                    }}
                  />

                  <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-authority group-hover:bg-crown text-white flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.65)] transition-all duration-300 group-hover:scale-110 mb-5">
                    <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
                  </div>

                  <p className="relative z-10 text-base md:text-xl font-bold text-white max-w-xl leading-relaxed">
                    {pageContent.vslCaption}
                  </p>
                  {vslPlaying && !vslUrl && (
                    <span className="relative z-10 mt-3 inline-block px-4 py-1.5 rounded-lg bg-authority/20 border border-authority/40 text-xs text-luminance">
                      يمكنك إضافة رابط فيديو الـ VSL من لوحة التحكم (/admin ← محتوى الصفحة)
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Primary CTA Button #1 */}
          <div className="pt-3 space-y-2.5">
            <a
              href="#book"
              className="inline-flex items-center justify-center gap-3 bg-authority hover:bg-crown text-white font-bold text-base md:text-lg px-9 py-4 rounded-2xl shadow-[0_0_45px_rgba(139,92,246,0.45)] transition-all duration-300 hover:scale-[1.02]"
            >
              <Calendar className="w-5 h-5" />
              <span>{pageContent.heroCtaText}</span>
            </a>

            {pageContent.heroSubCtaText && (
              <p className="text-xs text-luminance/65">{pageContent.heroSubCtaText}</p>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          القسم 2: شريط الثقة والأرقام الحقيقية
      ===================================================================== */}
      <section className="py-10 px-5 md:px-10 border-y border-authority/20 bg-depth/35">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(pageContent.heroMetrics || []).map((item, idx) => (
              <div
                key={idx}
                className="glass rounded-2xl p-5 text-center border border-authority/25"
              >
                <div className="font-display font-bold text-3xl md:text-4xl text-white mb-1">
                  {item.num}
                </div>
                <div className="text-xs md:text-sm text-luminance/75">{item.label}</div>
              </div>
            ))}
          </div>

          {(pageContent.partnerBrands || []).length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center">
              <span className="text-xs text-luminance/60">{pageContent.brandsLabel}</span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {pageContent.partnerBrands.map((brand, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 rounded-xl bg-void/80 border border-authority/25 flex items-center gap-2"
                  >
                    <span className="text-xs md:text-sm font-bold text-white">{brand.nameAr}</span>
                    {brand.nameEn && (
                      <span className="font-mono text-[11px] text-authority">{brand.nameEn}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          القسم 3: المشكلة (مختصر ومباشر)
      ===================================================================== */}
      <section id="problem" className="py-16 md:py-20 px-5 md:px-10">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-authority">
              01 — The Challenge
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.35]">
              {pageContent.problemHeading}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {(pageContent.problemPoints || []).map((point, idx) => (
              <div
                key={idx}
                className="glass glass-hover rounded-2xl p-6 border border-authority/25 space-y-3"
              >
                <div className="w-9 h-9 rounded-xl bg-authority/15 border border-authority/35 flex items-center justify-center font-mono text-xs font-bold text-authority">
                  {point.index || String(idx + 1).padStart(2, '0')}
                </div>
                <h3 className="text-lg font-bold text-white">{point.title}</h3>
                <p className="text-xs md:text-sm text-luminance/75 leading-[1.85]">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          القسم 4: الحل والمنهجية (3 خطوات فقط + قسم المؤسس)
      ===================================================================== */}
      <section id="system" className="py-16 md:py-20 px-5 md:px-10 border-t border-authority/15">
        <div id="services" className="sr-only" aria-hidden="true" />
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-authority">
              02 — How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.35]">
              {pageContent.systemHeading}
            </h2>
            {pageContent.systemSubheading && (
              <p className="text-xs md:text-sm text-luminance/75">{pageContent.systemSubheading}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {(pageContent.systemSteps || []).map((step, idx) => (
              <div
                key={idx}
                className="glass glass-hover rounded-2xl p-6 border border-authority/25 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-xl bg-authority/20 border border-authority/40 flex items-center justify-center font-mono text-xs font-bold text-white">
                    {step.index || String(idx + 1).padStart(2, '0')}
                  </span>
                  {step.tag && (
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-authority/15 border border-authority/30 text-authority">
                      {step.tag}
                    </span>
                  )}
                </div>
                <h3 className="text-base md:text-lg font-bold text-white">{step.title}</h3>
                <p className="text-xs md:text-sm text-luminance/75 leading-[1.8]">{step.body}</p>
              </div>
            ))}
          </div>

          {/* قسم المؤسس وإشارات الكيان (Founder & Entity Signals — زياد سعدون / Zyad Saadon / Zyad Mohamed) */}
          <div className="glass rounded-3xl p-6 md:p-9 border border-authority/35 bg-gradient-to-l from-depth/80 via-void/90 to-depth/60 flex flex-col md:flex-row items-center gap-6 md:gap-9">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-authority/50 shadow-[0_0_35px_rgba(139,92,246,0.3)] flex-shrink-0 bg-void">
              <img
                src={pageContent.founderInfo.photoUrl || '/founder-zyad.jpg'}
                alt="زياد سعدون (Zyad Saadon) — مؤسس وكالة APX لبناء البراند الشخصي وصناعة المحتوى للخبراء"
                width={144}
                height={144}
                loading="lazy"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="text-center md:text-right space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-authority/15 border border-authority/35 text-authority text-xs font-bold">
                <span>{pageContent.founderInfo.roleAr}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span>{pageContent.founderInfo.nameAr}</span>
                <span className="text-luminance/40 font-normal">|</span>
                <span className="font-display text-lg md:text-xl text-authority">
                  {pageContent.founderInfo.nameEn}
                </span>
              </h3>
              <p className="text-xs md:text-sm text-luminance/80 leading-[1.85] max-w-2xl">
                {pageContent.founderInfo.bio}
              </p>
              <p className="text-[11px] md:text-xs text-luminance/60 leading-relaxed max-w-2xl">
                بقيادة <strong className="text-white">زياد سعدون (Zyad Saadon)</strong> — المعروف أيضاً باسم{' '}
                <strong className="text-white">Zyad Mohamed (زياد محمد)</strong> — تقدم{' '}
                <strong className="text-white">APX</strong> منظومة Done-For-You لبناء البراند الشخصي وصناعة الفيديوهات القصيرة (Reels · TikTok · Shorts) للخبراء، الأطباء، الاستشاريين، وأصحاب البيزنس في المملكة العربية السعودية، الإمارات العربية المتحدة، ومصر.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                <a
                  href="https://instagram.com/zyadcreative"
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="text-xs font-mono text-authority hover:text-white underline underline-offset-4 transition-colors"
                >
                  Instagram (@zyadcreative)
                </a>
                <span className="text-luminance/30">·</span>
                <a
                  href="https://www.tiktok.com/@zyadcreative"
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="text-xs font-mono text-authority hover:text-white underline underline-offset-4 transition-colors"
                >
                  TikTok (@zyadcreative)
                </a>
                <span className="text-luminance/30">·</span>
                <a
                  href="https://www.youtube.com/@zyadcreative"
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="text-xs font-mono text-authority hover:text-white underline underline-offset-4 transition-colors"
                >
                  YouTube (@zyadcreative)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          القسم 5: الإثباتات وشهادات العملاء (متحكم فيه بالكامل من /admin — يمكن تعديله أو إخفاؤه)
      ===================================================================== */}
      {showAnyProofSection && (
        <section id="proof" className="py-16 md:py-20 px-5 md:px-10 border-t border-authority/15">
          <div id="work" className="sr-only" aria-hidden="true" />
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-authority">
                03 — Results & Testimonials
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.35]">
                {pageContent.proofHeading}
              </h2>
            </div>

            {/* 3 Main Metric Cards (Controllable from /admin) */}
            {siteSettings.showProofCards && visibleProofCards.length > 0 && (
              <div className="grid md:grid-cols-3 gap-5">
                {visibleProofCards.map(card => (
                  <div
                    key={card.id || card.metric}
                    className="glass rounded-2xl p-6 border border-authority/30 space-y-2"
                  >
                    <div className="font-display font-bold text-3xl text-authority">
                      {card.metric}
                    </div>
                    <h3 className="text-base font-bold text-white">{card.unit}</h3>
                    <p className="text-xs text-luminance/75 leading-[1.8]">{card.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Client Testimonials (Controllable & Hideable from /admin) */}
            {siteSettings.showTestimonialsSection && visibleTestimonials.length > 0 && (
              <div className="space-y-5">
                <h3 className="text-lg md:text-xl font-bold text-white text-center md:text-right">
                  {pageContent.testimonialsSubheading}
                </h3>

                <div className="grid md:grid-cols-3 gap-5">
                  {visibleTestimonials.map(shot => (
                    <div
                      key={shot.id}
                      className="glass rounded-2xl p-5 border border-authority/30 flex flex-col justify-between space-y-4"
                    >
                      {shot.imageUrl ? (
                        <div className="rounded-xl overflow-hidden border border-authority/25 bg-void">
                          <img
                            src={shot.imageUrl}
                            alt={`شهادة عميل لدى وكالة APX — ${shot.clientTag}`}
                            width={600}
                            height={400}
                            loading="lazy"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-void/85 border border-authority/25 p-4 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] text-luminance/50 border-b border-authority/15 pb-2">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                              <MessageSquareQuote className="w-3.5 h-3.5" />
                              <span>شهادة عميل</span>
                            </span>
                            <span className="font-mono text-[10px]">Verified</span>
                          </div>
                          <p className="text-xs text-luminance/90 leading-[1.8]">
                            {shot.quotePreview}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1 pt-2 border-t border-authority/15">
                        <p className="text-xs font-bold text-white">{shot.clientTag}</p>
                        {shot.beforeAfter && (
                          <p className="text-[11px] text-authority">{shot.beforeAfter}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mid-Page CTA Button */}
            <div className="text-center pt-2">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-3 bg-authority hover:bg-crown text-white font-bold text-sm md:text-base px-9 py-4 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all duration-300"
              >
                <Calendar className="w-5 h-5" />
                <span>{pageContent.proofCtaText}</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          القسم 6: الفلترة السريعة (هل هذه المنظومة مناسبة لك؟)
      ===================================================================== */}
      <section id="fit" className="py-16 md:py-20 px-5 md:px-10 border-t border-authority/15">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-authority">
              04 — Who This Is For
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.35]">
              {pageContent.fitHeading}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="glass rounded-3xl p-6 md:p-8 border border-emerald-500/35 bg-emerald-500/[0.03] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-white">
                  {pageContent.fitYesTitle}
                </h3>
              </div>

              <ul className="space-y-3">
                {(pageContent.fitForList || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-luminance/85 leading-[1.75]">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-3xl p-6 md:p-8 border border-red-500/30 bg-red-500/[0.02] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-white">
                  {pageContent.fitNoTitle}
                </h3>
              </div>

              <ul className="space-y-3">
                {(pageContent.notFitForList || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-luminance/75 leading-[1.75]">
                    <XCircle className="w-4 h-4 text-red-400/80 flex-shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          القسم 7: حجز المكالمة عبر Calendly بأقل خطوات ممكنة (متحكم فيه من /admin)
      ===================================================================== */}
      <section id="book" className="py-16 md:py-24 px-5 md:px-10 border-t border-authority/15">
        <div id="contact" className="sr-only" aria-hidden="true" />
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-authority">
              05 — Book Your Call
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.35]">
              {funnelForm.title}
            </h2>
            {funnelForm.description && (
              <p className="text-xs md:text-sm text-luminance/75 leading-relaxed">
                {funnelForm.description}
              </p>
            )}
          </div>

          <div className="glass rounded-3xl p-5 md:p-8 border border-authority/35 shadow-[0_0_90px_rgba(139,92,246,0.18)] relative overflow-hidden">
            {unqualifiedState ? (
              <div className="py-10 px-4 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-authority/20 border border-authority/40 flex items-center justify-center text-authority mx-auto">
                  <Gift className="w-8 h-8" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-white leading-relaxed">
                  {unqualifiedState.message}
                </h3>
                <p className="text-xs md:text-sm text-luminance/70">
                  جاري تحويلك الآن إلى صفحة الهدية المجانية...
                </p>
                <div className="pt-2">
                  <a
                    href={unqualifiedState.redirectUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-authority hover:bg-crown text-white font-bold text-sm py-3.5 px-8 transition-all"
                  >
                    <span>الانتقال إلى الهدية المجانية الآن ←</span>
                  </a>
                </div>
              </div>
            ) : !showCalendlyDirectly ? (
              <form
                onSubmit={handleQualificationSubmit}
                onFocus={handleFormInteraction}
                className="space-y-5"
              >
                {funnelForm.fields.map((field, idx) => {
                  const optionTexts =
                    Array.isArray(field.optionItems) && field.optionItems.length > 0
                      ? field.optionItems.map(o => o.text)
                      : Array.isArray(field.options)
                      ? field.options
                      : []

                  return (
                    <div key={field.id}>
                      <label className="block text-xs md:text-sm font-bold text-white mb-2">
                        {idx + 1}. {field.label}{' '}
                        {field.required && <span className="text-authority">*</span>}
                      </label>

                      {field.type === 'select' && optionTexts.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {optionTexts.map(opt => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => handleAnswerChange(field.label, opt)}
                              className={`text-right rounded-xl px-4 py-3 border text-xs md:text-sm font-medium transition-all ${
                                answers[field.label] === opt
                                  ? 'bg-authority/25 border-authority text-white shadow-[0_0_20px_rgba(139,92,246,0.25)] font-bold'
                                  : 'bg-void/70 border-authority/25 text-luminance/80 hover:border-authority/50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : field.type === 'tel' ? (
                        <CountryPhoneInput
                          value={answers[field.label] || ''}
                          onChange={val => handleAnswerChange(field.label, val)}
                          required={field.required}
                        />
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          required={field.required}
                          value={answers[field.label] || ''}
                          onChange={e => handleAnswerChange(field.label, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="w-full rounded-xl bg-void/85 border border-authority/30 px-4 py-3 text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority resize-none"
                        />
                      ) : (
                        <input
                          type={field.type}
                          dir={field.type === 'email' ? 'ltr' : 'rtl'}
                          required={field.required}
                          value={answers[field.label] || ''}
                          onChange={e => handleAnswerChange(field.label, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className={`w-full rounded-xl bg-void/85 border border-authority/30 px-4 py-3.5 text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority ${
                            field.type === 'email' ? 'text-right font-mono' : ''
                          }`}
                        />
                      )}
                    </div>
                  )
                })}

                {formError && (
                  <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-authority hover:bg-crown text-white font-bold text-base py-4 px-8 transition-all duration-300 shadow-[0_0_40px_rgba(139,92,246,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Calendar className="w-5 h-5" />
                  <span>
                    {submitting
                      ? 'جاري فتح تقويم Calendly...'
                      : funnelForm.buttonText || 'عرض المواعيد المتاحة في Calendly ←'}
                  </span>
                </button>

                <p className="text-[11px] text-center text-luminance/55 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-authority" />
                  <span>خطوة سريعة واحدة فقط ثم يظهر لك تقويم Calendly لاختيار موعدك.</span>
                </p>
              </form>
            ) : (
              /* Calendly Inline Widget */
              <div className="space-y-4">
                {qualified && (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/35 p-3.5 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs md:text-sm font-bold text-white">
                      اختر اليوم والساعة المناسبة لك من تقويم Calendly بالأسفل:
                    </p>
                  </div>
                )}

                {/* Calendly inline widget begin */}
                <div
                  ref={calendlyRef}
                  className="calendly-inline-widget rounded-2xl overflow-hidden bg-void"
                  data-url={buildCalendlyUrl()}
                  style={{ minWidth: '320px', height: '700px' }}
                />
                {/* Calendly inline widget end */}

                <div className="pt-2 text-center">
                  <Link
                    href="/booked"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-authority/20 hover:bg-authority text-white font-bold text-xs md:text-sm py-3.5 px-6 border border-authority/40 transition-all"
                  >
                    <span>أكملت الحجز في التقويم؟ اضغط هنا لتأكيد الموعد عبر واتساب</span>
                    <ArrowUpLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          القسم 8: الأسئلة الشائعة (FAQ) + الفوتر
      ===================================================================== */}
      <section id="faq" className="py-16 md:py-20 px-5 md:px-10 border-t border-authority/15">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-authority">
              06 — FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.35]">
              {pageContent.faqHeading}
            </h2>
          </div>

          <div className="space-y-3.5">
            {(pageContent.faqItems || []).map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="glass rounded-2xl border border-authority/25 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4.5 text-right flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <h3 className="text-sm md:text-base font-bold text-white">{item.q}</h3>
                    <ChevronDown
                      className={`w-5 h-5 text-authority flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`px-6 pb-5 pt-1 text-xs md:text-sm text-luminance/80 leading-[1.85] border-t border-authority/15 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    {item.a}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center pt-4">
            <a
              href="#book"
              className="inline-flex items-center justify-center gap-3 bg-authority hover:bg-crown text-white font-bold text-sm md:text-base px-9 py-4 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all duration-300"
            >
              <span>{pageContent.faqCtaText}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 md:px-10 pb-10 pt-4">
        <div className="max-w-5xl mx-auto glass rounded-2xl px-6 md:px-10 py-7 flex flex-col gap-5 border border-authority/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <a href="#hero" className="flex items-center gap-3">
              <img
                src="/logo/logo-white.png"
                alt="شعار وكالة APX — زياد سعدون (Zyad Saadon)"
                width={96}
                height={28}
                loading="lazy"
                className="h-6 w-auto object-contain"
              />
            </a>

            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-authority">
              {pageContent.footerTagline}
            </span>

            <span className="text-xs text-luminance/50">
              {pageContent.footerCopyright}
            </span>
          </div>

          <div className="pt-4 border-t border-authority/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-luminance/55 text-center sm:text-right">
            <p>
              زياد سعدون (Zyad Saadon) — المعروف أيضاً باسم Zyad Mohamed (زياد محمد) · مؤسس APX لبناء البراند الشخصي وصناعة المحتوى للخبراء في السعودية والإمارات ومصر.
            </p>
            <div className="flex items-center gap-3 font-mono">
              <a
                href="https://instagram.com/zyadcreative"
                target="_blank"
                rel="me noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
              <span>·</span>
              <a
                href="https://www.tiktok.com/@zyadcreative"
                target="_blank"
                rel="me noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                TikTok
              </a>
              <span>·</span>
              <a
                href="https://www.youtube.com/@zyadcreative"
                target="_blank"
                rel="me noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                YouTube
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
