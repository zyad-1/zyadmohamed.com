'use client'
import { useReveal } from '@/hooks/useReveal'
import { INSTAGRAM_URL } from '@/lib/constants'

const WORK_ITEMS = [
  { id: 1, span: 2, label: 'Showreel · 2025',        title: 'Full Reel',  pattern: 'wc-1', ratio: '21/9' },
  { id: 2, span: 1, label: 'Short-Form · Brand',     title: 'Project 01', pattern: 'wc-2', ratio: '16/9' },
  { id: 3, span: 1, label: 'Personal Brand · Content',title: 'Project 02', pattern: 'wc-3', ratio: '16/9' },
  { id: 4, span: 1, label: 'Reels · Motion',          title: 'Project 03', pattern: 'wc-4', ratio: '16/9' },
  { id: 5, span: 1, label: 'Gulf Market · Brand',     title: 'Project 04', pattern: 'wc-5', ratio: '16/9' },
]

const PATTERNS: Record<string, string> = {
  'wc-1': 'radial-gradient(ellipse at 50% 40%, rgba(139,92,246,0.22), #1A0F2E 55%, #080608 100%)',
  'wc-2': 'radial-gradient(ellipse at 30% 50%, rgba(76,29,149,0.35), #1A0F2E 60%, #080608 100%)',
  'wc-3': 'repeating-linear-gradient(45deg, #130A24 0, #130A24 1px, #1A0F2E 1px, #1A0F2E 16px)',
  'wc-4': 'radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.25), #1A0F2E 65%, #080608 100%)',
  'wc-5': 'repeating-linear-gradient(-45deg, #130A24 0, #130A24 1px, #1A0F2E 1px, #1A0F2E 16px)',
}

export default function Work() {
  const ref = useReveal()

  return (
    <section id="work" className="relative px-6 md:px-12 py-28" ref={ref}>
      <p className="reveal font-mono font-semibold text-[11px] tracking-[0.28em] uppercase text-authority mb-4 flex items-center gap-3">
        <span className="text-luminance/40">03</span> — Selected Work
      </p>
      <h2
        className="reveal font-display font-bold text-chrome leading-[1.05] mb-16 drop-shadow-xl"
        style={{ fontSize: 'clamp(38px, 6.5vw, 80px)', letterSpacing: '-0.03em' }}
      >
        THE WORK
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {WORK_ITEMS.map(item => (
          <div
            key={item.id}
            className={`reveal glass glass-hover rounded-xl group relative overflow-hidden cursor-pointer ${
              item.span === 2 ? 'md:col-span-2' : ''
            }`}
            style={{
              aspectRatio: item.span === 2 ? '21/9' : '16/9',
              background: PATTERNS[item.pattern],
            }}
          >
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border border-authority/40 bg-depth/60 rounded-full flex items-center justify-center transition-all duration-300 group-hover:border-authority group-hover:bg-authority group-hover:scale-110">
                <div className="w-0 h-0 border-l-[14px] border-y-[9px] border-y-transparent border-l-luminance group-hover:border-l-white ml-1" />
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-depth/40 to-transparent flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
              <p className="font-mono font-semibold text-[10px] tracking-[0.25em] uppercase text-authority mb-1.5">{item.label}</p>
              <p className="font-display font-bold text-off-white text-2xl md:text-3xl leading-none" style={{ letterSpacing: '-0.02em' }}>{item.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mt-12 glass rounded-xl p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-luminance/60">
          Full portfolio launching soon — follow @zyadcreative
        </span>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono font-semibold text-[11px] tracking-[0.2em] uppercase bg-authority/15 border border-authority/40 hover:bg-authority text-off-white px-7 py-3.5 rounded-lg transition-all duration-300"
        >
          @zyadcreative ↗
        </a>
      </div>
    </section>
  )
}
