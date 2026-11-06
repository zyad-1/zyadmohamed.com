import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appAuditRouter } from '@/modules/audit/server/router'
import { createAuditTRPCContext } from '@/modules/audit/server/trpc'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appAuditRouter,
    createContext: () => createAuditTRPCContext(),
  })

export { handler as GET, handler as POST }
