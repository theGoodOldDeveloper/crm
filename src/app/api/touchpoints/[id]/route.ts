import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TouchpointType } from '@prisma/client'
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from '@/lib/google-calendar'

const typeLabels: Record<string, string> = {
  MEETING: 'Találkozó',
  PHONE: 'Telefonhívás',
  EMAIL: 'Email',
  SMS: 'SMS',
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { contactId, projectId, type, date, duration, notes } = body

  const touchpoint = await prisma.touchpoint.update({
    where: { id: params.id },
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
      event: true,
    },
  })

  // Update linked CalendarEvent + Google Calendar
  try {
    const durationMin = duration ? parseInt(duration) : 60
    const startTime = new Date(date)
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000)
    const title = `${typeLabels[type] || type} - ${touchpoint.contact.name}`

    const user = await prisma.user.findUnique({ where: { id: session.userId } })

    if (touchpoint.event) {
      // Update existing CalendarEvent
      if (user?.googleRefreshToken && touchpoint.event.googleEventId) {
        await updateGoogleEvent(session.userId, touchpoint.event.googleEventId, { title, description: notes, startTime, endTime })
      }
      await prisma.calendarEvent.update({
        where: { id: touchpoint.event.id },
        data: { title, startTime, endTime, description: notes },
      })
    } else {
      // Create CalendarEvent if it didn't exist yet
      let googleEventId: string | undefined
      if (user?.googleRefreshToken) {
        const gEvent = await createGoogleEvent(session.userId, { title, description: notes, startTime, endTime })
        googleEventId = gEvent.id || undefined
      }
      await prisma.calendarEvent.create({
        data: { title, startTime, endTime, googleEventId, touchpointId: touchpoint.id },
      })
    }
  } catch (err) {
    console.error('Google Calendar sync failed for touchpoint update:', err)
  }

  return NextResponse.json(touchpoint)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete linked CalendarEvent from Google Calendar first
  try {
    const calEvent = await prisma.calendarEvent.findUnique({ where: { touchpointId: params.id } })
    if (calEvent?.googleEventId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } })
      if (user?.googleRefreshToken) {
        await deleteGoogleEvent(session.userId, calEvent.googleEventId)
      }
    }
  } catch (err) {
    console.error('Google Calendar delete failed:', err)
  }

  await prisma.touchpoint.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
