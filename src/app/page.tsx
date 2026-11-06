'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useScroll, useSpring } from 'framer-motion'
import {
  AlertCircle,
  ArrowUpLeft,
  Calendar,
  CheckCircle2,
  Gift,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  CALENDLY_EMBED_URL,
  DEFAULT_MAIN_FUNNEL_FORM,
  DEFAULT_PAGE_CONTENT,
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from '@/lib/constants'
import type { CustomForm } from '@/lib/storage'
import CountryPhoneInput from '@/components/CountryPhoneInput'
import { validatePhoneForCountry } from '@/lib/countries'
import { trackFunnelEvent } from '@/lib/analytics'
import FomoBanner, { useUnifiedFomoTimer } from '@/components/FomoBanner'
import { useSystemTheme } from '@/lib/useSystemTheme'
import CalendlyInlineEmbed from '@/components/CalendlyInlineEmbed'
import VslCinemaPlayer from '@/components/VslCinemaPlayer'
import AnimatedMetricValue from '@/components/home/AnimatedMetricValue'
import HomeNavbar from '@/components/home/HomeNavbar'
import ProblemAndSystemSection from '@/components/home/ProblemAndSystemSection'
import ProofAndTestimonialsSection from '@/components/home/ProofAndTestimonialsSection'
import FaqAndFooterSection from '@/components/home/FaqAndFooterSection'

export default function SalesFunnelHomePage() {
  const router = useRouter()

  // Theme Mode (Automatically follows system Light/Dark mode + manual toggle)
  const { themeMode, toggleThemeMode } = useSystemTheme()

  // Smooth Top Scroll Progress Bar
  const { scrollYProgress } = useScroll()
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  // Metric focus state
  const [activeMetricIdx, setActiveMetricIdx] = useState(0)

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

  const fomoCountdownMinutes = siteSettings.fomoCountdownMinutes ?? 30
  const { secondsLeft: fomoSecondsLeft } = useUnifiedFomoTimer(fomoCountdownMinutes)

  const pageContent = {
    ...DEFAULT_PAGE_CONTENT,
    ...(siteSettings.pageContent || {}),
    founderInfo: {
      ...DEFAULT_PAGE_CONTENT.founderInfo,
      ...(siteSettings.pageContent?.founderInfo || {}),
    },
  }

  const heroMetrics = pageContent.heroMetrics || []
  const problemPoints = pageContent.problemPoints || []
  const systemSteps = pageContent.systemSteps || []
  const visibleProofCards = (siteSettings.proofCards || []).filter((c) => c.visible !== false)
  const visibleTestimonials = (siteSettings.testimonials || []).filter((t) => t.visible !== false)

  // Track PAGE_VIEW and Scroll Depth milestones for Insights
  useEffect(() => {
    trackFunnelEvent('PAGE_VIEW', { page: 'home' })

    const firedDepths = new Set<number>()
    const handleScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const pct = Math.round((window.scrollY / docHeight) * 100)
      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !firedDepths.has(milestone)) {
          firedDepths.add(milestone)
          trackFunnelEvent('SCROLL_DEPTH', { depth: milestone })
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch live form & siteSettings from /api/funnel/qualify
  useEffect(() => {
    fetch('/api/funnel/qualify', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.form && Array.isArray(data.form.fields) && data.form.fields.length > 0) {
          setFunnelForm(data.form)
        }
        if (data?.siteSettings) {
          setSiteSettings(data.siteSettings)
        }
      })
      .catch(() => {})
  }, [])

  const showCalendlyDirectly = siteSettings.skipQualificationForm || qualified
  const bookingCalendlyUrl = (siteSettings.calendlyUrl || CALENDLY_EMBED_URL).trim()

  const handleVslPlay = () => {
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
    setAnswers((prev) => ({ ...prev, [label]: val }))
    if (
      label.includes('ميزانيتك') ||
      label.includes('الميزانية') ||
      label.toLowerCase().includes('budget') ||
      val.includes('$')
    ) {
      trackFunnelEvent('BUDGET_SELECT', { budget: val, field: label })
    }
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
      if (field.type === 'tel' && val) {
        const phoneCheck = validatePhoneForCountry(val)
        if (!phoneCheck.valid) {
          setFormError(phoneCheck.errorAr || 'رقم الهاتف غير مكتمل')
          return
        }
      }
    }

    setSubmitting(true)

    try {
      const cachedGeo =
        typeof window !== 'undefined' ? window.__apxGeoCache : undefined
      const res = await fetch('/api/funnel/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          countryCode: cachedGeo?.countryCode,
          countryName: cachedGeo?.countryName,
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

  // Psychological Goal-Gradient Form Completion Percentage
  const totalFormFields = funnelForm.fields.length || 1
  const answeredFormFields = funnelForm.fields.filter(
    (f) => (answers[f.label] || '').trim().length > 0
  ).length
  const formCompletionPct = Math.min(
    100,
    Math.round((answeredFormFields / totalFormFields) * 100)
  )

  const acceptingClients = siteSettings.acceptingClients !== false
  const fomoEnabled = siteSettings.fomoEnabled !== false
  const fomoSeatsLeft = siteSettings.fomoSeatsLeft ?? 3
  const fomoTextAr =
    siteSettings.fomoTextAr ||
    `متبقي ${fomoSeatsLeft} مقاعد فقط لتطبيق الـ System هذا الشهر`

  return (
    <main
      className={`min-h-screen bg-transparent text-luminance relative overflow-x-clip selection:bg-authority/30 selection:text-white transition-colors duration-300 ${
        themeMode === 'light' ? 'apx-light-mode' : ''
      }`}
    >
      {/* Top Interactive Scroll Progress Bar */}
      <motion.div
        style={{ scaleX: smoothScroll }}
        className="fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-[#4C1D95] via-[#8B5CF6] to-[#E2D9F3] origin-right z-[70]"
      />

      {/* Fixed Top Navigation Bar */}
      <HomeNavbar
        headerCtaText={pageContent.headerCtaText}
        themeMode={themeMode}
        onToggleTheme={toggleThemeMode}
        fomoEnabled={fomoEnabled}
        acceptingClients={acceptingClients}
        fomoSeatsLeft={fomoSeatsLeft}
        fomoSecondsLeft={fomoSecondsLeft}
      />

      {/* =====================================================================
          القسم 1: HERO + VSL + FOMO Banner الموحد
      ===================================================================== */}
      <section id="hero" className="relative z-10 pt-24 pb-12 md:pt-32 md:pb-16 px-5 md:px-10">
        <div id="about" className="sr-only" aria-hidden="true" />
        <div className="max-w-4xl mx-auto text-center space-y-5">
          {pageContent.eyebrowText && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full apx-liquid-glass border border-authority/35 text-xs md:text-sm text-luminance">
              <Sparkles className="w-3.5 h-3.5 text-authority flex-shrink-0" />
              <span>{pageContent.eyebrowText}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-white leading-[1.38] max-w-3xl mx-auto">
            {pageContent.heroTitle}{' '}
            {pageContent.heroTitleHighlight && (
              <span className="text-chrome">
                {pageContent.heroTitleHighlight}
              </span>
            )}
          </h1>

          {pageContent.heroSubtitle && (
            <p className="text-xs sm:text-sm md:text-base text-luminance/80 max-w-2xl mx-auto leading-[1.8]">
              {pageContent.heroSubtitle}
            </p>
          )}

          {/* Clean Single-Layer VSL Player */}
          <VslCinemaPlayer
            videoUrl={pageContent.vslVideoUrl || ''}
            posterUrl={pageContent.vslPosterUrl}
            caption={pageContent.vslCaption}
            onPlay={handleVslPlay}
          />

          {/* Primary CTA Button + Identical Shared FOMO Scarcity Bar */}
          <div className="pt-2 space-y-4 max-w-2xl mx-auto">
            <a
              href="#book"
              className="inline-flex items-center justify-center gap-2.5 bg-authority hover:bg-crown text-white font-bold text-sm md:text-base px-8 py-4 rounded-2xl shadow-[0_0_36px_rgba(139,92,246,0.4)] transition-all duration-300 apx-btn-glow"
            >
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              <span>{pageContent.heroCtaText}</span>
            </a>

            {pageContent.heroSubCtaText && (
              <p className="text-[11px] sm:text-xs text-luminance/65">
                {pageContent.heroSubCtaText}
              </p>
            )}

            {/* Exact Same FOMO Banner Component & Colors as the Audit Report */}
            {fomoEnabled && (
              <FomoBanner
                locale="ar"
                acceptingClients={acceptingClients}
                seatsLeft={fomoSeatsLeft}
                urgencyTextAr={fomoTextAr}
                countdownMinutes={fomoCountdownMinutes}
                secondsLeftOverride={fomoSecondsLeft}
              />
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          القسم 2: الأرقام الحقيقية والبراندات
      ===================================================================== */}
      <section className="relative z-10 py-10 px-5 md:px-10 border-y border-authority/20 bg-depth/30">
        <div className="max-w-5xl mx-auto space-y-6">
          {heroMetrics.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {heroMetrics.map((item, idx) => {
                  const isFocused = activeMetricIdx === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveMetricIdx(idx)}
                      className={`apx-liquid-glass apx-prism-card rounded-3xl p-5 text-center border transition-all cursor-pointer ${
                        isFocused
                          ? 'border-authority shadow-[0_0_24px_rgba(139,92,246,0.24)]'
                          : 'border-authority/25 hover:border-authority/45'
                      }`}
                    >
                      <div
                        dir="ltr"
                        className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-white mb-1"
                      >
                        <AnimatedMetricValue value={item.num} />
                      </div>
                      <div className="text-xs sm:text-sm text-luminance/85 font-medium">
                        {item.label}
                      </div>
                    </div>
                  )
                })}
              </div>

              {heroMetrics.length > 1 && (
                <div className="max-w-md mx-auto flex items-center gap-3 px-2">
                  <span className="font-mono text-[10px] text-authority font-bold">
                    01
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={heroMetrics.length - 1}
                    value={activeMetricIdx}
                    onChange={(e) => setActiveMetricIdx(Number(e.target.value))}
                    aria-label="التنقل بين الأرقام"
                    className="w-full h-1.5 rounded-full accent-[#8B5CF6] bg-void/80 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-authority font-bold">
                    {String(heroMetrics.length).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          )}

          {(pageContent.partnerBrands || []).length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center pt-1">
              <span className="text-xs text-luminance/65">
                {pageContent.brandsLabel}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {pageContent.partnerBrands.map((brand, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-1.5 rounded-2xl apx-liquid-glass border border-authority/25 flex items-center gap-2"
                  >
                    <span className="text-xs font-bold text-white">{brand.nameAr}</span>
                    {brand.nameEn && (
                      <span className="font-mono text-[11px] text-authority">
                        {brand.nameEn}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          القسم 3 و 4: المشكلة + خطوات الـ System + بطاقة المؤسس
      ===================================================================== */}
      <ProblemAndSystemSection
        problemHeading={pageContent.problemHeading}
        problemPoints={problemPoints}
        systemHeading={pageContent.systemHeading}
        systemSubheading={pageContent.systemSubheading}
        systemSteps={systemSteps}
        founderInfo={pageContent.founderInfo}
      />

      {/* =====================================================================
          القسم 5 و 6: النتائج وتجارب العملاء + معايير الملاءمة
      ===================================================================== */}
      <ProofAndTestimonialsSection
        proofHeading={pageContent.proofHeading}
        proofCtaText={pageContent.proofCtaText}
        testimonialsSubheading={pageContent.testimonialsSubheading}
        showProofCards={siteSettings.showProofCards !== false}
        visibleProofCards={visibleProofCards}
        showTestimonialsSection={siteSettings.showTestimonialsSection !== false}
        visibleTestimonials={visibleTestimonials}
        fitHeading={pageContent.fitHeading}
        fitYesTitle={pageContent.fitYesTitle}
        fitNoTitle={pageContent.fitNoTitle}
        fitForList={pageContent.fitForList || []}
        notFitForList={pageContent.notFitForList || []}
      />

      {/* =====================================================================
          القسم 7: حجز المكالمة عبر Calendly داخل الموقع + شريط FOMO الموحد
      ===================================================================== */}
      <section
        id="book"
        className="relative z-10 py-14 md:py-20 px-5 md:px-10 border-t border-authority/15"
      >
        <div id="contact" className="sr-only" aria-hidden="true" />
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-authority">
              05 — احجز جلستك الاستراتيجية
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-[1.38]">
              {funnelForm.title}
            </h2>
            {funnelForm.description && (
              <p className="text-xs md:text-sm text-luminance/75 leading-relaxed">
                {funnelForm.description}
              </p>
            )}
          </div>

          {/* Exact Same Shared FOMO Banner Above Booking Card */}
          {fomoEnabled && (
            <FomoBanner
              locale="ar"
              acceptingClients={acceptingClients}
              seatsLeft={fomoSeatsLeft}
              urgencyTextAr={fomoTextAr}
              countdownMinutes={fomoCountdownMinutes}
              secondsLeftOverride={fomoSecondsLeft}
            />
          )}

          {unqualifiedState ? (
            /* Single-Layer Lead Magnet / Free Gift Card */
            <div className="apx-liquid-glass apx-prism-card rounded-3xl p-6 md:p-10 border border-authority/35 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-authority/20 border border-authority/45 flex items-center justify-center text-authority mx-auto">
                <Gift className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-authority/15 border border-authority/35 text-xs font-bold text-authority">
                <Sparkles className="w-3.5 h-3.5" />
                <span>هدية مجانية حصرية من APX</span>
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-white leading-relaxed max-w-lg mx-auto">
                {unqualifiedState.message}
              </h3>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={unqualifiedState.redirectUrl}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-authority hover:bg-crown text-white font-bold text-sm py-3.5 px-8 transition-all apx-btn-glow"
                >
                  <Gift className="w-4 h-4" />
                  <span>استلام الهدية المجانية الآن ←</span>
                </a>
                <button
                  type="button"
                  onClick={() => setUnqualifiedState(null)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-void/70 border border-authority/30 text-xs text-luminance hover:text-white py-3.5 px-5 transition-all"
                >
                  <span>تعديل الإجابات والعودة للحجز</span>
                </button>
              </div>
            </div>
          ) : !showCalendlyDirectly ? (
            /* Single-Layer Qualification Form Card */
            <div className="apx-liquid-glass apx-prism-card rounded-3xl p-5 md:p-8 border border-authority/35">
              <form
                onSubmit={handleQualificationSubmit}
                onFocus={handleFormInteraction}
                className="space-y-5"
              >
                {/* Goal-Gradient Progress Bar */}
                <div className="space-y-2 pb-3 border-b border-authority/15">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-luminance/85 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-authority" />
                      <span>خطوة التأهيل السريع لحجز الموعد</span>
                    </span>
                    <span className="font-mono font-bold text-authority">
                      {formCompletionPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-void overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.max(8, formCompletionPct)}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[#4C1D95] via-[#8B5CF6] to-[#4BA37A]"
                    />
                  </div>
                </div>

                {funnelForm.fields.map((field, idx) => {
                  const optionTexts =
                    Array.isArray(field.optionItems) && field.optionItems.length > 0
                      ? field.optionItems.map((o) => o.text)
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
                          {optionTexts.map((opt) => {
                            const selected = answers[field.label] === opt
                            return (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => handleAnswerChange(field.label, opt)}
                                className={`text-right rounded-2xl px-4 py-3.5 border text-xs md:text-sm font-medium transition-all ${
                                  selected
                                    ? 'bg-authority/25 border-authority text-white shadow-[0_0_18px_rgba(139,92,246,0.24)] font-bold'
                                    : 'bg-void/70 border-authority/25 text-luminance/80 hover:border-authority/50'
                                }`}
                              >
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      ) : field.type === 'tel' ? (
                        <CountryPhoneInput
                          value={answers[field.label] || ''}
                          onChange={(val) => handleAnswerChange(field.label, val)}
                          required={field.required}
                        />
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          required={field.required}
                          value={answers[field.label] || ''}
                          onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="w-full rounded-2xl bg-void/85 border border-authority/30 px-4 py-3 text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority resize-none apx-scroll-box"
                        />
                      ) : (
                        <input
                          type={field.type}
                          dir={field.type === 'email' ? 'ltr' : 'rtl'}
                          required={field.required}
                          value={answers[field.label] || ''}
                          onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className={`w-full rounded-2xl bg-void/85 border border-authority/30 px-4 py-3.5 text-sm text-white placeholder-luminance/35 focus:outline-none focus:border-authority ${
                            field.type === 'email' ? 'text-right font-mono' : ''
                          }`}
                        />
                      )}
                    </div>
                  )
                })}

                {formError && (
                  <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-authority hover:bg-crown text-white font-bold text-sm md:text-base py-4 px-8 transition-all duration-300 shadow-[0_0_32px_rgba(139,92,246,0.38)] flex items-center justify-center gap-2.5 disabled:opacity-50 apx-btn-glow"
                >
                  <Calendar className="w-5 h-5" />
                  <span>
                    {submitting
                      ? 'جاري فتح تقويم Calendly داخل الصفحة...'
                      : funnelForm.buttonText || 'عرض المواعيد المتاحة في Calendly ←'}
                  </span>
                </button>

                <p className="text-[11px] text-center text-luminance/60 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-authority" />
                  <span>يفتح لك تقويم Calendly مباشرة داخل الصفحة لاختيار موعدك فوراً.</span>
                </p>
              </form>
            </div>
          ) : (
            /* Direct Single-Layer Calendly Inline Embed (No Nested Box-inside-Box!) */
            <div className="space-y-4">
              {qualified && (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/35 p-3.5 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs md:text-sm font-bold text-white">
                    تم تأكيد أهليتك بنجاح — اختر اليوم والساعة المناسبة لك من تقويم Calendly بالأسفل:
                  </p>
                </div>
              )}

              <CalendlyInlineEmbed
                bookingUrl={bookingCalendlyUrl}
                locale="ar"
                themeMode={themeMode}
                height={700}
                onScheduled={() => {
                  trackFunnelEvent('Schedule_Call', { source: 'calendly_inline_widget' })
                  router.push('/booked')
                }}
              />

              <div className="pt-1 text-center">
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
      </section>

      {/* =====================================================================
          القسم 8: الأسئلة الشائعة + الفوتر
      ===================================================================== */}
      <FaqAndFooterSection
        showFaqSection={siteSettings.showFaqSection !== false}
        faqHeading={pageContent.faqHeading}
        faqItems={pageContent.faqItems || []}
        faqCtaText={pageContent.faqCtaText}
        footerTagline={pageContent.footerTagline}
        footerCopyright={pageContent.footerCopyright}
      />
    </main>
  )
}
