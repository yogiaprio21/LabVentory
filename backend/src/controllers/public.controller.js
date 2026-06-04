const { prisma } = require('../prisma/client')

const listInstitutionLabs = async (req, res) => {
  const { slug } = req.params
  const institution = await prisma.institution.findFirst({
    where: { slug, status: 'active' },
    select: { id: true, name: true, slug: true, registrationMode: true }
  })
  if (!institution) {
    const e = new Error('Institution not found')
    e.status = 404
    throw e
  }

  const labs = institution.registrationMode === 'public'
    ? await prisma.lab.findMany({
      where: { institutionId: institution.id, status: 'active' },
      orderBy: { name: 'asc' }
    })
    : []

  res.json({ institution, labs })
}

module.exports = { listInstitutionLabs }
