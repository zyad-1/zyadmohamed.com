'use client'
import { useEffect, useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { STATS } from '@/lib/constants'

export default function About() {
  const sectionRef = useReveal()
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statsRef.current) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        statsRef.current?.querySelectorAll<HTMLElement>('.stat-num').forEach((el, i) => {
          setTimeout(() => {
            el.style.animation = 'count-up 0.6s ease forwards'
          }, i * 100)
        })
        obs.disconnect()
      }
    }, { threshold: 0.3 })
    obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="about" className="relative px-6 md:px-12 py-28" ref={sectionRef}>
      <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-start">

        {/* Left — Text */}
        <div>
          <Label index="01" text="About" />
          <h2
            className="reveal font-display font-bold text-chrome leading-[1.05] mb-10 drop-shadow-xl"
            style={{ fontSize: 'clamp(38px, 6.5vw, 80px)', letterSpacing: '-0.03em' }}
          >
            THE EDITOR<br />BEHIND<br />THE CUT
          </h2>
          <div className="reveal space-y-5 delay-100">
            {[
              <span key="1">I'm <strong className="text-off-white font-semibold">Zyad</strong> — a video editor and content creator based in Cairo, operating across the Gulf market. I don't just edit videos. I <strong className="text-off-white font-semibold">craft the visual identity</strong> of brands through their content.</span>,
              <span key="2">I work with personal brands and businesses who understand that <strong className="text-off-white font-semibold">the edit is the message</strong> — that the difference between content that scrolls past and content that stops the feed is precision, taste, and intention.</span>,
              <span key="3">Every frame I deliver is built around one question: <strong className="text-authority font-semibold">does this feel premium?</strong></span>,
            ].map((p, i) => (
              <p key={i} className="font-body font-light text-luminance/75 text-[17px] leading-[1.85]">{p}</p>
            ))}
          </div>
        </div>

        {/* Right — Stats */}
        <div
          ref={statsRef}
          className="reveal delay-200 grid grid-cols-2 gap-4"
        >
          {STATS.map(({ num, label }) => (
            <div key={label} className="glass glass-hover rounded-xl p-8 relative">
              {/* Coordinate marker */}
              <span className="absolute top-3 right-3 font-mono text-[10px] text-authority/40 select-none">⊞</span>
              <div
                className="stat-num font-display font-bold text-off-white leading-none mb-3"
                style={{ fontSize: 'clamp(40px, 5vw, 56px)', letterSpacing: '-0.03em', opacity: 0 }}
              >
                {num}
              </div>
              <p className="font-mono font-medium text-[10px] tracking-[0.22em] uppercase text-authority">{label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

function Label({ index, text }: { index: string; text: string }) {
  return (
    <p className="reveal font-mono font-semibold text-[11px] tracking-[0.28em] uppercase text-authority mb-4 flex items-center gap-3">
      <span className="text-luminance/40">{index}</span>
      <span>—</span>
      {text}
    </p>
  )
}
