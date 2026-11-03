import crypto from 'crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE_NAME = 'zyad_admin_session'

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'zyad2025'
}

export function createAdminToken(): string {
  const password = getAdminPassword()
  return crypto
    .createHmac('sha256', 'zyad-apx-admin-secret-salt-2025')
    .update(password)
    .digest('hex')
}

export function verifyPassword(inputPassword: string): boolean {
  const expected = getAdminPassword()
  return inputPassword.trim() === expected.trim()
}

export function isAdminAuthenticated(): boolean {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value
    if (!session) return false
    return session === createAdminToken()
  } catch {
    return false
  }
}
