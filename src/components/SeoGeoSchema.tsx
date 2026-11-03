import React from 'react'
import { FAQ_ITEMS, FOUNDER_INFO } from '@/lib/constants'

export default function SeoGeoSchema() {
  const siteUrl = 'https://zyadmohamed.com'

  const socialProfiles = [
    'https://instagram.com/zyadcreative',
    'https://www.tiktok.com/@zyadcreative',
    'https://www.youtube.com/@zyadcreative',
  ]

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: 'زياد سعدون',
        alternateName: [
          'Zyad Saadon',
          'زياد محمد',
          'Zyad Mohamed',
          'Zyad Mohamed APX',
          'Zyad Creative',
          'APX',
        ],
        jobTitle: 'Founder of APX — Personal Branding & Short-Form Video Strategist',
        url: siteUrl,
        image: {
          '@type': 'ImageObject',
          url: `${siteUrl}${FOUNDER_INFO.photoUrl}`,
          width: 800,
          height: 1000,
          caption: 'زياد سعدون | Zyad Saadon — مؤسس APX',
        },
        worksFor: {
          '@id': `${siteUrl}/#organization`,
        },
        knowsAbout: [
          'Personal Branding',
          'بناء البراند الشخصي',
          'Short-Form Video Content Marketing',
          'صناعة المحتوى للخبراء والأطباء وأصحاب البيزنس',
          'Instagram Reels',
          'TikTok',
          'YouTube Shorts',
          'Sales Funnels',
        ],
        sameAs: socialProfiles,
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'APX',
        alternateName: [
          'زياد سعدون APX',
          'Zyad Saadon APX',
          'Zyad Mohamed APX',
          'زياد محمد APX',
          'Zyad Creative',
        ],
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          '@id': `${siteUrl}/#logo`,
          url: `${siteUrl}/icon.png`,
          contentUrl: `${siteUrl}/icon.png`,
          width: 512,
          height: 512,
          caption: 'APX — زياد سعدون | Zyad Saadon',
        },
        image: `${siteUrl}/og-image.png`,
        founder: {
          '@id': `${siteUrl}/#person`,
        },
        sameAs: socialProfiles,
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${siteUrl}/#service`,
        name: 'زياد سعدون | Zyad Saadon — APX: منظومة البراند الشخصي والمحتوى للخبراء',
        alternateName: ['APX Agency', 'Zyad Mohamed APX', 'زياد محمد APX'],
        url: siteUrl,
        logo: `${siteUrl}/icon.png`,
        image: `${siteUrl}/og-image.png`,
        description:
          'منظومة Done-For-You لبناء البراند الشخصي وصناعة الفيديوهات القصيرة (Reels, TikTok, Shorts) للخبراء والأطباء والاستشاريين وأصحاب البيزنس لجذب عملاء مؤهلين خلال 90 يوماً في السعودية والإمارات ومصر.',
        founder: {
          '@id': `${siteUrl}/#person`,
        },
        provider: {
          '@id': `${siteUrl}/#organization`,
        },
        areaServed: [
          { '@type': 'Country', name: 'Saudi Arabia' },
          { '@type': 'Country', name: 'United Arab Emirates' },
          { '@type': 'Country', name: 'Egypt' },
        ],
        sameAs: socialProfiles,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'زياد سعدون | Zyad Saadon — APX',
        alternateName: ['Zyad Mohamed', 'زياد محمد', 'Zyad Mohamed APX', 'APX'],
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        about: {
          '@id': `${siteUrl}/#person`,
        },
        inLanguage: 'ar',
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: FAQ_ITEMS.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
