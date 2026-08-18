import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const hashedPassword = await bcrypt.hash('password123', 12)

  const admin = await prisma.guide.upsert({
    where: { email: 'admin@smartumroh.com' },
    update: { password: hashedPassword, role: 'SUPERADMIN', status: 'APPROVED' },
    create: {
      email: 'admin@smartumroh.com',
      name: 'Superadmin',
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: 'APPROVED',
    },
  })
  console.log(`Created superadmin with id: ${admin.id}`)

  const guide = await prisma.guide.upsert({
    where: { email: 'guide@muthowif.com' },
    update: { password: hashedPassword, status: 'APPROVED' },
    create: {
      email: 'guide@muthowif.com',
      name: 'Ustadz Ahmad',
      password: hashedPassword,
      status: 'APPROVED',
    },
  })

  console.log(`Created guide with id: ${guide.id}`)

  const session = await prisma.tourSession.upsert({
    where: { livekitRoomName: 'room-hajj2026-b1' },
    update: {},
    create: {
      guideId: guide.id,
      title: 'Hajj 2026 Batch 1',
      location: 'Mecca, Saudi Arabia',
      status: 'SCHEDULED',
      livekitRoomName: 'room-hajj2026-b1',
      expectedParticipants: {
        create: [
          { name: 'Budi Santoso', email: 'budi@example.com' },
          { name: 'Siti Aminah', email: 'siti@example.com' },
        ]
      }
    }
  })

  console.log(`Created session with id: ${session.id}`)
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
