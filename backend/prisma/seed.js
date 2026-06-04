require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { env } = require('../src/config/env')
const prisma = new PrismaClient()

async function run() {
  console.log('Starting seed...')

  const superEmail = env.INITIAL_SUPERADMIN_EMAIL || (env.NODE_ENV === 'production' ? '' : 'admin@labventory.local')
  const superPassRaw = env.INITIAL_SUPERADMIN_PASSWORD || (env.NODE_ENV === 'production' ? '' : 'ChangeMe123!')

  if (!superEmail || !superPassRaw) {
    throw new Error('INITIAL_SUPERADMIN_EMAIL and INITIAL_SUPERADMIN_PASSWORD are required for production seed')
  }

  const superPass = await bcrypt.hash(superPassRaw, 10)

  const defaultInstitution = await prisma.institution.upsert({
    where: { slug: 'default' },
    update: { registrationMode: 'public' },
    create: {
      name: 'Default Institution',
      slug: 'default',
      status: 'active',
      registrationMode: 'public'
    }
  })

  const superUser = await prisma.user.upsert({
    where: { email: superEmail },
    update: {},
    create: {
      name: 'Initial Super Admin',
      email: superEmail,
      password: superPass,
      role: 'platform_admin'
    }
  })

  console.log(`✓ Superadmin ensured: ${superEmail}`)

  // Optional: Seed initial labs only if none exist
  const labCount = await prisma.lab.count()
  if (labCount === 0) {
    console.log('Seeding initial labs...')
    await prisma.lab.createMany({
      data: [
        { name: 'Electronics Lab', location: 'Main Building', institutionId: defaultInstitution.id },
        { name: 'Computer Lab', location: 'East Wing', institutionId: defaultInstitution.id }
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
