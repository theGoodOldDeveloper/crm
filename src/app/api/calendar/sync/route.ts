import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncFromGoogle } from '@/lib/google-calendar'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user?.googleRefreshToken) {
    return NextResponse.json({ error: 'Google Calendar nincs csatlakoztatva' }, { status: 400 })
  }

  try {
    const synced = await syncFromGoogle(session.userId)
    return NextResponse.json({ success: true, synced })
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: 'Szinkronizáció sikertelen' }, { status: 500 })
  }
}
