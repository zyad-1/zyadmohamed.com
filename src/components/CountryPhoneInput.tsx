'use client'

import React, { useState, useEffect } from 'react'
import {
  COUNTRIES_LIST,
  DEFAULT_COUNTRY_CODE,
  getCountryByCode,
} from '@/lib/countries'

interface CountryPhoneInputProps {
  value: string
  onChange: (fullPhone: string) => void
  required?: boolean
  className?: string
}

export default function CountryPhoneInput({
  value,
  onChange,
  required = true,
  className = '',
}: CountryPhoneInputProps) {
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY_CODE)
  const [localNumber, setLocalNumber] = useState<string>('')

  const selectedCountry = getCountryByCode(countryCode)

  // Auto-detect visitor country on mount (defaulting to EG if detection fails)
  useEffect(() => {
    let mounted = true
    const detectCountry = async () => {
      try {
        const res = await fetch('/api/geo', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (mounted && data?.countryCode) {
            setCountryCode(data.countryCode)
            return
          }
        }
      } catch {
        // Fallback to direct client lookup if needed
      }

      try {
        const directRes = await fetch('https://api.country.is/')
        if (directRes.ok) {
          const directData = await directRes.json()
          const code = String(directData?.country || '').toUpperCase()
          if (mounted && COUNTRIES_LIST.some(c => c.code === code)) {
            setCountryCode(code)
            return
          }
        }
      } catch {
        // Keep default (EG)
      }
    }

    detectCountry()
    return () => {
      mounted = false
    }
  }, [])

  // Keep localNumber synced if parent resets value to ''
  useEffect(() => {
    if (!value) {
      setLocalNumber('')
    }
  }, [value])

  const emitCombined = (dial: string, rawLocal: string) => {
    const cleanedLocal = rawLocal.replace(/[^\d\s]/g, '').trim()
    if (!cleanedLocal) {
      onChange('')
      return
    }
    const strippedLeadingZero = cleanedLocal.replace(/^0+/, '')
    onChange(`${dial} ${strippedLeadingZero || cleanedLocal}`)
  }

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode)
    const nextCountry = getCountryByCode(newCode)
    if (localNumber.trim()) {
      emitCombined(nextCountry.dialCode, localNumber)
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalNumber(raw)
    emitCombined(selectedCountry.dialCode, raw)
  }

  return (
    <div
      dir="ltr"
      className={`flex items-stretch rounded-xl bg-void/85 border border-authority/30 focus-within:border-authority overflow-hidden transition-colors ${className}`}
    >
      {/* Country Selector Dropdown */}
      <select
        aria-label="كود الدولة"
        value={countryCode}
        onChange={e => handleCountryChange(e.target.value)}
        className="bg-depth/90 text-white text-xs md:text-sm font-mono px-3 py-3.5 border-r border-authority/25 focus:outline-none cursor-pointer"
      >
        {COUNTRIES_LIST.map(c => (
          <option key={c.code} value={c.code} className="bg-void text-white">
            {c.flag} {c.nameAr} ({c.dialCode})
          </option>
        ))}
      </select>

      {/* Local Phone Number Input */}
      <input
        type="tel"
        dir="ltr"
        required={required}
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={selectedCountry.placeholder}
        className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white font-mono placeholder-luminance/35 focus:outline-none"
      />
    </div>
  )
}
