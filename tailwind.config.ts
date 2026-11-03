import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Chillax', 'Expo Arabic', 'sans-serif'],
        body:    ['Chillax', 'Expo Arabic', 'sans-serif'],
        mono:    ['Chillax', 'Expo Arabic', 'sans-serif'],
        ar:      ['Expo Arabic', 'Chillax', 'sans-serif'],
      },
      colors: {
        void:      '#080608',
        authority: '#8B5CF6',
        luminance: '#E2D9F3',
        depth:     '#1A0F2E',
        crown:     '#4C1D95',
        ink:       '#080608',
        deep:      '#110A1E',
        lift:      '#1A0F2E',
        surface:   '#281646',
        line:      '#351F5C',
        chrome:    '#E2D9F3',
        'off-white': '#FFFFFF',
        gray:      '#9E8FC0',
        'gray-lt': '#E2D9F3',
        wa:        '#25D366',
      },
      letterSpacing: {
        widest2: '0.25em',
        widest3: '0.35em',
      },
    },
  },
  plugins: [],
}

export default config
