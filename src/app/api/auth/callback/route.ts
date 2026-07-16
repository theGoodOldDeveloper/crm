import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode, getUserInfo } from '@/lib/google-calendar'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

  if (error) {
    return NextResponse.redirect(new URL('/auth?error=access_denied', appUrl))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=no_code', appUrl))
  }

  try {
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/auth?error=no_token', appUrl))
    }

    const userInfo = await getUserInfo(tokens.access_token)

    if (!userInfo.email) {
      return NextResponse.redirect(new URL('/auth?error=no_email', appUrl))
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      create: {
        email: userInfo.email,
        name: userInfo.name || undefined,
        picture: userInfo.picture || undefined,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      update: {
        name: userInfo.name || undefined,
        picture: userInfo.picture || undefined,
        googleAccessToken: tokens.access_token,
        ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }),
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })

    const token = await createSession({ userId: user.id, email: user.email })

    const response = NextResponse.redirect(new URL('/', appUrl))
    response.cookies.set('crm_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Auth callback error:', err)
    return NextResponse.redirect(new URL('/auth?error=server_error', appUrl))
  }
}
