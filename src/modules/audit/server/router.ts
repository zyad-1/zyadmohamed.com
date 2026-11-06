import { z } from 'zod'
import { createTRPCRouter, publicProcedure, adminProcedure } from './trpc'
import {
  AuditSettingsInputSchema,
  RecommendationSnippetInputSchema,
  ReelInputSchema,
  SaveFullAuditSchema,
  TrackAuditEventSchema,
} from '../schemas'
import {
  scrapeInstagramPublicAccount,
  scrapeSingleInstagramReel,
} from './instagramScraper'
import {
  archiveAudit,
  createDraftAudit,
  deleteAudit,
  deleteSnippet,
  duplicateAudit,
  getAuditById,
  getAuditSettings,
  getPublicAuditByToken,
  listAuditsWithAnalytics,
  listSnippets,
  publishAudit,
  regenerateShareToken,
  saveAuditSettings,
  saveFullAudit,
  saveSnippet,
  trackAuditEvent,
  unpublishAudit,
} from './service'
import { isAuditBlobConfigured } from './db'

/**
 * Self-contained `auditRouter` for APX Audit Engine.
 * Can be merged into APX Solutions' main `appRouter` in one line:
 *   `export const appRouter = createTRPCRouter({ ..., audit: auditRouter })`
 */
export const auditRouter = createTRPCRouter({
  // Admin procedures
  list: adminProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return listAuditsWithAnalytics(input)
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return getAuditById(input.id)
    }),

  createDraft: adminProcedure
    .input(
      z.object({
        handle: z.string().min(1),
        displayName: z.string().min(1),
        niche: z.string().min(1),
        followers: z.number().int().nonnegative(),
        followingCount: z.number().int().nonnegative().nullable().optional(),
        postsCount: z.number().int().nonnegative().nullable().optional(),
        linkInBioUrl: z.string().nullable().optional(),
        avatarUrl: z.string().nullable().optional(),
        bio: z.string().nullable().optional(),
        bioLinks: z
          .array(
            z.object({
              title: z.string().default(''),
              url: z.string(),
            })
          )
          .optional(),
        reels: z.array(ReelInputSchema).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createDraftAudit(input)
    }),

  scrapeInstagram: adminProcedure
    .input(
      z.object({
        handleOrUrl: z.string().min(1),
        reelsCount: z.number().int().min(0).max(50).default(15),
      })
    )
    .mutation(async ({ input }) => {
      return scrapeInstagramPublicAccount(
        input.handleOrUrl,
        input.reelsCount && input.reelsCount > 0 ? input.reelsCount : 15
      )
    }),

  scrapeSingleReel: adminProcedure
    .input(
      z.object({
        reelUrlOrCode: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return scrapeSingleInstagramReel(input.reelUrlOrCode)
    }),

  saveFull: adminProcedure
    .input(SaveFullAuditSchema)
    .mutation(async ({ input }) => {
      return saveFullAudit(input)
    }),

  publish: adminProcedure
    .input(
      z.object({
        id: z.string(),
        expiresAt: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return publishAudit(input)
    }),

  unpublish: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return unpublishAudit(input.id)
    }),

  regenerateToken: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return regenerateShareToken(input.id)
    }),

  duplicate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return duplicateAudit(input.id)
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return archiveAudit(input.id)
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteAudit(input.id)
    }),

  // Recommendation Snippets Library
  listSnippets: adminProcedure.query(async () => {
    return listSnippets()
  }),

  saveSnippet: adminProcedure
    .input(RecommendationSnippetInputSchema)
    .mutation(async ({ input }) => {
      return saveSnippet(input)
    }),

  deleteSnippet: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteSnippet(input.id)
    }),

  // Settings & Storage Status
  getStorageStatus: adminProcedure.query(async () => {
    return {
      blobConnected: isAuditBlobConfigured(),
    }
  }),

  getSettings: adminProcedure.query(async () => {
    return getAuditSettings()
  }),

  saveSettings: adminProcedure
    .input(AuditSettingsInputSchema)
    .mutation(async ({ input }) => {
      return saveAuditSettings(input)
    }),

  // Public procedures (token-gated, no admin fields exposed)
  getPublicByToken: publicProcedure
    .input(z.object({ token: z.string().min(8) }))
    .query(async ({ input }) => {
      return getPublicAuditByToken(input.token)
    }),

  trackEvent: publicProcedure
    .input(TrackAuditEventSchema)
    .mutation(async ({ input }) => {
      return trackAuditEvent(input)
    }),
})

export const appAuditRouter = createTRPCRouter({
  audit: auditRouter,
})

export type AuditRouter = typeof auditRouter
export type AppAuditRouter = typeof appAuditRouter
