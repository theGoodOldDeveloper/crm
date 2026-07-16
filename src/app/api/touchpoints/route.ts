import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TouchpointType } from '@prisma/client'
import { createGoogleEvent } from '@/lib/google-calendar'

const typeLabels: Record<string, string> = {
  MEETING: 'Találkozó',
  PHONE: 'Telefonhívás',
  EMAIL: 'Email',
  SMS: 'SMS',
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const contactId = searchParams.get('contactId')
  const projectId = searchParams.get('projectId')
  const limit = parseInt(searchParams.get('limit') || '20')

  const touchpoints = await prisma.touchpoint.findMany({
    where: {
      ...(contactId && { contactId }),
      ...(projectId && { projectId }),
    },
    include: {
      contact: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  })

  return NextResponse.json(touchpoints)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { contactId, projectId, type, date, duration, notes } = body

  if (!contactId) return NextResponse.json({ error: 'Kontakt megadása kötelező' }, { status: 400 })
  if (!type) return NextResponse.json({ error: 'Típus megadása kötelező' }, { status: 400 })
  if (!date) return NextResponse.json({ error: 'Dátum megadása kötelező' }, { status: 400 })

  const touchpoint = await prisma.touchpoint.create({
    data: {
      contactId,
      projectId: projectId || null,
      type: type as TouchpointType,
      date: new Date(date),
      duration: duration ? parseInt(duration) : null,
      notes,
    },
    include: {
      contact: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
    },
  })

  // Create CalendarEvent + push to Google Calendar
  try {
    const durationMin = duration ? parseInt(duration) : 60
    const startTime = new Date(date)
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000)
    const title = `${typeLabels[type] || type} - ${touchpoint.contact.name}`

    let googleEventId: string | undefined
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (user?.googleRefreshToken) {
      const gEvent = await createGoogleEvent(session.userId, { title, description: notes, startTime, endTime })
      googleEventId = gEvent.id || undefined
    }

    await prisma.calendarEvent.create({
      data: { title, startTime, endTime, googleEventId, touchpointId: touchpoint.id },
    })
  } catch (err) {
    console.error('Google Calendar sync failed for touchpoint:', err)
  }

  return NextResponse.json(touchpoint, { status: 201 })
}
