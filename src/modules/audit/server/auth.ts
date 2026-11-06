import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { isAdminAuthenticated } from '@/lib/auth'

export type AuditUserRole = 'ADMIN' | 'CLIENT'

export interface AuditSessionUser {
  id: string
  email?: string
  name?: string
  role: AuditUserRole
}

export const auditAuthOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.ADMIN_PASSWORD || 'apx-audit-secret-key-2026',
  providers: [
    CredentialsProvider({
      name: 'APX Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@zyadmohamed.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const expectedPassword = process.env.ADMIN_PASSWORD || 'zyad2025'
        const expectedEmail = (process.env.ADMIN_EMAIL || 'admin@zyadmohamed.com').toLowerCase()
        if (!credentials?.password) return null

        const emailMatches =
          !credentials.email ||
          credentials.email.toLowerCase().trim() === expectedEmail ||
          credentials.email.toLowerCase().trim() === 'zyad'

        if (emailMatches && credentials.password.trim() === expectedPassword.trim()) {
          return {
            id: 'apx-admin-1',
            email: expectedEmail,
            name: 'APX Admin',
            role: 'ADMIN',
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as AuditSessionUser).role || 'ADMIN'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as unknown as AuditSessionUser).id = token.sub || 'apx-admin-1'
        ;(session.user as unknown as AuditSessionUser).role =
          (token.role as AuditUserRole) || 'ADMIN'
      }
      return session
    },
  },
}

/**
 * Integration-ready auth adapter (`getSessionUser()`).
 * Uses `isAdminAuthenticated()` from `@/lib/auth` (and NextAuth if active).
 * When merging into APX Solutions, replace the body of this function with
 * your main APX Solutions session helper returning `{ id, role: 'ADMIN' | 'CLIENT' } | null`.
 */
export async function getSessionUser(): Promise<AuditSessionUser | null> {
  // 1. Check main APX Admin session cookie (`zyad_admin_session`)
  if (isAdminAuthenticated()) {
    return {
      id: 'apx-admin-1',
      email: process.env.ADMIN_EMAIL || 'admin@zyadmohamed.com',
      name: 'Zyad Saadon (APX)',
      role: 'ADMIN',
    }
  }

  // 2. Check NextAuth session fallback
  try {
    const session = await getServerSession(auditAuthOptions)
    if (session?.user) {
      return {
        id: (session.user as unknown as AuditSessionUser).id || 'apx-admin-1',
        email: session.user.email || undefined,
        name: session.user.name || 'APX Admin',
        role: (session.user as unknown as AuditSessionUser).role || 'ADMIN',
      }
    }
  } catch {
    // Ignore outside request scope
  }

  return null
}
