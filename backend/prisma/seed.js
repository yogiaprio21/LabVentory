require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { env } = require('../src/config/env')
const prisma = new PrismaClient()

async function run() {
  console.log('Starting seed...')

  // Use environment variables from centralized config
  const superEmail = env.INITIAL_SUPERADMIN_EMAIL
  const superPassRaw = env.INITIAL_SUPERADMIN_PASSWORD
  const superPass = await bcrypt.hash(superPassRaw, 10)

  // Ensure initial Super Admin exists
  const superUser = await prisma.user.upsert({
    where: { email: superEmail },
    update: {},
    create: {
      name: 'Initial Super Admin',
      email: superEmail,
      password: superPass,
      role: 'superadmin'
    }
  })

  console.log(`✓ Superadmin ensured: ${superEmail}`)

  // Optional: Seed initial labs only if none exist
  const labCount = await prisma.lab.count()
  if (labCount === 0) {
    console.log('Seeding initial labs...')
    await prisma.lab.createMany({
      data: [
        { name: 'Electronics Lab', location: 'Main Building' },
        { name: 'Computer Lab', location: 'East Wing' }
      ]
    })
    console.log('✓ Initial labs created')
  }

  console.log('Seed process finished successfully')
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
