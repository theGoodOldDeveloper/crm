import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { company: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        projects: {
          include: {
            project: { select: { id: true, name: true, status: true } },
          },
        },
        _count: { select: { touchpoints: true, projects: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ])

  return NextResponse.json({ contacts, total, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, company, email, phone, address, notes } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Név megadása kötelező' }, { status: 400 })
  }

  const contact = await prisma.contact.create({
    data: { name: name.trim(), company, email, phone, address, notes },
    include: {
      projects: {
        include: { project: { select: { id: true, name: true, status: true } } },
      },
      _count: { select: { touchpoints: true, projects: true } },
    },
  })

  return NextResponse.json(contact, { status: 201 })
}
