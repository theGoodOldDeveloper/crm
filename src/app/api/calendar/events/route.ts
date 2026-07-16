import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createGoogleEvent } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const events = await prisma.calendarEvent.findMany({
    where: {
      touchpointId: null, // Touchpoint-linked events show as touchpoints, not calendar events
      ...(start && end && {
        startTime: {
          gte: new Date(start),
          lte: new Date(end),
        },
      }),
    },
    include: {
      touchpoint: {
        include: {
          contact: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { startTime: 'asc' },
  })

  return NextResponse.json(events)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, startTime, endTime } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Cím megadása kötelező' }, { status: 400 })
  if (!startTime || !endTime) return NextResponse.json({ error: 'Dátum megadása kötelező' }, { status: 400 })

  let googleEventId: string | undefined

  // Try to sync to Google Calendar
  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (user?.googleRefreshToken) {
      const googleEvent = await createGoogleEvent(session.userId, {
        title: title.trim(),
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      })
      googleEventId = googleEvent.id || undefined
    }
  } catch (err) {
    console.error('Google Calendar sync failed:', err)
    // Continue without Google sync
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title: title.trim(),
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      googleEventId,
    },
    include: {
      touchpoint: {
        include: { contact: { select: { id: true, name: true } } },
      },
    },
  })

  return NextResponse.json(event, { status: 201 })
}
