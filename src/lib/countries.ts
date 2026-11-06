export interface CountryOption {
  code: string
  nameAr: string
  nameEn: string
  dialCode: string
  flag: string
  placeholder: string
  minDigits: number
  maxDigits: number
}

export const COUNTRIES_LIST: CountryOption[] = [
  // Arab Countries
  { code: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', placeholder: '50 000 0000', minDigits: 9, maxDigits: 9 },
  { code: 'AE', nameAr: 'الإمارات', nameEn: 'UAE', dialCode: '+971', flag: '🇦🇪', placeholder: '50 000 0000', minDigits: 9, maxDigits: 9 },
  { code: 'EG', nameAr: 'مصر', nameEn: 'Egypt', dialCode: '+20', flag: '🇪🇬', placeholder: '100 000 0000', minDigits: 10, maxDigits: 10 },
  { code: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', dialCode: '+965', flag: '🇰🇼', placeholder: '5000 0000', minDigits: 8, maxDigits: 8 },
  { code: 'QA', nameAr: 'قطر', nameEn: 'Qatar', dialCode: '+974', flag: '🇶🇦', placeholder: '3300 0000', minDigits: 8, maxDigits: 8 },
  { code: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain', dialCode: '+973', flag: '🇧🇭', placeholder: '3600 0000', minDigits: 8, maxDigits: 8 },
  { code: 'OM', nameAr: 'سلطنة عمان', nameEn: 'Oman', dialCode: '+968', flag: '🇴🇲', placeholder: '9200 0000', minDigits: 8, maxDigits: 8 },
  { code: 'JO', nameAr: 'الأردن', nameEn: 'Jordan', dialCode: '+962', flag: '🇯🇴', placeholder: '79 000 0000', minDigits: 9, maxDigits: 9 },
  { code: 'IQ', nameAr: 'العراق', nameEn: 'Iraq', dialCode: '+964', flag: '🇮🇶', placeholder: '770 000 0000', minDigits: 10, maxDigits: 10 },
  { code: 'PS', nameAr: 'فلسطين', nameEn: 'Palestine', dialCode: '+970', flag: '🇵🇸', placeholder: '59 000 0000', minDigits: 9, maxDigits: 9 },
  { code: 'LB', nameAr: 'لبنان', nameEn: 'Lebanon', dialCode: '+961', flag: '🇱🇧', placeholder: '70 000 000', minDigits: 7, maxDigits: 8 },
  { code: 'SY', nameAr: 'سوريا', nameEn: 'Syria', dialCode: '+963', flag: '🇸🇾', placeholder: '93 000 0000', minDigits: 9, maxDigits: 9 },
  { code: 'YE', nameAr: 'اليمن', nameEn: 'Yemen', dialCode: '+967', flag: '🇾🇪', placeholder: '770 000 000', minDigits: 9, maxDigits: 9 },
  { code: 'LY', nameAr: 'ليبيا', nameEn: 'Libya', dialCode: '+218', flag: '🇱🇾', placeholder: '91 000 0000', minDigits: 9, maxDigits: 9 },
  { code: 'SD', nameAr: 'السودان', nameEn: 'Sudan', dialCode: '+249', flag: '🇸🇩', placeholder: '91 000 0000', minDigits: 9, maxDigits: 9 },
  { code: 'MA', nameAr: 'المغرب', nameEn: 'Morocco', dialCode: '+212', flag: '🇲🇦', placeholder: '612 000000', minDigits: 9, maxDigits: 9 },
  { code: 'DZ', nameAr: 'الجزائر', nameEn: 'Algeria', dialCode: '+213', flag: '🇩🇿', placeholder: '550 00 00 00', minDigits: 9, maxDigits: 9 },
  { code: 'TN', nameAr: 'تونس', nameEn: 'Tunisia', dialCode: '+216', flag: '🇹🇳', placeholder: '20 000 000', minDigits: 8, maxDigits: 8 },
  { code: 'MR', nameAr: 'موريتانيا', nameEn: 'Mauritania', dialCode: '+222', flag: '🇲🇷', placeholder: '22 00 00 00', minDigits: 8, maxDigits: 8 },
  // Europe, North America, Asia & Global (including common VPN locations)
  { code: 'US', nameAr: 'أمريكا', nameEn: 'United States', dialCode: '+1', flag: '🇺🇸', placeholder: '201 555 0123', minDigits: 10, maxDigits: 10 },
  { code: 'CA', nameAr: 'كندا', nameEn: 'Canada', dialCode: '+1', flag: '🇨🇦', placeholder: '416 555 0123', minDigits: 10, maxDigits: 10 },
  { code: 'GB', nameAr: 'بريطانيا', nameEn: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', placeholder: '7700 900000', minDigits: 10, maxDigits: 10 },
  { code: 'DE', nameAr: 'ألمانيا', nameEn: 'Germany', dialCode: '+49', flag: '🇩🇪', placeholder: '1512 3456789', minDigits: 10, maxDigits: 11 },
  { code: 'FR', nameAr: 'فرنسا', nameEn: 'France', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78', minDigits: 9, maxDigits: 9 },
  { code: 'NL', nameAr: 'هولندا', nameEn: 'Netherlands', dialCode: '+31', flag: '🇳🇱', placeholder: '6 12345678', minDigits: 9, maxDigits: 9 },
  { code: 'CH', nameAr: 'سويسرا', nameEn: 'Switzerland', dialCode: '+41', flag: '🇨🇭', placeholder: '78 123 45 67', minDigits: 9, maxDigits: 9 },
  { code: 'SE', nameAr: 'السويد', nameEn: 'Sweden', dialCode: '+46', flag: '🇸🇪', placeholder: '70 123 45 67', minDigits: 9, maxDigits: 9 },
  { code: 'NO', nameAr: 'النرويج', nameEn: 'Norway', dialCode: '+47', flag: '🇳🇴', placeholder: '406 12 345', minDigits: 8, maxDigits: 8 },
  { code: 'DK', nameAr: 'الدنمارك', nameEn: 'Denmark', dialCode: '+45', flag: '🇩🇰', placeholder: '20 12 34 56', minDigits: 8, maxDigits: 8 },
  { code: 'FI', nameAr: 'فنلندا', nameEn: 'Finland', dialCode: '+358', flag: '🇫🇮', placeholder: '40 1234567', minDigits: 9, maxDigits: 10 },
  { code: 'IT', nameAr: 'إيطاليا', nameEn: 'Italy', dialCode: '+39', flag: '🇮🇹', placeholder: '312 345 6789', minDigits: 9, maxDigits: 10 },
  { code: 'ES', nameAr: 'إسبانيا', nameEn: 'Spain', dialCode: '+34', flag: '🇪🇸', placeholder: '612 34 56 78', minDigits: 9, maxDigits: 9 },
  { code: 'PT', nameAr: 'البرتغال', nameEn: 'Portugal', dialCode: '+351', flag: '🇵🇹', placeholder: '912 345 678', minDigits: 9, maxDigits: 9 },
  { code: 'AT', nameAr: 'النمسا', nameEn: 'Austria', dialCode: '+43', flag: '🇦🇹', placeholder: '664 123456', minDigits: 9, maxDigits: 11 },
  { code: 'BE', nameAr: 'بلجيكا', nameEn: 'Belgium', dialCode: '+32', flag: '🇧🇪', placeholder: '470 12 34 56', minDigits: 9, maxDigits: 9 },
  { code: 'IE', nameAr: 'أيرلندا', nameEn: 'Ireland', dialCode: '+353', flag: '🇮🇪', placeholder: '85 123 4567', minDigits: 9, maxDigits: 9 },
  { code: 'PL', nameAr: 'بولندا', nameEn: 'Poland', dialCode: '+48', flag: '🇵🇱', placeholder: '512 345 678', minDigits: 9, maxDigits: 9 },
  { code: 'RO', nameAr: 'رومانيا', nameEn: 'Romania', dialCode: '+40', flag: '🇷🇴', placeholder: '712 345 678', minDigits: 9, maxDigits: 9 },
  { code: 'CZ', nameAr: 'التشيك', nameEn: 'Czechia', dialCode: '+420', flag: '🇨🇿', placeholder: '601 123 456', minDigits: 9, maxDigits: 9 },
  { code: 'GR', nameAr: 'اليونان', nameEn: 'Greece', dialCode: '+30', flag: '🇬🇷', placeholder: '691 234 5678', minDigits: 10, maxDigits: 10 },
  { code: 'TR', nameAr: 'تركيا', nameEn: 'Turkey', dialCode: '+90', flag: '🇹🇷', placeholder: '501 000 0000', minDigits: 10, maxDigits: 10 },
  { code: 'CY', nameAr: 'قبرص', nameEn: 'Cyprus', dialCode: '+357', flag: '🇨🇾', placeholder: '96 123456', minDigits: 8, maxDigits: 8 },
  { code: 'RU', nameAr: 'روسيا', nameEn: 'Russia', dialCode: '+7', flag: '🇷🇺', placeholder: '912 345 6789', minDigits: 10, maxDigits: 10 },
  { code: 'UA', nameAr: 'أوكرانيا', nameEn: 'Ukraine', dialCode: '+380', flag: '🇺🇦', placeholder: '50 123 4567', minDigits: 9, maxDigits: 9 },
  { code: 'AU', nameAr: 'أستراليا', nameEn: 'Australia', dialCode: '+61', flag: '🇦🇺', placeholder: '412 345 678', minDigits: 9, maxDigits: 9 },
  { code: 'NZ', nameAr: 'نيوزيلندا', nameEn: 'New Zealand', dialCode: '+64', flag: '🇳🇿', placeholder: '21 123 4567', minDigits: 8, maxDigits: 10 },
  { code: 'SG', nameAr: 'سنغافورة', nameEn: 'Singapore', dialCode: '+65', flag: '🇸🇬', placeholder: '8123 4567', minDigits: 8, maxDigits: 8 },
  { code: 'MY', nameAr: 'ماليزيا', nameEn: 'Malaysia', dialCode: '+60', flag: '🇲🇾', placeholder: '12 345 6789', minDigits: 9, maxDigits: 10 },
  { code: 'JP', nameAr: 'اليابان', nameEn: 'Japan', dialCode: '+81', flag: '🇯🇵', placeholder: '90 1234 5678', minDigits: 10, maxDigits: 10 },
  { code: 'KR', nameAr: 'كوريا الجنوبية', nameEn: 'South Korea', dialCode: '+82', flag: '🇰🇷', placeholder: '10 1234 5678', minDigits: 9, maxDigits: 10 },
  { code: 'CN', nameAr: 'الصين', nameEn: 'China', dialCode: '+86', flag: '🇨🇳', placeholder: '131 2345 6789', minDigits: 11, maxDigits: 11 },
  { code: 'HK', nameAr: 'هونغ كونغ', nameEn: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', placeholder: '5123 4567', minDigits: 8, maxDigits: 8 },
  { code: 'IN', nameAr: 'الهند', nameEn: 'India', dialCode: '+91', flag: '🇮🇳', placeholder: '98765 43210', minDigits: 10, maxDigits: 10 },
  { code: 'PK', nameAr: 'باكستان', nameEn: 'Pakistan', dialCode: '+92', flag: '🇵🇰', placeholder: '301 2345678', minDigits: 10, maxDigits: 10 },
  { code: 'ID', nameAr: 'إندونيسيا', nameEn: 'Indonesia', dialCode: '+62', flag: '🇮🇩', placeholder: '812 345 678', minDigits: 9, maxDigits: 11 },
  { code: 'TH', nameAr: 'تايلاند', nameEn: 'Thailand', dialCode: '+66', flag: '🇹🇭', placeholder: '81 234 5678', minDigits: 9, maxDigits: 9 },
  { code: 'BR', nameAr: 'البرازيل', nameEn: 'Brazil', dialCode: '+55', flag: '🇧🇷', placeholder: '11 91234 5678', minDigits: 10, maxDigits: 11 },
  { code: 'MX', nameAr: 'المكسيك', nameEn: 'Mexico', dialCode: '+52', flag: '🇲🇽', placeholder: '55 1234 5678', minDigits: 10, maxDigits: 10 },
  { code: 'AR', nameAr: 'الأرجنتين', nameEn: 'Argentina', dialCode: '+54', flag: '🇦🇷', placeholder: '9 11 1234 5678', minDigits: 10, maxDigits: 11 },
  { code: 'ZA', nameAr: 'جنوب أفريقيا', nameEn: 'South Africa', dialCode: '+27', flag: '🇿🇦', placeholder: '71 123 4567', minDigits: 9, maxDigits: 9 },
  { code: 'NG', nameAr: 'نيجيريا', nameEn: 'Nigeria', dialCode: '+234', flag: '🇳🇬', placeholder: '802 123 4567', minDigits: 10, maxDigits: 10 },
]

export const DEFAULT_COUNTRY_CODE = 'EG'

/**
 * Converts any 2-letter ISO country code (e.g. 'NL', 'SA', 'JP') into its Unicode Flag Emoji
 */
export function isoToFlagEmoji(code: string): string {
  const clean = (code || '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(clean)) return '🌐'
  return String.fromCodePoint(
    ...clean.split('').map((char) => 127397 + char.charCodeAt(0))
  )
}

const EXTRA_DIAL_CODES: Record<string, { dial: string; nameAr: string; nameEn: string; minDigits?: number; maxDigits?: number }> = {
  LU: { dial: '+352', nameAr: 'لوكسمبورغ', nameEn: 'Luxembourg', minDigits: 8, maxDigits: 9 },
  HU: { dial: '+36', nameAr: 'المجر', nameEn: 'Hungary', minDigits: 9, maxDigits: 9 },
  BG: { dial: '+359', nameAr: 'بلغاريا', nameEn: 'Bulgaria', minDigits: 9, maxDigits: 9 },
  HR: { dial: '+385', nameAr: 'كرواتيا', nameEn: 'Croatia', minDigits: 8, maxDigits: 9 },
  RS: { dial: '+381', nameAr: 'صربيا', nameEn: 'Serbia', minDigits: 8, maxDigits: 9 },
  SK: { dial: '+421', nameAr: 'سلوفاكيا', nameEn: 'Slovakia', minDigits: 9, maxDigits: 9 },
  SI: { dial: '+386', nameAr: 'سلوفينيا', nameEn: 'Slovenia', minDigits: 8, maxDigits: 8 },
  EE: { dial: '+372', nameAr: 'إستونيا', nameEn: 'Estonia', minDigits: 7, maxDigits: 8 },
  LV: { dial: '+371', nameAr: 'لاتفيا', nameEn: 'Latvia', minDigits: 8, maxDigits: 8 },
  LT: { dial: '+370', nameAr: 'ليتوانيا', nameEn: 'Lithuania', minDigits: 8, maxDigits: 8 },
  IS: { dial: '+354', nameAr: 'آيسلندا', nameEn: 'Iceland', minDigits: 7, maxDigits: 7 },
  MT: { dial: '+356', nameAr: 'مالطا', nameEn: 'Malta', minDigits: 8, maxDigits: 8 },
  AL: { dial: '+355', nameAr: 'ألبانيا', nameEn: 'Albania', minDigits: 9, maxDigits: 9 },
  PH: { dial: '+63', nameAr: 'الفلبين', nameEn: 'Philippines', minDigits: 10, maxDigits: 10 },
  VN: { dial: '+84', nameAr: 'فيتنام', nameEn: 'Vietnam', minDigits: 9, maxDigits: 10 },
  TW: { dial: '+886', nameAr: 'تايوان', nameEn: 'Taiwan', minDigits: 9, maxDigits: 9 },
  BD: { dial: '+880', nameAr: 'بنغلاديش', nameEn: 'Bangladesh', minDigits: 10, maxDigits: 10 },
  LK: { dial: '+94', nameAr: 'سريلانكا', nameEn: 'Sri Lanka', minDigits: 9, maxDigits: 9 },
  KE: { dial: '+254', nameAr: 'كينيا', nameEn: 'Kenya', minDigits: 9, maxDigits: 9 },
  GH: { dial: '+233', nameAr: 'غانا', nameEn: 'Ghana', minDigits: 9, maxDigits: 9 },
  CL: { dial: '+56', nameAr: 'تشيلي', nameEn: 'Chile', minDigits: 9, maxDigits: 9 },
  CO: { dial: '+57', nameAr: 'كولومبيا', nameEn: 'Colombia', minDigits: 10, maxDigits: 10 },
  PE: { dial: '+51', nameAr: 'بيرو', nameEn: 'Peru', minDigits: 9, maxDigits: 9 },
}

export function getCountryByCode(
  code?: string,
  fallbackName?: string,
  fallbackDialCode?: string
): CountryOption {
  const upper = (code || DEFAULT_COUNTRY_CODE).trim().toUpperCase()
  const existing = COUNTRIES_LIST.find((c) => c.code === upper)
  if (existing) return existing

  if (/^[A-Z]{2}$/.test(upper)) {
    const extra = EXTRA_DIAL_CODES[upper]
    const dial = fallbackDialCode
      ? fallbackDialCode.startsWith('+')
        ? fallbackDialCode
        : `+${fallbackDialCode}`
      : extra?.dial || '+1'
    return {
      code: upper,
      nameAr: extra?.nameAr || fallbackName || upper,
      nameEn: extra?.nameEn || fallbackName || upper,
      dialCode: dial,
      flag: isoToFlagEmoji(upper),
      placeholder: '50 000 0000',
      minDigits: extra?.minDigits || 8,
      maxDigits: extra?.maxDigits || 11,
    }
  }

  return COUNTRIES_LIST.find((c) => c.code === DEFAULT_COUNTRY_CODE)!
}

/**
 * Finds the matching country from a full international phone string (e.g. "+65 81234567" or "+20 1000000000")
 */
export function resolveCountryFromFullPhone(
  fullPhone: string,
  fallbackCountryCode?: string
): { country: CountryOption; nationalDigits: string } {
  const trimmed = (fullPhone || '').trim()
  // Sort by longest dialCode first so +966 matches before +96
  const sorted = [...COUNTRIES_LIST].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  )
  for (const c of sorted) {
    if (trimmed.startsWith(c.dialCode)) {
      const rest = trimmed
        .slice(c.dialCode.length)
        .replace(/\D/g, '')
        .replace(/^0+/, '')
      return { country: c, nationalDigits: rest }
    }
  }
  const fallback = getCountryByCode(fallbackCountryCode)
  const digits = trimmed
    .replace(fallback.dialCode, '')
    .replace(/\D/g, '')
    .replace(/^0+/, '')
  return { country: fallback, nationalDigits: digits }
}

/**
 * Validates a phone number strictly against the selected country's minimum and maximum national digit rules
 * (e.g. Singapore = 8 digits, Egypt = 10 digits without leading 0, Saudi Arabia = 9 digits, UAE = 9 digits).
 */
export function validatePhoneForCountry(
  fullPhoneOrLocal: string,
  countryCode?: string
): {
  valid: boolean
  errorAr?: string
  country: CountryOption
  enteredDigitsCount: number
} {
  const { country, nationalDigits } = resolveCountryFromFullPhone(
    fullPhoneOrLocal,
    countryCode
  )
  const count = nationalDigits.length

  if (count === 0) {
    return {
      valid: false,
      errorAr: `يرجى كتابة رقم الهاتف الخاص بك لدولة ${country.nameAr} (${country.dialCode})`,
      country,
      enteredDigitsCount: 0,
    }
  }

  if (count < country.minDigits) {
    return {
      valid: false,
      errorAr: `رقم الهاتف غير مكتمل لدولة ${country.nameAr} (${country.flag} ${country.dialCode}) — الحد الأدنى الصحيح هو ${country.minDigits} أرقام (كتبت ${count} فقط).`,
      country,
      enteredDigitsCount: count,
    }
  }

  if (count > country.maxDigits) {
    return {
      valid: false,
      errorAr: `رقم الهاتف أطول من الحد المسموح لدولة ${country.nameAr} (${country.flag} ${country.dialCode}) — الحد الأقصى هو ${country.maxDigits} أرقام.`,
      country,
      enteredDigitsCount: count,
    }
  }

  // Country-specific prefix sanity checks
  if (country.code === 'EG' && !/^1[0125]\d{8}$/.test(nationalDigits)) {
    return {
      valid: false,
      errorAr: 'يرجى إدخال رقم موبايل مصري صحيح (مثال: 1000000000 بعد كود +20).',
      country,
      enteredDigitsCount: count,
    }
  }

  if (country.code === 'SG' && !/^[689]\d{7}$/.test(nationalDigits)) {
    return {
      valid: false,
      errorAr: 'يرجى إدخال رقم هاتف سنغافوري صحيح مكون من 8 أرقام يبدأ بـ 8 أو 9 أو 6.',
      country,
      enteredDigitsCount: count,
    }
  }

  if ((country.code === 'SA' || country.code === 'AE') && !/^5\d{8}$/.test(nationalDigits)) {
    return {
      valid: false,
      errorAr: `يرجى إدخال رقم جوال صحيح لدولة ${country.nameAr} مكون من 9 أرقام يبدأ بـ 5.`,
      country,
      enteredDigitsCount: count,
    }
  }

  // Reject all-identical repeating digits like 1111111111 or 99999999
  if (/^(\d)\1{6,}$/.test(nationalDigits)) {
    return {
      valid: false,
      errorAr: 'يرجى إدخال رقم هاتف حقيقي وصحيح.',
      country,
      enteredDigitsCount: count,
    }
  }

  return {
    valid: true,
    country,
    enteredDigitsCount: count,
  }
}

export interface DetectedGeoInfo {
  countryCode: string
  countryName: string
  dialCode: string
  flag: string
}

function saveGeoToWindowCache(info: DetectedGeoInfo): DetectedGeoInfo {
  if (typeof window !== 'undefined') {
    ;(window as unknown as { __apxGeoCache?: DetectedGeoInfo }).__apxGeoCache = info
  }
  return info
}

/**
 * Multi-provider VPN-aware visitor country detector.
 * Queries client-side IP APIs first (so browser VPN extensions are immediately detected!)
 * and falls back to /api/geo.
 */
export async function detectVisitorGeo(): Promise<DetectedGeoInfo> {
  // 1. Try ipwho.is (fast, CORS-enabled, returns calling_code + country_code + country)
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2400)
    const res = await fetch(`https://ipwho.is/?t=${Date.now()}`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    clearTimeout(t)
    if (res.ok) {
      const data = await res.json()
      const code = String(data?.country_code || '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(code)) {
        const dial = data?.calling_code ? `+${String(data.calling_code).replace(/^\+/, '')}` : undefined
        const c = getCountryByCode(code, data?.country, dial)
        return saveGeoToWindowCache({
          countryCode: c.code,
          countryName: c.nameAr,
          dialCode: c.dialCode,
          flag: c.flag,
        })
      }
    }
  } catch {
    // Continue to next provider
  }

  // 2. Try api.country.is (ultra-fast client-side IP lookup)
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2200)
    const res = await fetch(`https://api.country.is/?t=${Date.now()}`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    clearTimeout(t)
    if (res.ok) {
      const data = await res.json()
      const code = String(data?.country || '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(code)) {
        const c = getCountryByCode(code)
        return saveGeoToWindowCache({
          countryCode: c.code,
          countryName: c.nameAr,
          dialCode: c.dialCode,
          flag: c.flag,
        })
      }
    }
  } catch {
    // Continue to next provider
  }

  // 3. Try ipapi.co/json
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2200)
    const res = await fetch('https://ipapi.co/json/', {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    clearTimeout(t)
    if (res.ok) {
      const data = await res.json()
      const code = String(data?.country_code || '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(code)) {
        const c = getCountryByCode(code, data?.country_name, data?.country_calling_code)
        return saveGeoToWindowCache({
          countryCode: c.code,
          countryName: c.nameAr,
          dialCode: c.dialCode,
          flag: c.flag,
        })
      }
    }
  } catch {
    // Continue to server fallback
  }

  // 4. Fallback to server-side /api/geo
  try {
    const res = await fetch(`/api/geo?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      const code = String(data?.countryCode || '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(code)) {
        const c = getCountryByCode(code, data?.countryName, data?.dialCode)
        return saveGeoToWindowCache({
          countryCode: c.code,
          countryName: c.nameAr,
          dialCode: c.dialCode,
          flag: c.flag,
        })
      }
    }
  } catch {
    // Fallback below
  }

  const def = getCountryByCode(DEFAULT_COUNTRY_CODE)
  return {
    countryCode: def.code,
    countryName: def.nameAr,
    dialCode: def.dialCode,
    flag: def.flag,
  }
}

/**
 * Server-side real IP geo resolver for telemetry endpoints (/api/audit/events, /api/insights).
 * Never fabricates Saudi Arabia ('SA') — checks client payload first, then CDN headers, then real IP lookup.
 */
export async function resolveServerTelemetryGeo(
  req: Request,
  clientCode?: unknown,
  clientName?: unknown
): Promise<{ countryCode: string; countryName: string } | null> {
  const cleanClientCode = String(clientCode || '').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(cleanClientCode) && cleanClientCode !== 'XX') {
    const c = getCountryByCode(cleanClientCode, typeof clientName === 'string' ? clientName : undefined)
    return { countryCode: c.code, countryName: c.nameAr }
  }

  const headerCountry =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-country-code')
  if (headerCountry) {
    const upper = headerCountry.trim().toUpperCase()
    if (/^[A-Z]{2}$/.test(upper) && upper !== 'XX') {
      const c = getCountryByCode(upper)
      return { countryCode: c.code, countryName: c.nameAr }
    }
  }

  const forwardedFor = req.headers.get('x-forwarded-for')
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ''
  const isLocalIp =
    !clientIp ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.')

  const lookupUrl = isLocalIp
    ? 'https://api.country.is/'
    : `https://api.country.is/${encodeURIComponent(clientIp)}`

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1600)
    const res = await fetch(lookupUrl, { signal: ctrl.signal, cache: 'no-store' })
    clearTimeout(t)
    if (res.ok) {
      const data = await res.json()
      const detected = String(data?.country || '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(detected) && detected !== 'XX') {
        const c = getCountryByCode(detected)
        return { countryCode: c.code, countryName: c.nameAr }
      }
    }
  } catch {
    // Ignore
  }

  try {
    const ipWhoUrl = isLocalIp
      ? 'https://ipwho.is/'
      : `https://ipwho.is/${encodeURIComponent(clientIp)}`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1600)
    const res = await fetch(ipWhoUrl, { signal: ctrl.signal, cache: 'no-store' })
    clearTimeout(t)
    if (res.ok) {
      const data = await res.json()
      const detected = String(data?.country_code || '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(detected) && detected !== 'XX') {
        const c = getCountryByCode(detected, data?.country)
        return { countryCode: c.code, countryName: c.nameAr }
      }
    }
  } catch {
    // Ignore
  }

  return null
}
