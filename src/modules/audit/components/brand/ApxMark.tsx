import React from 'react'

export interface ApxMarkProps {
  size?: number
  showWordmark?: boolean
  variant?: 'white' | 'primary'
  className?: string
}

/**
 * Official APX Brand Logo component using the saved APX brand assets
 * (`/logo/logo-white.png` and `/logo/logo-primary.png`).
 */
export function ApxMark({
  size = 28,
  Variant = 'white',
  className = '',
}: ApxMarkProps & { Variant?: 'white' | 'primary' }) {
  const src = Variant === 'primary' ? '/logo/logo-primary.png' : '/logo/logo-white.png'
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={src}
        alt="APX"
        style={{ height: `${size}px`, width: 'auto' }}
        className="object-contain transition-transform duration-300"
      />
    </span>
  )
}

export default ApxMark
