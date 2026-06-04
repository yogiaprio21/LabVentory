const { prisma } = require('../prisma/client')
const { logAudit } = require('../utils/audit')
const { isPlatformAdmin, tenantIdOf, scopedLabWhere, assertLabAccess, assertInstitutionAccess, badRequest } = require('../utils/tenancy')

const createLab = async (req, res) => {
  const { name, location, institutionId } = req.body
  const targetInstitutionId = isPlatformAdmin(req.user) ? Number(institutionId || tenantIdOf(req.user)) : tenantIdOf(req.user)
  if (!targetInstitutionId) throw badRequest('institutionId is required')
  const institution = await assertInstitutionAccess(req.user, targetInstitutionId)
  if (institution.status !== 'active') throw badRequest('Cannot create a laboratory for an inactive institution')
  const lab = await prisma.lab.create({ data: { name, location, institutionId: targetInstitutionId } })
  await logAudit({ userId: req.user.id, institutionId: targetInstitutionId, action: 'create', entity: 'lab', entityId: lab.id, details: { name, location } })
  res.status(201).json(lab)
}

const updateLab = async (req, res) => {
  const id = Number(req.params.id)
  const { name, location, status, institutionId } = req.body
  const existing = await assertLabAccess(req.user, id)
  const nextInstitutionId = institutionId !== undefined ? Number(institutionId) : existing.institutionId

  if (institutionId !== undefined && Number(institutionId) !== Number(existing.institutionId)) {
    if (!isPlatformAdmin(req.user)) throw badRequest('Only platform admins can transfer a laboratory to another institution')
    const targetInstitution = await assertInstitutionAccess(req.user, nextInstitutionId)
    if (targetInstitution.status !== 'active') throw badRequest('Cannot transfer a laboratory to an inactive institution')
  }

  if (status === 'inactive') {
    const activeBorrowings = await prisma.borrowing.count({
      where: { inventory: { labId: id }, status: { in: ['pending', 'approved', 'late'] } }
    })
    if (activeBorrowings > 0) throw badRequest('Resolve active borrowings before deactivating this laboratory')
  }

  const lab = await prisma.$transaction(async (tx) => {
    const updated = await tx.lab.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(nextInstitutionId !== existing.institutionId ? { institutionId: nextInstitutionId } : {})
      },
      include: { institution: true }
    })

    if (nextInstitutionId !== existing.institutionId) {
      await tx.user.updateMany({
        where: { labId: id, role: { in: ['student', 'admin', 'lab_admin'] } },
        data: { institutionId: nextInstitutionId }
      })
      await tx.invitation.updateMany({
        where: { labId: id },
        data: { institutionId: nextInstitutionId }
      })
    }

    return updated
  })
  await logAudit({
    userId: req.user.id,
    institutionId: nextInstitutionId,
    action: nextInstitutionId !== existing.institutionId ? 'transfer' : 'update',
    entity: 'lab',
    entityId: id,
    details: { name, location, status, previousInstitutionId: existing.institutionId, institutionId: nextInstitutionId }
  })
  res.json(lab)
}

const deleteLab = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await assertLabAccess(req.user, id)
  const activeBorrowings = await prisma.borrowing.count({
    where: { inventory: { labId: id }, status: { in: ['pending', 'approved', 'late'] } }
  })
  if (activeBorrowings > 0) throw badRequest('Resolve active borrowings before deactivating this laboratory')
  await prisma.lab.update({ where: { id }, data: { status: 'inactive' } })
  await logAudit({ userId: req.user.id, institutionId: existing.institutionId, action: 'deactivate', entity: 'lab', entityId: id })
  res.status(204).send()
}

const getLabs = async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : null
  const limit = req.query.limit ? Number(req.query.limit) : 10
  const extra = isPlatformAdmin(req.user) && req.query.institutionId
    ? { institutionId: Number(req.query.institutionId) }
    : {}

  if (!page) {
    const labs = await prisma.lab.findMany({ where: scopedLabWhere(req.user, extra), orderBy: { id: 'asc' } })
    return res.json(labs)
  }

  const skip = (page - 1) * limit
  const where = scopedLabWhere(req.user, extra)
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
