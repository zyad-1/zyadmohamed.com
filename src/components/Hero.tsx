'use client'
import { useEffect, useRef } from 'react'
import { WHATSAPP_URL, INSTAGRAM_URL } from '@/lib/constants'

export default function Hero() {
  const items = useRef<HTMLElement[]>([])

  useEffect(() => {
    items.current.forEach((el, i) => {
      if (!el) return
      setTimeout(() => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      }, 100 + i * 150)
    })
  }, [])

  const r = (i: number) => (el: HTMLElement | null) => {
    if (el) items.current[i] = el
  }

  const baseStyle = {
    opacity: 0,
    transform: 'translateY(40px)',
    transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-end px-6 md:px-12 pb-16 pt-28 overflow-hidden"
    >
      {/* Huge background logo watermark */}
      <img
        src="/logo/logo-primary.png"
        alt=""
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 -left-10 w-[55vw] max-w-[720px] opacity-[0.08] select-none pointer-events-none z-0 object-contain"
      />

      {/* Content */}
      <div className="relative z-10">
        <p
          ref={r(0)}
          className="font-mono font-medium text-[11px] tracking-[0.28em] uppercase text-authority mb-6 flex items-center gap-4"
          style={baseStyle}
        >
          <span className="block w-10 h-px bg-authority" />
          Content Creator · Gulf Market · Cairo
        </p>

        <h1
          ref={r(1)}
          className="font-display font-bold text-chrome leading-[1.02] mb-8 drop-shadow-2xl"
          style={{ ...baseStyle, fontSize: 'clamp(44px, 9.5vw, 132px)', letterSpacing: '-0.03em' }}
        >
          YOUR<br />CONTENT.<br />ELEVATED.
        </h1>

        <p
          ref={r(2)}
          className="font-body font-light text-luminance/80 text-base md:text-lg tracking-[0.22em] uppercase mb-12"
          style={baseStyle}
        >
          Short-Form Video · Cinematic Editing
        </p>

        <div ref={r(3)} className="flex flex-wrap gap-4" style={baseStyle}>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 font-mono font-semibold text-[11px] tracking-[0.2em] uppercase bg-authority hover:bg-crown text-white px-9 py-4 rounded-lg shadow-[0_0_30px_rgba(139,92,246,0.35)] transition-all duration-300"
          >
            <WhatsAppIcon />
            DM on WhatsApp
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 font-mono font-medium text-[11px] tracking-[0.2em] uppercase glass glass-hover text-luminance px-9 py-4 rounded-lg transition-colors"
          >
            <InstagramIcon />
            @zyadcreative
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute right-12 bottom-16 flex flex-col items-center gap-3 hidden md:flex">
        <div
          className="w-px bg-gradient-to-b from-authority to-transparent"
          style={{ height: 60, animation: 'scroll-pulse 2s ease-in-out infinite' }}
        />
        <span
          className="font-mono text-[9px] tracking-[0.35em] uppercase text-luminance/50"
          style={{ writingMode: 'vertical-rl' }}
        >
          Scroll
        </span>
      </div>
    </section>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M11.999 2C6.476 2 2 6.477 2 12.001c0 1.773.463 3.538 1.341 5.092L2 22l5.051-1.321A9.99 9.99 0 0011.999 22C17.522 22 22 17.522 22 12.001 22 6.477 17.522 2 11.999 2zm0 18.278a8.277 8.277 0 01-4.213-1.148l-.302-.18-3.001.786.8-2.925-.197-.314a8.27 8.27 0 01-1.267-4.497c0-4.563 3.714-8.278 8.28-8.278 4.563 0 8.277 3.715 8.277 8.278 0 4.563-3.714 8.278-8.277 8.278z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
