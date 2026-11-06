import type { Config } from 'tailwindcss'

export const apxPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        apx: {
          void: 'var(--apx-void, #080608)',
          authority: 'var(--apx-authority, #8B5CF6)',
          crown: 'var(--apx-crown, #4C1D95)',
          luminance: 'var(--apx-luminance, #E2D9F3)',
          'surface-1': 'var(--apx-surface-1, #110B1B)',
          'surface-2': 'var(--apx-surface-2, #1A0F2E)',
          'surface-3': 'var(--apx-surface-3, #24163D)',
          border: 'var(--apx-border, rgba(139, 92, 246, 0.2))',
          strong: 'var(--apx-strong, #4BA37A)',
          warning: 'var(--apx-warning, #D49A3D)',
          weak: 'var(--apx-weak, #C95D63)',
        },
      },
      fontFamily: {
        'apx-display': ['Chillax', 'Expo Arabic'],
        'apx-body': ['Chillax', 'Expo Arabic'],
        'apx-arabic': ['Expo Arabic', 'Chillax'],
        en: ['Chillax', 'Expo Arabic'],
        ar: ['Expo Arabic', 'Chillax'],
      },
    },
  },
}

export default apxPreset
