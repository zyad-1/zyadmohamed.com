'use client'

import React, { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

/**
 * Normalizes large numbers like "80,000,000" or "80 مليون" into compact "+80M" / "+185K"
 */
export function normalizeCompactMetric(raw: string): string {
  const s = String(raw || '').trim()
  if (/80[,\s]*000[,\s]*000/.test(s) || /80\s*مليون/.test(s)) return '+80M'
  if (/185[,\s]*000/.test(s) || /185\s*ألف/.test(s)) return '+185K'
  const cleanCommas = s.replace(/,/g, '')
  const bigMatch = cleanCommas.match(/^([^0-9]*?)(\d{7,})(.*)$/)
  if (bigMatch) {
    const [, prefix, digits, suffix] = bigMatch
    const n = parseFloat(digits)
    if (n >= 1_000_000) {
      const m = Number((n / 1_000_000).toFixed(1))
      return `${prefix}${m}M${suffix}`
    }
  }
  const kMatch = cleanCommas.match(/^([^0-9]*?)(\d{5,6})(.*)$/)
  if (kMatch) {
    const [, prefix, digits, suffix] = kMatch
    const n = parseFloat(digits)
    if (n >= 10_000) {
      const k = Number((n / 1_000).toFixed(0))
      return `${prefix}${k}K${suffix}`
    }
  }
  return s
}

/**
 * Animated Count-Up Number Component
 * Parses strings like "+80M", "+185K", "90 يوماً", "4.8x" and animates the numeric portion smoothly.
 */
export default function AnimatedMetricValue({ value }: { value: string }) {
  const normalizedValue = normalizeCompactMetric(value)
  const ref = useRef<HTMLSpanElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: '-20px' })
  const [displayVal, setDisplayVal] = useState<string>(normalizedValue)

  useEffect(() => {
    const raw = normalizeCompactMetric(value)
    const match = raw.match(/^([^0-9]*?)(\d+(?:\.\d+)?)(.*)$/)
    if (!match) {
      setDisplayVal(raw)
      return
    }
    const [, prefix, numStr, suffix] = match
    const target = parseFloat(numStr)
    if (Number.isNaN(target)) {
      setDisplayVal(raw)
      return
    }
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0

    if (!isInView) {
      setDisplayVal(`${prefix}${(0).toFixed(decimals)}${suffix}`)
      return
    }

    const controls = animate(0, target, {
      duration: 1.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        const formatted =
          decimals > 0 ? latest.toFixed(decimals) : String(Math.round(latest))
        setDisplayVal(`${prefix}${formatted}${suffix}`)
      },
    })

    return () => controls.stop()
  }, [value, isInView])

  return (
    <span ref={ref} className="inline-block tabular-nums">
      {displayVal}
    </span>
  )
}
