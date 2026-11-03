export interface CountryOption {
  code: string
  nameAr: string
  dialCode: string
  flag: string
  placeholder: string
}

export const COUNTRIES_LIST: CountryOption[] = [
  { code: 'SA', nameAr: 'السعودية', dialCode: '+966', flag: '🇸🇦', placeholder: '50 000 0000' },
  { code: 'AE', nameAr: 'الإمارات', dialCode: '+971', flag: '🇦🇪', placeholder: '50 000 0000' },
  { code: 'EG', nameAr: 'مصر', dialCode: '+20', flag: '🇪🇬', placeholder: '100 000 0000' },
  { code: 'KW', nameAr: 'الكويت', dialCode: '+965', flag: '🇰🇼', placeholder: '5000 0000' },
  { code: 'QA', nameAr: 'قطر', dialCode: '+974', flag: '🇶🇦', placeholder: '3300 0000' },
  { code: 'BH', nameAr: 'البحرين', dialCode: '+973', flag: '🇧🇭', placeholder: '3600 0000' },
  { code: 'OM', nameAr: 'سلطنة عمان', dialCode: '+968', flag: '🇴🇲', placeholder: '9200 0000' },
  { code: 'JO', nameAr: 'الأردن', dialCode: '+962', flag: '🇯🇴', placeholder: '79 000 0000' },
  { code: 'IQ', nameAr: 'العراق', dialCode: '+964', flag: '🇮🇶', placeholder: '770 000 0000' },
  { code: 'PS', nameAr: 'فلسطين', dialCode: '+970', flag: '🇵🇸', placeholder: '59 000 0000' },
  { code: 'LB', nameAr: 'لبنان', dialCode: '+961', flag: '🇱🇧', placeholder: '70 000 000' },
  { code: 'SY', nameAr: 'سوريا', dialCode: '+963', flag: '🇸🇾', placeholder: '93 000 0000' },
  { code: 'YE', nameAr: 'اليمن', dialCode: '+967', flag: '🇾🇪', placeholder: '770 000 000' },
  { code: 'LY', nameAr: 'ليبيا', dialCode: '+218', flag: '🇱🇾', placeholder: '91 000 0000' },
  { code: 'SD', nameAr: 'السودان', dialCode: '+249', flag: '🇸🇩', placeholder: '91 000 0000' },
  { code: 'MA', nameAr: 'المغرب', dialCode: '+212', flag: '🇲🇦', placeholder: '612 000000' },
  { code: 'DZ', nameAr: 'الجزائر', dialCode: '+213', flag: '🇩🇿', placeholder: '550 00 00 00' },
  { code: 'TN', nameAr: 'تونس', dialCode: '+216', flag: '🇹🇳', placeholder: '20 000 000' },
  { code: 'TR', nameAr: 'تركيا', dialCode: '+90', flag: '🇹🇷', placeholder: '501 000 0000' },
  { code: 'GB', nameAr: 'بريطانيا', dialCode: '+44', flag: '🇬🇧', placeholder: '7700 900000' },
  { code: 'DE', nameAr: 'ألمانيا', dialCode: '+49', flag: '🇩🇪', placeholder: '1512 3456789' },
  { code: 'US', nameAr: 'أمريكا / كندا', dialCode: '+1', flag: '🇺🇸', placeholder: '201 555 0123' },
]

export const DEFAULT_COUNTRY_CODE = 'EG'

export function getCountryByCode(code?: string): CountryOption {
  const upper = (code || DEFAULT_COUNTRY_CODE).toUpperCase()
  return (
    COUNTRIES_LIST.find(c => c.code === upper) ||
    COUNTRIES_LIST.find(c => c.code === DEFAULT_COUNTRY_CODE)!
  )
}
