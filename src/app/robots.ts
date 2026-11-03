import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/icon.png', '/favicon.ico', '/og-image.png', '/llms.txt'],
        disallow: ['/admin', '/api/'],
      },
      {
        // Explicitly allow AI Search / GEO Crawlers (ChatGPT, Perplexity, Claude, Gemini, Apple)
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
          'Applebot-Extended',
        ],
        allow: ['/', '/llms.txt'],
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: 'https://zyadmohamed.com/sitemap.xml',
    host: 'https://zyadmohamed.com',
  }
}
