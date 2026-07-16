import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contact = await prisma.contact.findUnique({
    where: { id: params.id },
    include: {
      projects: {
        include: { project: { select: { id: true, name: true, status: true } } },
      },
      touchpoints: {
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      },
      _count: { select: { touchpoints: true, projects: true } },
    },
  })

  if (!contact) return NextResponse.json({ error: 'Kontakt nem található' }, { status: 404 })

  return NextResponse.json(contact)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, company, email, phone, address, notes } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Név megadása kötelező' }, { status: 400 })
  }

  const contact = await prisma.contact.update({
    where: { id: params.id },
    data: { name: name.trim(), company, email, phone, address, notes },
    include: {
      projects: {
        include: { project: { select: { id: true, name: true, status: true } } },
      },
      _count: { select: { touchpoints: true, projects: true } },
    },
  })

  return NextResponse.json(contact)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.contact.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
