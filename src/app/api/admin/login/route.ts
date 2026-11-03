import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, createAdminToken, verifyPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const password = String(body.password || '')

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    const token = createAdminToken()
    const response = NextResponse.json({ ok: true })

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch {
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(ADMIN_COOKIE_NAME)
  return response
}
