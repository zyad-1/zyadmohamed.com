import { PrismaClient } from '@prisma/client'
import { createInitialAuditStore } from '../src/modules/audit/server/demoSeed'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding APX Audit Engine DEMO data (clearly marked DEMO)...')
  const store = createInitialAuditStore()
  const demo = store.audits[0]

  // 1. Upsert Settings
  await prisma.auditSettings.upsert({
    where: { id: 'default' },
    update: {
      ctaType: store.settings.ctaType,
      whatsappNumber: store.settings.whatsappNumber,
      whatsappMessageAr: store.settings.whatsappMessageAr,
      whatsappMessageEn: store.settings.whatsappMessageEn,
      bookingUrl: store.settings.bookingUrl,
      dmKeyword: store.settings.dmKeyword,
      instagramHandle: store.settings.instagramHandle,
      scarcityTextAr: store.settings.scarcityTextAr,
      scarcityTextEn: store.settings.scarcityTextEn,
      defaultLanguage: store.settings.defaultLanguage,
      defaultDigits: store.settings.defaultDigits,
      weightsJson: store.settings.weightsJson,
      defaultUnmeasuredJson: store.settings.defaultUnmeasuredJson,
    },
    create: {
      id: 'default',
      ctaType: store.settings.ctaType,
      whatsappNumber: store.settings.whatsappNumber,
      whatsappMessageAr: store.settings.whatsappMessageAr,
      whatsappMessageEn: store.settings.whatsappMessageEn,
      bookingUrl: store.settings.bookingUrl,
      dmKeyword: store.settings.dmKeyword,
      instagramHandle: store.settings.instagramHandle,
      scarcityTextAr: store.settings.scarcityTextAr,
      scarcityTextEn: store.settings.scarcityTextEn,
      defaultLanguage: store.settings.defaultLanguage,
      defaultDigits: store.settings.defaultDigits,
      weightsJson: store.settings.weightsJson,
      defaultUnmeasuredJson: store.settings.defaultUnmeasuredJson,
    },
  })

  // 2. Upsert Snippets
  for (const snip of store.snippets) {
    await prisma.recommendationSnippet.upsert({
      where: { id: snip.id },
      update: {
        categoryKey: snip.categoryKey,
        problemPattern: snip.problemPattern,
        titleAr: snip.titleAr,
        titleEn: snip.titleEn,
        bodyAr: snip.bodyAr,
        bodyEn: snip.bodyEn,
        impactAr: snip.impactAr,
        impactEn: snip.impactEn,
      },
      create: {
        id: snip.id,
        categoryKey: snip.categoryKey,
        problemPattern: snip.problemPattern,
        titleAr: snip.titleAr,
        titleEn: snip.titleEn,
        bodyAr: snip.bodyAr,
        bodyEn: snip.bodyEn,
        impactAr: snip.impactAr,
        impactEn: snip.impactEn,
      },
    })
  }

  // 3. Upsert DEMO Prospect & Audit
  await prisma.auditProspect.upsert({
    where: { id: demo.prospect.id },
    update: {
      handle: demo.prospect.handle,
      displayName: demo.prospect.displayName,
      niche: demo.prospect.niche,
      followers: demo.prospect.followers,
      followingCount: demo.prospect.followingCount,
      postsCount: demo.prospect.postsCount,
      profileUrl: demo.prospect.profileUrl,
      linkInBioUrl: demo.prospect.linkInBioUrl,
      notes: demo.prospect.notes,
    },
    create: {
      id: demo.prospect.id,
      handle: demo.prospect.handle,
      displayName: demo.prospect.displayName,
      niche: demo.prospect.niche,
      followers: demo.prospect.followers,
      followingCount: demo.prospect.followingCount,
      postsCount: demo.prospect.postsCount,
      profileUrl: demo.prospect.profileUrl,
      linkInBioUrl: demo.prospect.linkInBioUrl,
      notes: demo.prospect.notes,
    },
  })

  await prisma.audit.upsert({
    where: { id: demo.id },
    update: {
      status: demo.status,
      language: demo.language,
      shareToken: demo.shareToken,
      publishedAt: demo.publishedAt ? new Date(demo.publishedAt) : null,
      overallScore: demo.overallScore,
      summaryOpening: demo.summaryOpening,
      verdictLine: demo.verdictLine,
    },
    create: {
      id: demo.id,
      prospectId: demo.prospect.id,
      status: demo.status,
      language: demo.language,
      shareToken: demo.shareToken,
      publishedAt: demo.publishedAt ? new Date(demo.publishedAt) : null,
      overallScore: demo.overallScore,
      summaryOpening: demo.summaryOpening,
      verdictLine: demo.verdictLine,
    },
  })

  console.log(`✅ Seeded DEMO Audit: /a/${demo.shareToken}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
