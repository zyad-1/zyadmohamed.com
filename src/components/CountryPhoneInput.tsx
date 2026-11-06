'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import {
  COUNTRIES_LIST,
  DEFAULT_COUNTRY_CODE,
  detectVisitorGeo,
  getCountryByCode,
  validatePhoneForCountry,
  type CountryOption,
} from '@/lib/countries'

interface CountryPhoneInputProps {
  value: string
  onChange: (fullPhone: string) => void
  onValidityChange?: (valid: boolean, errorAr?: string) => void
  required?: boolean
  className?: string
  showDetectedBadge?: boolean
}

export default function CountryPhoneInput({
  value,
  onChange,
  onValidityChange,
  required = true,
  className = '',
  showDetectedBadge = true,
}: CountryPhoneInputProps) {
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY_CODE)
  const [customCountry, setCustomCountry] = useState<CountryOption | null>(null)
  const [userManuallyChanged, setUserManuallyChanged] = useState(false)
  const [localNumber, setLocalNumber] = useState<string>('')
  const [detecting, setDetecting] = useState<boolean>(true)
  const [touched, setTouched] = useState<boolean>(false)

  const selectedCountry = useMemo(() => {
    if (customCountry && customCountry.code === countryCode) {
      return customCountry
    }
    return getCountryByCode(countryCode)
  }, [countryCode, customCountry])

  const optionsList = useMemo(() => {
    if (
      customCountry &&
      !COUNTRIES_LIST.some((c) => c.code === customCountry.code)
    ) {
      return [customCountry, ...COUNTRIES_LIST]
    }
    return COUNTRIES_LIST
  }, [customCountry])

  // Auto-detect visitor country on mount AND on window focus (so VPN switches update immediately)
  useEffect(() => {
    let mounted = true

    const runDetection = async () => {
      if (userManuallyChanged) return
      setDetecting(true)
      try {
        const geo = await detectVisitorGeo()
        if (!mounted || userManuallyChanged) return
        const resolved = getCountryByCode(
          geo.countryCode,
          geo.countryName,
          geo.dialCode
        )
        setCustomCountry(resolved)
        setCountryCode(resolved.code)
      } finally {
        if (mounted) setDetecting(false)
      }
    }

    runDetection()

    const handleWindowFocus = () => {
      if (!userManuallyChanged && !localNumber.trim()) {
        runDetection()
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    return () => {
      mounted = false
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [userManuallyChanged, localNumber])

  // Keep localNumber synced if parent resets value to ''
  useEffect(() => {
    if (!value) {
      setLocalNumber('')
      setTouched(false)
    }
  }, [value])

  const emitCombined = (dial: string, code: string, rawLocal: string) => {
    const cleanedLocal = rawLocal.replace(/[^\d\s]/g, '').trim()
    if (!cleanedLocal) {
      onChange('')
      onValidityChange?.(false, 'يرجى إدخال رقم الهاتف')
      return
    }
    const strippedLeadingZero = cleanedLocal.replace(/^0+/, '').replace(/\s+/g, '')
    const full = `${dial} ${strippedLeadingZero || cleanedLocal}`
    onChange(full)
    const check = validatePhoneForCountry(full, code)
    onValidityChange?.(check.valid, check.errorAr)
  }

  const handleCountryChange = (newCode: string) => {
    setUserManuallyChanged(true)
    setCountryCode(newCode)
    const nextCountry = getCountryByCode(newCode)
    if (localNumber.trim()) {
      emitCombined(nextCountry.dialCode, newCode, localNumber)
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s]/g, '')
    setLocalNumber(raw)
    emitCombined(selectedCountry.dialCode, selectedCountry.code, raw)
  }

  const validation = useMemo(() => {
    const stripped = localNumber.replace(/\D/g, '').replace(/^0+/, '')
    if (!stripped) {
      return {
        valid: false,
        enteredDigitsCount: 0,
        errorAr: undefined,
      }
    }
    return validatePhoneForCountry(
      `${selectedCountry.dialCode} ${stripped}`,
      selectedCountry.code
    )
  }, [localNumber, selectedCountry])

  const showInlineError =
    (touched || validation.enteredDigitsCount >= selectedCountry.minDigits) &&
    validation.enteredDigitsCount > 0 &&
    !validation.valid

  return (
    <div className="space-y-1.5">
      {showDetectedBadge && (
        <div
          dir="rtl"
          className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-luminance/80 px-1"
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="text-sm leading-none">{selectedCountry.flag}</span>
            <span>الدولة المحددة:</span>
            <strong className="text-white font-bold">
              {selectedCountry.nameAr}
            </strong>
            <span
              dir="ltr"
              className="font-mono text-authority font-bold bg-authority/15 border border-authority/30 px-1.5 py-0.5 rounded-md text-[10px]"
            >
              {selectedCountry.dialCode}
            </span>
          </span>

          <span className="font-mono text-[10px] text-luminance/65">
            {detecting ? (
              <span className="text-authority animate-pulse">
                جاري تحديد الدولة...
              </span>
            ) : (
              <span>
                الحد المطلوب:{' '}
                <strong className="text-white">
                  {selectedCountry.minDigits === selectedCountry.maxDigits
                    ? `${selectedCountry.minDigits} أرقام`
                    : `${selectedCountry.minDigits}-${selectedCountry.maxDigits} أرقام`}
                </strong>{' '}
                ({validation.enteredDigitsCount}/{selectedCountry.minDigits})
              </span>
            )}
          </span>
        </div>
      )}

      <div
        dir="ltr"
        className={`flex items-stretch rounded-2xl bg-void/90 border transition-colors overflow-hidden ${
          showInlineError
            ? 'border-rose-500/75 focus-within:border-rose-500'
            : validation.valid
            ? 'border-emerald-500/60 focus-within:border-emerald-500'
            : 'border-authority/30 focus-within:border-authority'
        } ${className}`}
      >
        {/* Country Selector Dropdown with Flag + Dial Code */}
        <div className="relative flex items-center bg-depth/90 border-r border-authority/25">
          <select
            aria-label="كود الدولة"
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="bg-transparent text-white text-xs md:text-sm font-mono pl-3 pr-7 py-3.5 focus:outline-none cursor-pointer appearance-none"
          >
            {optionsList.map((c) => (
              <option key={c.code} value={c.code} className="bg-void text-white">
                {c.flag} {c.nameAr} ({c.dialCode})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 text-[10px] text-authority">
            ▼
          </span>
        </div>

        {/* Local Phone Number Input */}
        <input
          type="tel"
          inputMode="numeric"
          dir="ltr"
          required={required}
          value={localNumber}
          onChange={handleNumberChange}
          onBlur={() => setTouched(true)}
          placeholder={`${selectedCountry.placeholder}`}
          className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white font-mono placeholder-luminance/35 focus:outline-none"
        />

        {/* Live Status Icon */}
        {validation.enteredDigitsCount > 0 && (
          <div className="flex items-center pr-3.5">
            {validation.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : touched ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : null}
          </div>
        )}
      </div>

      {showInlineError && validation.errorAr && (
        <p
          dir="rtl"
          className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 px-1"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{validation.errorAr}</span>
        </p>
      )}
    </div>
  )
}
