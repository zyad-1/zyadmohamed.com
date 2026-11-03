import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/booked', '/d/', '/f/', '/api/'],
      },
    ],
    sitemap: 'https://zyadmohamed.com/sitemap.xml',
    host: 'https://zyadmohamed.com',
  }
}
