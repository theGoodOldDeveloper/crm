import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [totalContacts, activeProjects, touchpointsThisMonth, upcomingEvents, recentTouchpoints] =
    await Promise.all([
      prisma.contact.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.touchpoint.count({ where: { date: { gte: startOfMonth } } }),
      prisma.calendarEvent.findMany({
        where: { startTime: { gte: now, lte: oneWeekFromNow } },
        include: {
          touchpoint: {
            include: { contact: { select: { id: true, name: true } } },
          },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),
      prisma.touchpoint.findMany({
        include: {
          contact: { select: { id: true, name: true, company: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ])

  return NextResponse.json({
    totalContacts,
    activeProjects,
    touchpointsThisMonth,
    upcomingEvents,
    recentTouchpoints,
  })
}
