import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'APX — منظومة البراند الشخصي وصناعة المحتوى البيعي',
    short_name: 'APX',
    description:
      'نحول خبرتك إلى براند شخصي قوي ومنظومة فيديوهات قصيرة (Reels · TikTok · Shorts) تجلب لك عملاء مؤهلين ومكالمات مبيعات خلال 90 يوماً في الخليج ومصر.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080608',
    theme_color: '#8B5CF6',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      {
        src: '/favicon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
