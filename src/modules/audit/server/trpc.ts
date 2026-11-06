import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { getSessionUser, AuditSessionUser } from './auth'

export interface AuditTRPCContext {
  user: AuditSessionUser | null
}

export async function createAuditTRPCContext(): Promise<AuditTRPCContext> {
  const user = await getSessionUser()
  return { user }
}

const t = initTRPC.context<AuditTRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Admin authentication required',
    })
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  })
})
