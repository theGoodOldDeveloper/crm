import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateGoogleEvent, deleteGoogleEvent } from '@/lib/google-calendar'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, startTime, endTime } = body

  const existing = await prisma.calendarEvent.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Esemény nem található' }, { status: 404 })

  // Sync to Google Calendar
  if (existing.googleEventId) {
    try {
      await updateGoogleEvent(session.userId, existing.googleEventId, {
        title: title.trim(),
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      })
    } catch (err) {
      console.error('Google Calendar update failed:', err)
    }
  }

  const event = await prisma.calendarEvent.update({
    where: { id: params.id },
    data: {
      title: title.trim(),
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    },
    include: {
      touchpoint: {
        include: { contact: { select: { id: true, name: true } } },
      },
    },
  })

  return NextResponse.json(event)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.calendarEvent.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Esemény nem található' }, { status: 404 })

  if (existing.googleEventId) {
    try {
      await deleteGoogleEvent(session.userId, existing.googleEventId)
    } catch (err) {
      console.error('Google Calendar delete failed:', err)
    }
  }

  await prisma.calendarEvent.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
