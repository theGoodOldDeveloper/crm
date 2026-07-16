import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProjectStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') as ProjectStatus | null

  const projects = await prisma.project.findMany({
    where: status ? { status } : {},
    include: {
      contacts: {
        include: {
          contact: { select: { id: true, name: true, company: true, email: true } },
        },
      },
      _count: { select: { touchpoints: true, contacts: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, status, description, contactIds } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Projekt neve kötelező' }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      status: status || ProjectStatus.ACTIVE,
      description,
      contacts: contactIds?.length
        ? { create: contactIds.map((id: string) => ({ contactId: id })) }
        : undefined,
    },
    include: {
      contacts: {
        include: {
          contact: { select: { id: true, name: true, company: true, email: true } },
        },
      },
      _count: { select: { touchpoints: true, contacts: true } },
    },
  })

  return NextResponse.json(project, { status: 201 })
}
