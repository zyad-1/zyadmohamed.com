'use client'
import { useReveal } from '@/hooks/useReveal'
import { WHATSAPP_URL, INSTAGRAM_URL, CONTACT_DETAILS } from '@/lib/constants'

export default function Contact() {
  const ref = useReveal()

  return (
    <section id="contact" className="relative px-6 md:px-12 py-28" ref={ref}>
      <p className="reveal font-mono font-semibold text-[11px] tracking-[0.28em] uppercase text-authority mb-4 flex items-center gap-3">
        <span className="text-luminance/40">04</span> — Contact
      </p>
      <h2
        className="reveal font-display font-bold text-chrome leading-[1.05] mb-14 drop-shadow-xl"
        style={{ fontSize: 'clamp(38px, 6.5vw, 80px)', letterSpacing: '-0.03em' }}
      >
        LET'S BUILD
      </h2>

      <div className="grid md:grid-cols-2 gap-8">

        {/* Left */}
        <div className="reveal glass rounded-xl p-10 md:p-14">
          <h3
            className="font-display font-bold text-off-white leading-tight mb-6 drop-shadow-md"
            style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', letterSpacing: '-0.02em' }}
          >
            Start a<br />Project<span className="text-authority">.</span>
          </h3>
          <p className="font-body font-light text-luminance/70 text-[15px] leading-[1.85] mb-10 max-w-sm">
            I'm selective about who I work with — and that's by design. If you're serious about your brand, reach out. We'll talk. If it's a fit, we move fast.
          </p>

          <div className="flex flex-col gap-3">
            {[
              {
                href: WHATSAPP_URL,
                icon: <WAIcon />,
                label: 'WhatsApp',
                value: '+20 100 731 1562',
              },
              {
                href: INSTAGRAM_URL,
                icon: <IGIcon />,
                label: 'Instagram',
                value: '@zyadcreative',
              },
            ].map(({ href, icon, label, value }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between glass glass-hover rounded-lg px-6 py-5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-md border border-authority/30 bg-authority/10 flex items-center justify-center">
                    {icon}
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-[9px] tracking-[0.25em] uppercase text-authority mb-0.5">{label}</p>
                    <p className="font-body font-medium text-sm text-off-white">{value}</p>
                  </div>
                </div>
                <span className="text-authority/60 text-sm transition-transform duration-200 group-hover:text-authority group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="reveal delay-100 glass rounded-xl p-10 md:p-14 flex flex-col justify-between gap-12">
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full bg-authority flex-shrink-0 shadow-[0_0_12px_#8B5CF6]"
              style={{ animation: 'pulse-green 2s ease-in-out infinite' }}
            />
            <span className="font-mono font-semibold text-[11px] tracking-[0.25em] uppercase text-luminance">
              Available for New Projects
            </span>
          </div>

          <div className="flex flex-col divide-y divide-authority/15">
            {CONTACT_DETAILS.map(({ key, val }) => (
              <div key={key} className="flex items-center gap-4 py-3.5">
                <span className="font-mono font-medium text-[10px] tracking-[0.2em] uppercase text-authority w-28 flex-shrink-0">{key}</span>
                <span className="font-body text-sm text-luminance">{val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

function WAIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M11.999 2C6.476 2 2 6.477 2 12.001c0 1.773.463 3.538 1.341 5.092L2 22l5.051-1.321A9.99 9.99 0 0011.999 22C17.522 22 22 17.522 22 12.001 22 6.477 17.522 2 11.999 2zm0 18.278a8.277 8.277 0 01-4.213-1.148l-.302-.18-3.001.786.8-2.925-.197-.314a8.27 8.27 0 01-1.267-4.497c0-4.563 3.714-8.278 8.28-8.278 4.563 0 8.277 3.715 8.277 8.278 0 4.563-3.714 8.278-8.277 8.278z"/>
    </svg>
  )
}

function IGIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}
