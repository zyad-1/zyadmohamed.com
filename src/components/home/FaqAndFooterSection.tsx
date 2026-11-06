'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { trackFunnelEvent } from '@/lib/analytics'

interface FaqItem {
  q: string
  a: string
}

interface FaqAndFooterSectionProps {
  showFaqSection: boolean
  faqHeading: string
  faqItems: FaqItem[]
  faqCtaText: string
  footerTagline: string
  footerCopyright: string
}

export default function FaqAndFooterSection({
  showFaqSection,
  faqHeading,
  faqItems,
  faqCtaText,
  footerTagline,
  footerCopyright,
}: FaqAndFooterSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleLogoRefresh = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.location.href = '/'
  }

  return (
    <>
      {showFaqSection && faqItems.length > 0 && (
        <section
          id="faq"
          className="relative z-10 py-14 md:py-18 px-5 md:px-10 border-t border-authority/15"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-authority">
                06 — الأسئلة الشائعة
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-[1.38]">
                {faqHeading}
              </h2>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    className={`apx-liquid-glass apx-prism-card rounded-2xl border overflow-hidden transition-all duration-250 ${
                      isOpen
                        ? 'border-authority/60 shadow-[0_0_24px_rgba(139,92,246,0.18)]'
                        : 'border-authority/25 hover:border-authority/45'
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => {
                        const next = isOpen ? null : idx
                        setOpenFaq(next)
                        if (next !== null) {
                          trackFunnelEvent('FAQ_VIEW', { question: item.q, index: idx })
                        }
                      }}
                      className="w-full px-5 py-4 text-right flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-xs px-2.5 py-1 rounded-xl border transition-all ${
                            isOpen
                              ? 'bg-authority text-white border-authority'
                              : 'bg-void/60 border-authority/20 text-authority'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-xs sm:text-sm md:text-base font-bold text-white group-hover:text-authority transition-colors">
                          {item.q}
                        </h3>
                      </div>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.22 }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isOpen
                            ? 'bg-authority text-white border-authority'
                            : 'bg-void/60 text-authority border-authority/25'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="faq-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-2 text-xs md:text-sm text-luminance/85 leading-[1.85] border-t border-authority/15">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            <div className="text-center pt-2">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-2.5 bg-authority hover:bg-crown text-white font-bold text-sm md:text-base px-8 py-4 rounded-2xl shadow-[0_0_32px_rgba(139,92,246,0.38)] transition-all duration-300 apx-btn-glow"
              >
                <span>{faqCtaText}</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Minimal Single-Layer Footer */}
      <footer className="relative z-10 px-5 md:px-10 pb-10 pt-6 border-t border-authority/15">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <a
            href="/"
            onClick={handleLogoRefresh}
            title="الصفحة الرئيسية — APX"
            className="flex items-center gap-3 hover:scale-105 transition-transform"
          >
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
            {footerTagline}
          </span>

          <span className="text-xs text-luminance/65">{footerCopyright}</span>
        </div>
      </footer>
    </>
  )
}
