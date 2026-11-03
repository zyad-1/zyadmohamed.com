import { MARQUEE_ITEMS } from '@/lib/constants'

export default function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div className="overflow-hidden glass border-y border-authority/20 py-4">
      <div className="marquee-track flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-display font-semibold text-xs tracking-[0.3em] uppercase text-luminance/70 px-9 flex-shrink-0"
          >
            {item}
            <span className="text-authority ml-9">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
