import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProjectStatus } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      contacts: {
        include: {
          contact: { select: { id: true, name: true, company: true, email: true } },
        },
      },
      touchpoints: {
        include: {
          contact: { select: { id: true, name: true, company: true } },
        },
        orderBy: { date: 'desc' },
      },
      _count: { select: { touchpoints: true, contacts: true } },
    },
  })

  if (!project) return NextResponse.json({ error: 'Projekt nem található' }, { status: 404 })

  return NextResponse.json(project)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, status, description, contactIds } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Projekt neve kötelező' }, { status: 400 })
  }

  // Update contacts: delete all and re-create
  const project = await prisma.$transaction(async (tx) => {
    if (contactIds !== undefined) {
      await tx.contactOnProject.deleteMany({ where: { projectId: params.id } })
    }

    return tx.project.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        status: status as ProjectStatus,
        description,
        ...(contactIds !== undefined && {
          contacts: {
            create: contactIds.map((id: string) => ({ contactId: id })),
          },
        }),
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
  })

  return NextResponse.json(project)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
