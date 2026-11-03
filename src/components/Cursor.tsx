'use client'
import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dot  = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const pos  = useRef({ x: 0, y: 0, rx: 0, ry: 0 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY
      if (dot.current) {
        dot.current.style.left = e.clientX - 4 + 'px'
        dot.current.style.top  = e.clientY - 4 + 'px'
      }
    }
    const grow = () => {
      if (ring.current) { ring.current.style.width = '56px'; ring.current.style.height = '56px' }
    }
    const shrink = () => {
      if (ring.current) { ring.current.style.width = '36px'; ring.current.style.height = '36px' }
    }

    document.addEventListener('mousemove', move)
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', grow)
      el.addEventListener('mouseleave', shrink)
    })

    let raf: number
    const animate = () => {
      pos.current.rx += (pos.current.x - pos.current.rx) * 0.12
      pos.current.ry += (pos.current.y - pos.current.ry) * 0.12
      if (ring.current) {
        ring.current.style.left = pos.current.rx + 'px'
        ring.current.style.top  = pos.current.ry + 'px'
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      document.removeEventListener('mousemove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="hidden md:block">
      <div
        ref={dot}
        className="fixed w-2 h-2 bg-authority rounded-full pointer-events-none z-[9999]"
        style={{ transition: 'transform 0.1s' }}
      />
      <div
        ref={ring}
        className="fixed w-9 h-9 border border-authority/45 rounded-full pointer-events-none z-[9998]"
        style={{
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.25s, height 0.25s',
        }}
      />
    </div>
  )
}
