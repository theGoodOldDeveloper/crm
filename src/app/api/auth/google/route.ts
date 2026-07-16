import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-calendar'

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google OAuth nincs konfigurálva. Töltsd ki a .env fájlt.' },
      { status: 503 }
    )
  }

  const authUrl = getAuthUrl()
  return NextResponse.redirect(authUrl)
}
