import ar from './ar.json'
import en from './en.json'

export type AuditLocale = 'ar' | 'en'
export type DigitMode = 'western' | 'arabic-indic'

export const dictionaries = {
  ar,
  en,
} as const

export function getDictionary(locale: AuditLocale) {
  return dictionaries[locale] ?? dictionaries.ar
}

const WESTERN_TO_ARABIC_INDIC: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
}

const ARABIC_INDIC_TO_WESTERN: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
}

/**
 * Converts Western digits (0-9) in any string or formatted number into
 * Arabic-Indic digits (٠-٩) when `mode === 'arabic-indic'`.
 */
export function formatDigits(input: string | number, mode: DigitMode = 'western'): string {
  const str = String(input)
  if (mode !== 'arabic-indic') return str
  return str.replace(/[0-9]/g, (d) => WESTERN_TO_ARABIC_INDIC[d] ?? d)
}

/**
 * Normalizes Arabic-Indic digits in user/CSV input to standard Western digits.
 */
export function normalizeToWesternDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (d) => ARABIC_INDIC_TO_WESTERN[d] ?? d)
}

/**
 * Formats an integer or decimal with thousands separators and applies digit mode.
 */
export function formatAuditNumber(
  value: number | null | undefined,
  options?: {
    digits?: DigitMode
    maximumFractionDigits?: number
    compact?: boolean
    locale?: AuditLocale
  }
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }
  const maxFrac = options?.maximumFractionDigits ?? 0
  let formatted: string
  if (options?.compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000) {
      formatted = `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
    } else {
      formatted = `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`
    }
  } else {
    formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: maxFrac,
    }).format(value)
  }
  return formatDigits(formatted, options?.digits ?? 'western')
}
