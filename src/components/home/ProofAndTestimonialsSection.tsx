'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import AnimatedMetricValue from './AnimatedMetricValue'

interface ProofCardItem {
  id?: string
  metric: string
  unit: string
  desc: string
  visible?: boolean
}

interface TestimonialItem {
  id?: string
  clientTag: string
  beforeAfter?: string
  quotePreview: string
  imageUrl?: string
  visible?: boolean
}

interface ProofAndTestimonialsSectionProps {
  proofHeading: string
  proofCtaText: string
  testimonialsSubheading: string
  showProofCards: boolean
  visibleProofCards: ProofCardItem[]
  showTestimonialsSection: boolean
  visibleTestimonials: TestimonialItem[]
  fitHeading: string
  fitYesTitle: string
  fitNoTitle: string
  fitForList: string[]
  notFitForList: string[]
}

export default function ProofAndTestimonialsSection({
  proofHeading,
  proofCtaText,
  testimonialsSubheading,
  showProofCards,
  visibleProofCards,
  showTestimonialsSection,
  visibleTestimonials,
  fitHeading,
  fitYesTitle,
  fitNoTitle,
  fitForList,
  notFitForList,
}: ProofAndTestimonialsSectionProps) {
  const [activeProofIdx, setActiveProofIdx] = useState(0)
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0)
  const [testimonialsPaused, setTestimonialsPaused] = useState(false)
  const [activeFitTab, setActiveFitTab] = useState<'yes' | 'no'>('yes')

  useEffect(() => {
    if (testimonialsPaused || visibleTestimonials.length <= 1) return
    const timer = setInterval(() => {
      setActiveTestimonialIdx((prev) => (prev + 1) % visibleTestimonials.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [testimonialsPaused, visibleTestimonials.length])

  const showAnyProofSection =
    (showProofCards && visibleProofCards.length > 0) ||
    (showTestimonialsSection && visibleTestimonials.length > 0)

  const currentTestimonial =
    visibleTestimonials[activeTestimonialIdx] || visibleTestimonials[0]

  const marqueeTestimonials =
    visibleTestimonials.length > 0
      ? [...visibleTestimonials, ...visibleTestimonials, ...visibleTestimonials]
      : []

  return (
    <>
      {showAnyProofSection && (
        <section
          id="proof"
          className="relative z-10 py-14 md:py-18 px-5 md:px-10 border-t border-authority/15 overflow-hidden"
        >
          <div id="work" className="sr-only" aria-hidden="true" />
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-authority">
                03 — النتائج وتجارب العملاء
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-[1.38]">
                {proofHeading}
              </h2>
            </div>

            {/* Proof Metric Cards + Branded Slider */}
            {showProofCards && visibleProofCards.length > 0 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {visibleProofCards.map((card, idx) => {
                    const active = activeProofIdx === idx
                    return (
                      <div
                        key={card.id || card.metric}
                        onClick={() => setActiveProofIdx(idx)}
                        className={`apx-liquid-glass apx-prism-card rounded-3xl p-6 border transition-all cursor-pointer space-y-2 ${
                          active
                            ? 'border-authority shadow-[0_0_24px_rgba(139,92,246,0.24)]'
                            : 'border-authority/25 hover:border-authority/45'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            dir="ltr"
                            className="font-display font-bold text-2xl sm:text-3xl text-authority"
                          >
                            <AnimatedMetricValue value={card.metric} />
                          </div>
                          <TrendingUp className="w-4 h-4 text-authority/70" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {card.unit}
                        </h3>
                        <p className="text-xs text-luminance/80 leading-[1.8]">
                          {card.desc}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {visibleProofCards.length > 1 && (
                  <div className="max-w-md mx-auto flex items-center gap-3 px-2">
                    <span className="font-mono text-[10px] text-authority font-bold">
                      01
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={visibleProofCards.length - 1}
                      value={activeProofIdx}
                      onChange={(e) => setActiveProofIdx(Number(e.target.value))}
                      aria-label="شريط تمرير النتائج"
                      className="w-full h-1.5 rounded-full accent-[#8B5CF6] bg-void/80 cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-authority font-bold">
                      {String(visibleProofCards.length).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Single-Layer Testimonials Marquee Slider (No Box-inside-Box) */}
            {showTestimonialsSection &&
              visibleTestimonials.length > 0 &&
              currentTestimonial && (
                <div
                  onMouseEnter={() => setTestimonialsPaused(true)}
                  onMouseLeave={() => setTestimonialsPaused(false)}
                  onTouchStart={() => setTestimonialsPaused(true)}
                  onTouchEnd={() => setTestimonialsPaused(false)}
                  className="space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">
                      {testimonialsSubheading}
                    </h3>

                    {visibleTestimonials.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTestimonialIdx(
                              (prev) =>
                                (prev - 1 + visibleTestimonials.length) %
                                visibleTestimonials.length
                            )
                          }
                          className="p-2 rounded-xl apx-liquid-glass border border-authority/30 text-white hover:border-authority transition-all"
                          aria-label="الشهادة السابقة"
                        >
                          <ChevronRight className="w-4 h-4 text-authority" />
                        </button>
                        <span className="font-mono text-xs text-luminance/65 px-1.5">
                          {activeTestimonialIdx + 1} / {visibleTestimonials.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTestimonialIdx(
                              (prev) => (prev + 1) % visibleTestimonials.length
                            )
                          }
                          className="p-2 rounded-xl bg-authority hover:bg-crown text-white transition-all apx-btn-glow"
                          aria-label="الشهادة التالية"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative overflow-hidden py-2 -mx-4 px-4" dir="ltr">
                    <motion.div
                      animate={
                        testimonialsPaused
                          ? undefined
                          : { x: ['0%', '-33.333%'] }
                      }
                      transition={{
                        duration: Math.max(22, visibleTestimonials.length * 8),
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="flex items-stretch gap-4 w-max"
                    >
                      {marqueeTestimonials.map((item, idx) => {
                        const realIdx = idx % visibleTestimonials.length
                        const isSelected = realIdx === activeTestimonialIdx
                        return (
                          <div
                            key={`${item.id || realIdx}-${idx}`}
                            dir="rtl"
                            onClick={() => setActiveTestimonialIdx(realIdx)}
                            className={`w-[290px] sm:w-[345px] md:w-[375px] shrink-0 rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                              isSelected
                                ? 'apx-liquid-glass border-authority shadow-[0_0_26px_rgba(139,92,246,0.22)]'
                                : 'apx-liquid-glass border-authority/25 opacity-85 hover:opacity-100 hover:border-authority/45'
                            }`}
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={`شهادة عميل لدى وكالة APX — ${item.clientTag}`}
                                width={380}
                                height={220}
                                loading="lazy"
                                className="w-full h-48 rounded-2xl object-cover border border-authority/20"
                              />
                            ) : (
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center justify-between text-[11px] text-luminance/60 border-b border-authority/15 pb-2.5">
                                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                    <MessageSquareQuote className="w-3.5 h-3.5" />
                                    <span>شهادة عميل موثقة</span>
                                  </span>
                                  <span className="font-mono text-[10px] text-authority">
                                    Verified
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-luminance/90 leading-[1.8] line-clamp-4">
                                  {item.quotePreview}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-authority/15">
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-white">
                                  {item.clientTag}
                                </p>
                                {item.beforeAfter && (
                                  <p className="text-[11px] text-authority mt-0.5">
                                    {item.beforeAfter}
                                  </p>
                                )}
                              </div>
                              <span className="font-mono text-[10px] px-2.5 py-1 rounded-xl bg-authority/15 border border-authority/30 text-authority">
                                {String(realIdx + 1).padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </motion.div>
                  </div>

                  {visibleTestimonials.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      {visibleTestimonials.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => setActiveTestimonialIdx(dotIdx)}
                          className={`h-2 rounded-full transition-all ${
                            activeTestimonialIdx === dotIdx
                              ? 'w-7 bg-authority'
                              : 'w-2 bg-luminance/25 hover:bg-luminance/50'
                          }`}
                          aria-label={`شهادة رقم ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Mid-Page CTA Button */}
            <div className="text-center pt-1">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-2.5 bg-authority hover:bg-crown text-white font-bold text-sm md:text-base px-8 py-4 rounded-2xl shadow-[0_0_32px_rgba(139,92,246,0.38)] transition-all duration-300 apx-btn-glow"
              >
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                <span>{proofCtaText}</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          القسم 6: معايير الملاءمة (هل هذا الـ System مناسب لك؟)
      ===================================================================== */}
      <section
        id="fit"
        className="relative z-10 py-14 md:py-18 px-5 md:px-10 border-t border-authority/15"
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-authority">
              04 — معايير الملاءمة
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-[1.38]">
              {fitHeading}
            </h2>
          </div>

          <div className="flex justify-center md:hidden">
            <div className="inline-flex p-1.5 rounded-2xl apx-liquid-glass border border-authority/25 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFitTab('yes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFitTab === 'yes'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/45'
                    : 'text-luminance/65'
                }`}
              >
                {fitYesTitle}
              </button>
              <button
                type="button"
                onClick={() => setActiveFitTab('no')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFitTab === 'no'
                    ? 'bg-red-500/25 text-red-300 border border-red-500/45'
                    : 'text-luminance/65'
                }`}
              >
                {fitNoTitle}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div
              className={`apx-liquid-glass apx-prism-card rounded-3xl p-6 md:p-7 border border-emerald-500/35 space-y-4 ${
                activeFitTab === 'no' ? 'hidden md:block' : 'block'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-white">
                  {fitYesTitle}
                </h3>
              </div>

              <ul className="space-y-3">
                {(fitForList || []).map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs md:text-sm text-luminance/90 leading-[1.8]"
                  >
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`apx-liquid-glass apx-prism-card rounded-3xl p-6 md:p-7 border border-red-500/35 space-y-4 ${
                activeFitTab === 'yes' ? 'hidden md:block' : 'block'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-white">
                  {fitNoTitle}
                </h3>
              </div>

              <ul className="space-y-3">
                {(notFitForList || []).map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs md:text-sm text-luminance/80 leading-[1.8]"
                  >
                    <XCircle className="w-4 h-4 text-red-400/80 flex-shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
