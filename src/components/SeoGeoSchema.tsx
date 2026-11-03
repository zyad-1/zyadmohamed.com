import React from 'react'
import { FAQ_ITEMS, FOUNDER_INFO } from '@/lib/constants'

export default function SeoGeoSchema() {
  const siteUrl = 'https://zyadmohamed.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'ProfessionalService'],
        '@id': `${siteUrl}/#organization`,
        name: 'APX',
        alternateName: ['APX Agency', 'وكالة APX لبناء البراند الشخصي وصناعة المحتوى'],
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          '@id': `${siteUrl}/#logo`,
          url: `${siteUrl}/icon.png`,
          contentUrl: `${siteUrl}/icon.png`,
          width: 512,
          height: 512,
          caption: 'APX',
        },
        image: `${siteUrl}/og-image.png`,
        description:
          'منظومة متكاملة (Done-For-You) لبناء البراند الشخصي وصناعة محتوى الفيديو القصير (Reels, TikTok, Shorts) للخبراء والأطباء وأصحاب البيزنس في الخليج ومصر لتحقيق عملاء مؤهلين خلال 90 يوماً.',
        founder: {
          '@id': `${siteUrl}/#founder`,
        },
        areaServed: [
          { '@type': 'Country', name: 'Saudi Arabia' },
          { '@type': 'Country', name: 'United Arab Emirates' },
          { '@type': 'Country', name: 'Egypt' },
          { '@type': 'Country', name: 'Kuwait' },
          { '@type': 'Country', name: 'Qatar' },
          { '@type': 'Country', name: 'Bahrain' },
          { '@type': 'Country', name: 'Oman' },
        ],
        knowsAbout: [
          'Personal Branding',
          'بناء البراند الشخصي',
          'Content Marketing',
          'صناعة المحتوى البيعي',
          'Short-Form Video Editing',
          'مونتاج الفيديوهات القصيرة والريلز',
          'Instagram Reels Strategy',
          'TikTok Growth Strategy',
          'YouTube Shorts',
          'High-Ticket Sales Funnels',
        ],
        sameAs: ['https://instagram.com/zyadcreative'],
      },
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#founder`,
        name: FOUNDER_INFO.nameAr,
        alternateName: FOUNDER_INFO.nameEn,
        jobTitle: 'Founder of APX',
        image: `${siteUrl}${FOUNDER_INFO.photoUrl}`,
        url: siteUrl,
        worksFor: {
          '@id': `${siteUrl}/#organization`,
        },
        sameAs: ['https://instagram.com/zyadcreative'],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'APX',
        alternateName: 'APX Agency',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        inLanguage: 'ar',
      },
      {
        '@type': 'Service',
        '@id': `${siteUrl}/#service`,
        name: 'منظومة البراند الشخصي وصناعة الفيديوهات القصيرة (Done-For-You)',
        provider: {
          '@id': `${siteUrl}/#organization`,
        },
        serviceType: 'Personal Branding & Short-Form Video Content Marketing',
        areaServed: ['SA', 'AE', 'EG', 'KW', 'QA', 'BH', 'OM'],
        description:
          'كتابة السكريبتات، توجيهات التصوير عن بُعد، مونتاج الفيديوهات القصيرة (Reels, TikTok, Shorts)، وربط المحتوى بـ Funnel المبيعات لجذب عملاء مؤهلين خلال 90 يوماً.',
        offers: {
          '@type': 'Offer',
          url: `${siteUrl}/#book`,
          availability: 'https://schema.org/InStock',
        },
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
