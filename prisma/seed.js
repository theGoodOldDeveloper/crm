// CommonJS seed - works in standalone Docker build
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const existingContacts = await prisma.contact.count()
  if (existingContacts > 0) {
    console.log('✅ Database already seeded, skipping...')
    return
  }

  const contact1 = await prisma.contact.create({
    data: {
      name: 'Kovács András',
      company: 'Tech Solutions Kft.',
      email: 'andras.kovacs@techsolutions.hu',
      phone: '+36 30 123 4567',
      address: '1051 Budapest, Vörösmarty tér 1.',
      notes: 'Kulcsfontosságú partner, negyedévente egyeztetünk.',
    },
  })

  const contact2 = await prisma.contact.create({
    data: {
      name: 'Nagy Éva',
      company: 'Design Studio',
      email: 'eva.nagy@designstudio.hu',
      phone: '+36 70 987 6543',
      address: '1061 Budapest, Andrássy út 22.',
      notes: 'Grafikus tervező, logó projektben együttműködünk.',
    },
  })

  const contact3 = await prisma.contact.create({
    data: {
      name: 'Szabó Péter',
      company: 'Marketing Pro',
      email: 'peter.szabo@marketingpro.hu',
      phone: '+36 20 555 7890',
      notes: 'Marketing tanácsadó.',
    },
  })

  const project1 = await prisma.project.create({
    data: {
      name: 'Weboldal fejlesztés',
      status: 'ACTIVE',
      description: 'Vállalati weboldal teljes újratervezése és fejlesztése.',
      contacts: {
        create: [{ contactId: contact1.id }, { contactId: contact2.id }],
      },
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Marketing kampány Q4',
      status: 'ON_HOLD',
      description: 'Negyedik negyedéves digitális marketing kampány tervezése.',
      contacts: { create: [{ contactId: contact3.id }] },
    },
  })

  await prisma.project.create({
    data: {
      name: 'Logó redesign',
      status: 'COMPLETED',
      description: 'Céglogó modernizálása és brand identity frissítése.',
      contacts: { create: [{ contactId: contact2.id }] },
    },
  })

  const now = new Date()

  await prisma.touchpoint.create({
    data: {
      contactId: contact1.id,
      projectId: project1.id,
      type: 'MEETING',
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      duration: 60,
      notes: 'Kick-off megbeszélés. Egyeztettük a határidőket és a főbb funkciókat.',
    },
  })

  await prisma.touchpoint.create({
    data: {
      contactId: contact2.id,
      projectId: project1.id,
      type: 'EMAIL',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      duration: 15,
      notes: 'Wireframe-ek elküldve, visszajelzésre várunk.',
    },
  })

  await prisma.touchpoint.create({
    data: {
      contactId: contact3.id,
      projectId: project2.id,
      type: 'PHONE',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      duration: 30,
      notes: 'Kampány célkitűzések megbeszélve, budget jóváhagyásra vár.',
    },
  })

  await prisma.calendarEvent.create({
    data: {
      title: 'Heti check-in - Tech Solutions',
      description: 'Heti státusz egyeztetés a fejlesztési projektről',
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
