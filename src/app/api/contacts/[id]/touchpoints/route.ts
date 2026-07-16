import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const touchpoints = await prisma.touchpoint.findMany({
    where: { contactId: params.id },
    include: {
      contact: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(touchpoints)
}
