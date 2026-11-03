'use client'
import { useReveal } from '@/hooks/useReveal'
import { SERVICES, WHATSAPP_URL } from '@/lib/constants'

export default function Services() {
  const ref = useReveal()

  return (
    <section id="services" className="relative border-y border-authority/15 px-6 md:px-12 py-28" ref={ref}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
        <div>
          <p className="reveal font-mono font-semibold text-[11px] tracking-[0.28em] uppercase text-authority mb-4 flex items-center gap-3">
            <span className="text-luminance/40">02</span> — For Luxury Clients
          </p>
          <h2
            className="reveal font-display font-bold text-chrome leading-[1.05] drop-shadow-xl"
            style={{ fontSize: 'clamp(38px, 6.5vw, 80px)', letterSpacing: '-0.03em' }}
          >
            WHAT I<br />OFFER
          </h2>
        </div>
        <p className="reveal delay-100 font-body font-light text-luminance/70 text-[15px] leading-[1.8] max-w-sm">
          A curated service for personal brands and businesses that refuse to look like everyone else. A creative partnership — not freelance work.
        </p>
      </div>

      {/* Card grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {SERVICES.map((s, i) => (
          <div
            key={s.index}
            className={`reveal glass glass-hover rounded-xl p-10 md:p-12 relative group cursor-default transition-all duration-300 delay-${i * 100}`}
          >
            <span className="absolute top-4 right-4 font-mono text-[10px] text-authority/40 select-none">⊞</span>

            <p className="font-mono font-semibold text-[11px] tracking-[0.25em] uppercase text-authority mb-10">
              {s.index} — {s.tier}
            </p>

            <h3
              className="font-display font-bold text-off-white mb-5 leading-[1.15] whitespace-pre-line"
              style={{ fontSize: 28, letterSpacing: '-0.02em' }}
            >
              {s.title}
            </h3>

            <p className="font-body font-light text-luminance/70 text-sm leading-[1.9] mb-8">{s.body}</p>

            <div className="flex flex-wrap gap-2">
              {s.tags.map(t => (
                <span
                  key={t}
                  className="font-mono font-medium text-[10px] tracking-[0.15em] uppercase text-luminance bg-authority/10 border border-authority/25 rounded-md px-3 py-1"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Arrow */}
            <span className="absolute bottom-8 right-8 text-authority/40 text-xl transition-all duration-300 group-hover:text-authority group-hover:translate-x-1 group-hover:-translate-y-1">
              ↗
            </span>
          </div>
        ))}
      </div>

      {/* Manifesto bar */}
      <div className="mt-12 glass rounded-xl p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <p
          className="font-display font-bold text-chrome leading-tight drop-shadow-lg"
          style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', letterSpacing: '-0.02em' }}
        >
          "The edit is the message."
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 font-mono font-semibold text-[11px] tracking-[0.2em] uppercase bg-authority hover:bg-crown text-white px-9 py-4 rounded-lg transition-all duration-300 flex-shrink-0"
        >
          Start a Project ↗
        </a>
      </div>
    </section>
  )
}
