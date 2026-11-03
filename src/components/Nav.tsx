'use client'
import { useEffect, useState } from 'react'
import { WHATSAPP_URL } from '@/lib/constants'

const links = ['About', 'Services', 'Work', 'Contact']

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-400 ${
          scrolled
            ? 'glass border-b border-authority/20'
            : 'border-b border-transparent'
        }`}
      >
        <a href="#" className="flex items-center gap-3 group">
          <img
            src="/logo/logo-white.png"
            alt="Logo"
            className="h-7 md:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-9 list-none">
          {links.map(l => (
            <li key={l}>
              <a
                href={`#${l.toLowerCase()}`}
                className="font-mono font-medium text-[11px] tracking-[0.22em] uppercase text-luminance/60 hover:text-authority transition-colors"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center font-mono font-semibold text-[11px] tracking-[0.2em] uppercase bg-authority/15 border border-authority/40 hover:bg-authority hover:text-void text-off-white px-6 py-3 rounded-lg transition-all duration-300"
        >
          Let's Talk
        </a>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Menu"
        >
          <span className={`block w-6 h-px bg-off-white transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-px bg-off-white transition-all ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-px bg-off-white transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 glass flex flex-col items-center justify-center gap-10 transition-all duration-500 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {links.map(l => (
          <a
            key={l}
            href={`#${l.toLowerCase()}`}
            onClick={() => setOpen(false)}
            className="font-display font-bold text-4xl text-off-white tracking-tight hover:text-authority transition-colors"
          >
            {l}
          </a>
        ))}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 font-mono font-semibold text-[11px] tracking-[0.25em] uppercase bg-authority text-white px-8 py-4 rounded-lg"
        >
          DM on WhatsApp
        </a>
      </div>
    </>
  )
}
