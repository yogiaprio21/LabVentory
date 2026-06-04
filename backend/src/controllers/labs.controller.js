const { prisma } = require('../prisma/client')
const { isPlatformAdmin, tenantIdOf, scopedLabWhere, assertLabAccess, badRequest } = require('../utils/tenancy')

const createLab = async (req, res) => {
  const { name, location, institutionId } = req.body
  const targetInstitutionId = isPlatformAdmin(req.user) ? Number(institutionId || tenantIdOf(req.user)) : tenantIdOf(req.user)
  if (!targetInstitutionId) throw badRequest('institutionId is required')
  const lab = await prisma.lab.create({ data: { name, location, institutionId: targetInstitutionId } })
  res.status(201).json(lab)
}

const updateLab = async (req, res) => {
  const id = Number(req.params.id)
  const { name, location } = req.body
  await assertLabAccess(req.user, id)
  const lab = await prisma.lab.update({ where: { id }, data: { name, location } })
  res.json(lab)
}

const deleteLab = async (req, res) => {
  const id = Number(req.params.id)
  await assertLabAccess(req.user, id)
  await prisma.lab.delete({ where: { id } })
  res.status(204).send()
}

const getLabs = async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : null
  const limit = req.query.limit ? Number(req.query.limit) : 10

  if (!page) {
    const labs = await prisma.lab.findMany({ where: scopedLabWhere(req.user), orderBy: { id: 'asc' } })
    return res.json(labs)
  }

  const skip = (page - 1) * limit
  const where = scopedLabWhere(req.user)
  const [data, total] = await Promise.all([
    prisma.lab.findMany({ where, include: { institution: true }, orderBy: { id: 'asc' }, skip, take: limit }),
    prisma.lab.count({ where })
  ])

  res.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  })
}

module.exports = { createLab, updateLab, deleteLab, getLabs }
