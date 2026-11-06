'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, ChevronLeft, ChevronRight, Zap } from 'lucide-react'

interface ProblemPoint {
  index?: string
  title: string
  body: string
}

interface SystemStep {
  index?: string
  tag?: string
  title: string
  body: string
}

interface FounderInfo {
  nameAr: string
  nameEn: string
  roleAr: string
  photoUrl?: string
  bio: string
}

interface ProblemAndSystemSectionProps {
  problemHeading: string
  problemPoints: ProblemPoint[]
  systemHeading: string
  systemSubheading?: string
  systemSteps: SystemStep[]
  founderInfo: FounderInfo
}

export default function ProblemAndSystemSection({
  problemHeading,
  problemPoints,
  systemHeading,
  systemSubheading,
  systemSteps,
  founderInfo,
}: ProblemAndSystemSectionProps) {
  const [activeProblemIdx, setActiveProblemIdx] = useState(0)
  const [problemPaused, setProblemPaused] = useState(false)
  const [activeSystemIdx, setActiveSystemIdx] = useState(0)
  const [systemPaused, setSystemPaused] = useState(false)

  useEffect(() => {
    if (problemPaused || problemPoints.length <= 1) return
    const timer = setInterval(() => {
      setActiveProblemIdx((prev) => (prev + 1) % problemPoints.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [problemPaused, problemPoints.length])

  useEffect(() => {
    if (systemPaused || systemSteps.length <= 1) return
    const timer = setInterval(() => {
      setActiveSystemIdx((prev) => (prev + 1) % systemSteps.length)
    }, 5800)
    return () => clearInterval(timer)
  }, [systemPaused, systemSteps.length])

  const currentProblem = problemPoints[activeProblemIdx] || problemPoints[0]
  const currentSystemStep = systemSteps[activeSystemIdx] || systemSteps[0]

  return (
    <>
      {/* =====================================================================
          القسم 3: المشكلة (بطاقات متدرجة مريحة للعين بدون تداخل أو اهتزاز)
      ===================================================================== */}
      <section id="problem" className="relative z-10 py-14 md:py-18 px-5 md:px-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-authority">
              01 — التحدي الحقيقي
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-[1.38]">
              {problemHeading}
            </h2>
          </div>

          {problemPoints.length > 0 && currentProblem && (
            <div
              onMouseEnter={() => setProblemPaused(true)}
              onMouseLeave={() => setProblemPaused(false)}
              className="space-y-4"
            >
              {/* Top Interactive Selector Pills + Prev/Next Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {problemPoints.map((pt, idx) => {
                    const active = activeProblemIdx === idx
                    const cleanIdx = String(
                      pt.index || String(idx + 1).padStart(2, '0')
                    ).replace(/^#/, '')
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveProblemIdx(idx)}
                        className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border ${
                          active
                            ? 'bg-authority text-white border-authority shadow-[0_0_20px_rgba(139,92,246,0.38)]'
                            : 'apx-liquid-glass text-luminance/75 border-authority/20 hover:text-white'
                        }`}
                      >
                        <span className="font-mono text-xs">{cleanIdx}</span>
                        <span className="truncate max-w-[160px] sm:max-w-[220px]">
                          {pt.title}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveProblemIdx(
                        (prev) => (prev - 1 + problemPoints.length) % problemPoints.length
                      )
                    }
                    className="p-2 rounded-xl apx-liquid-glass border border-authority/30 text-white hover:border-authority transition-all"
                    aria-label="السابق"
                  >
                    <ChevronRight className="w-4 h-4 text-authority" />
                  </button>
                  <span className="font-mono text-xs text-luminance/65 px-1.5">
                    {activeProblemIdx + 1} / {problemPoints.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveProblemIdx((prev) => (prev + 1) % problemPoints.length)
                    }
                    className="p-2 rounded-xl bg-authority hover:bg-crown text-white transition-all apx-btn-glow"
                    aria-label="التالي"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Single-Layer Slide Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProblemIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="apx-liquid-glass apx-prism-card rounded-3xl p-6 sm:p-8 border border-authority/35 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-authority/20 border border-authority/40 font-mono text-xs font-bold text-white">
                      <Zap className="w-3.5 h-3.5 text-authority" />
                      <span>
                        {String(
                          currentProblem.index ||
                            String(activeProblemIdx + 1).padStart(2, '0')
                        ).replace(/^#/, '')}{' '}
                        / {String(problemPoints.length).padStart(2, '0')}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {problemPoints.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => setActiveProblemIdx(dotIdx)}
                          className={`h-2 rounded-full transition-all ${
                            activeProblemIdx === dotIdx
                              ? 'w-7 bg-authority'
                              : 'w-2 bg-luminance/25 hover:bg-luminance/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-snug">
                    {currentProblem.title}
                  </h3>

                  <p className="text-xs sm:text-sm md:text-base text-luminance/90 leading-[1.85]">
                    {currentProblem.body}
                  </p>

                  <div className="h-1.5 w-full rounded-full bg-void/90 overflow-hidden">
                    <motion.div
                      animate={{
                        width: `${Math.round(
                          ((activeProblemIdx + 1) / problemPoints.length) * 100
                        )}%`,
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[#4C1D95] via-[#8B5CF6] to-[#E2D9F3]"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          القسم 4: كيف نساعدك؟ (3 خطوات واضحة + بطاقة المؤسس)
      ===================================================================== */}
      <section
        id="system"
        className="relative z-10 py-14 md:py-18 px-5 md:px-10 border-t border-authority/15"
      >
        <div id="services" className="sr-only" aria-hidden="true" />
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-authority">
              02 — كيف نساعدك؟
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-[1.38]">
              {systemHeading}
            </h2>
            {systemSubheading && (
              <p className="text-xs md:text-sm text-luminance/75">
                {systemSubheading}
              </p>
            )}
          </div>

          {systemSteps.length > 0 && currentSystemStep && (
            <div
              onMouseEnter={() => setSystemPaused(true)}
              onMouseLeave={() => setSystemPaused(false)}
              className="space-y-4"
            >
              {/* Interactive Step Progress Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {systemSteps.map((st, idx) => {
                  const active = activeSystemIdx === idx
                  const cleanIdx = String(
                    st.index || String(idx + 1).padStart(2, '0')
                  ).replace(/^#/, '')
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSystemIdx(idx)}
                      className={`text-right p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        active
                          ? 'apx-liquid-glass border-authority shadow-[0_0_24px_rgba(139,92,246,0.22)]'
                          : 'bg-void/60 border-authority/20 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            active
                              ? 'bg-authority text-white'
                              : 'bg-depth text-authority border border-authority/30'
                          }`}
                        >
                          {cleanIdx}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {st.title}
                          </p>
                          {st.tag && (
                            <span className="font-mono text-[10px] text-authority">
                              {st.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Single-Layer Step Slide Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSystemIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="apx-liquid-glass apx-prism-card rounded-3xl p-6 sm:p-8 border border-authority/35 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-xl bg-authority text-white font-mono text-xs font-bold flex items-center justify-center">
                        {String(
                          currentSystemStep.index ||
                            String(activeSystemIdx + 1).padStart(2, '0')
                        ).replace(/^#/, '')}
                      </span>
                      {currentSystemStep.tag && (
                        <span className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-xl bg-authority/15 border border-authority/35 text-authority font-bold">
                          {currentSystemStep.tag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSystemIdx(
                            (prev) => (prev - 1 + systemSteps.length) % systemSteps.length
                          )
                        }
                        className="p-2 rounded-xl bg-void/80 border border-authority/30 text-white hover:border-authority transition-all"
                      >
                        <ChevronRight className="w-4 h-4 text-authority" />
                      </button>
                      <span className="font-mono text-xs text-luminance/65 px-1.5">
                        {activeSystemIdx + 1} / {systemSteps.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSystemIdx((prev) => (prev + 1) % systemSteps.length)
                        }
                        className="p-2 rounded-xl bg-authority hover:bg-crown text-white transition-all apx-btn-glow"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {currentSystemStep.title}
                  </h3>

                  <p className="text-xs sm:text-sm md:text-base text-luminance/90 leading-[1.85]">
                    {currentSystemStep.body}
                  </p>

                  <div className="h-1.5 w-full rounded-full bg-void/90 overflow-hidden">
                    <motion.div
                      animate={{
                        width: `${Math.round(
                          ((activeSystemIdx + 1) / systemSteps.length) * 100
                        )}%`,
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[#4C1D95] via-[#8B5CF6] to-[#E2D9F3]"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* بطاقة المؤسس (واضحة ومختصرة وبدون أي تداخل) */}
          <div className="apx-liquid-glass apx-prism-card rounded-3xl p-6 md:p-8 border border-authority/35 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-2 border-authority/60 shadow-[0_0_24px_rgba(139,92,246,0.3)] flex-shrink-0 bg-void">
              <img
                src={founderInfo.photoUrl || '/founder-zyad.jpg'}
                alt="زياد سعدون (Zyad Saadon) — مؤسس وكالة APX"
                width={128}
                height={128}
                loading="lazy"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="text-center md:text-right space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-authority/15 border border-authority/35 text-authority text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>{founderInfo.roleAr}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span>{founderInfo.nameAr}</span>
                <span className="text-luminance/40 font-normal">|</span>
                <span className="font-display text-base md:text-lg text-authority">
                  {founderInfo.nameEn}
                </span>
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-luminance/90 leading-[1.85]">
                {founderInfo.bio}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
