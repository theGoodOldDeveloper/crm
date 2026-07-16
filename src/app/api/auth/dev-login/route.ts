import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

// DEV ONLY - remove or protect in production!
export async function POST() {
  if (process.env.DEV_LOGIN_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Dev login is disabled' }, { status: 403 })
  }

  const user = await prisma.user.upsert({
    where: { email: 'dev@localhost' },
    create: { email: 'dev@localhost', name: 'Dev User' },
    update: {},
  })

  const token = await createSession({ userId: user.id, email: user.email })

  const response = NextResponse.json({ success: true })
  response.cookies.set('crm_session', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return response
}
