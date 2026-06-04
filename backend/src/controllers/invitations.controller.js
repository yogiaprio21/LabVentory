const dayjs = require('dayjs')
const { prisma } = require('../prisma/client')
const { logAudit } = require('../utils/audit')
const { createInviteCode, isInviteUsable } = require('../utils/invite')
const {
  assertInstitutionAccess,
  assertLabAccess,
  badRequest,
  isPlatformAdmin,
  roleRequiresLab,
  scopedLabWhere,
  tenantIdOf
} = require('../utils/tenancy')

const selectInvite = {
  id: true,
  code: true,
  role: true,
  status: true,
  maxUses: true,
  usedCount: true,
  expiresAt: true,
  createdAt: true,
  institution: { select: { id: true, name: true, slug: true, status: true } },
  lab: { select: { id: true, name: true, location: true, institutionId: true } },
  createdBy: { select: { id: true, name: true, email: true } }
}

const scopeWhere = (req) => isPlatformAdmin(req.user) ? {} : { institutionId: tenantIdOf(req.user) || -1 }

const list = async (req, res) => {
  const invitations = await prisma.invitation.findMany({
    where: scopeWhere(req),
    select: selectInvite,
    orderBy: { createdAt: 'desc' },
    take: 100
  })
  res.json(invitations)
}

const create = async (req, res) => {
  const { institutionId, labId, role = 'student', maxUses = 1, expiresAt } = req.body
  const targetInstitutionId = isPlatformAdmin(req.user) ? institutionId : tenantIdOf(req.user)
  const institution = await assertInstitutionAccess(req.user, targetInstitutionId)
  if (institution.status !== 'active') throw badRequest('Institution is inactive')

  let lab = null
  if (roleRequiresLab(role)) {
    if (!labId) throw badRequest('labId is required for this invite role')
    lab = await assertLabAccess(req.user, labId)
    if (lab.institutionId !== institution.id) throw badRequest('labId does not belong to selected institution')
    if (lab.status !== 'active') throw badRequest('Cannot create invitation for an inactive laboratory')
  } else if (labId) {
    lab = await assertLabAccess(req.user, labId)
    if (lab.institutionId !== institution.id) throw badRequest('labId does not belong to selected institution')
    if (lab.status !== 'active') throw badRequest('Cannot create invitation for an inactive laboratory')
  }
  const expiry = expiresAt ? new Date(expiresAt) : dayjs().add(7, 'day').toDate()
  if (expiry <= new Date()) throw badRequest('expiresAt must be in the future')

  const invite = await prisma.invitation.create({
    data: {
      code: createInviteCode(),
      institutionId: institution.id,
      labId: lab?.id || null,
      role,
      maxUses,
      expiresAt: expiry,
      createdById: req.user.id
    },
    select: selectInvite
  })

  await logAudit({
    userId: req.user.id,
    institutionId: institution.id,
    action: 'create',
    entity: 'invitation',
    entityId: invite.id,
    details: { role, labId: lab?.id || null, maxUses: invite.maxUses, expiresAt: invite.expiresAt }
  })
  res.status(201).json(invite)
}

const update = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.invitation.findFirst({
    where: { id, ...scopeWhere(req) },
    include: { institution: true }
  })
  if (!existing) {
    const e = new Error('Invitation not found')
    e.status = 404
    throw e
  }

  const data = {}
  if (req.body.status) data.status = req.body.status
  if (req.body.expiresAt) data.expiresAt = new Date(req.body.expiresAt)

  const invite = await prisma.invitation.update({ where: { id }, data, select: selectInvite })
  await logAudit({
    userId: req.user.id,
    institutionId: existing.institutionId,
    action: 'update',
    entity: 'invitation',
    entityId: id,
    details: data
  })
  res.json(invite)
}

const resolve = async (req, res) => {
  const invite = await prisma.invitation.findUnique({
    where: { code: req.params.code },
    select: selectInvite
  })
  if (!isInviteUsable(invite)) {
    await logAudit({
      userId: null,
      institutionId: invite?.institution?.id || null,
      action: 'failed',
      entity: 'invitation_resolve',
      entityId: invite?.id || 0,
      details: { reason: 'invalid_or_expired' }
    })
    const e = new Error('Invitation is invalid or expired')
    e.status = 404
    throw e
  }

  const labs = await prisma.lab.findMany({
    where: invite.labId
      ? { id: invite.labId, status: 'active' }
      : scopedLabWhere({ role: 'institution_admin', institutionId: invite.institution.id }, { status: 'active' }),
    orderBy: { name: 'asc' }
  })

  await logAudit({
    userId: null,
    institutionId: invite.institution.id,
    action: 'resolve',
    entity: 'invitation',
    entityId: invite.id,
    details: { role: invite.role, hasLab: !!invite.lab }
  })

  res.json({
    invitation: {
      code: invite.code,
      role: invite.role,
      expiresAt: invite.expiresAt,
      remainingUses: invite.maxUses - invite.usedCount
    },
    institution: invite.institution,
    lab: invite.lab,
    labs
  })
}

module.exports = { list, create, update, resolve }
