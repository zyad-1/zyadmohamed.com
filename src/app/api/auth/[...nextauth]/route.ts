import NextAuth from 'next-auth'
import { auditAuthOptions } from '@/modules/audit/server/auth'

const handler = NextAuth(auditAuthOptions)

export { handler as GET, handler as POST }
