const dayjs = require('dayjs')
const { prisma } = require('../prisma/client')
const { logAudit } = require('../utils/audit')
const { auditDetails, buildChanges } = require('../utils/audit-details')
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
  inviteeEmail: true,
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

const scopeWhere = (req) => {
  if (!isPlatformAdmin(req.user)) return { institutionId: tenantIdOf(req.user) || -1 }
  const institutionId = req.query.institutionId ? Number(req.query.institutionId) : null
  return institutionId ? { institutionId } : {}
}

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
  const { institutionId, labId, role = 'student', maxUses = 1, expiresAt, inviteeEmail } = req.body
  let lab = null
  if (labId) {
    lab = await assertLabAccess(req.user, labId)
    if (lab.status !== 'active') throw badRequest('Cannot create invitation for an inactive laboratory')
  }

  const targetInstitutionId = lab?.institutionId || (isPlatformAdmin(req.user) ? institutionId : tenantIdOf(req.user))
  if (!targetInstitutionId) {
    throw badRequest(roleRequiresLab(role)
      ? 'Select a laboratory or institution before creating this invitation'
      : 'institutionId is required for institution-scoped invitations')
  }

  const institution = await assertInstitutionAccess(req.user, targetInstitutionId)
  if (institution.status !== 'active') throw badRequest('Institution is inactive')

  if (roleRequiresLab(role)) {
    if (!lab) throw badRequest('labId is required for this invite role')
    if (lab.institutionId !== institution.id) throw badRequest('labId does not belong to selected institution')
  } else if (lab) {
    if (lab.institutionId !== institution.id) throw badRequest('labId does not belong to selected institution')
  }
  const expiry = expiresAt ? new Date(expiresAt) : dayjs().add(7, 'day').toDate()
  if (expiry <= new Date()) throw badRequest('expiresAt must be in the future')

  const invite = await prisma.invitation.create({
    data: {
      code: createInviteCode(),
      inviteeEmail: inviteeEmail ? inviteeEmail.toLowerCase() : null,
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
    details: auditDetails({
      summary: `Created ${role} invitation`,
      attributes: [
        { label: 'Role', value: role },
        { label: 'Institution ID', value: institution.id },
        { label: 'Lab ID', value: lab?.id || null },
        { label: 'Invitee email', value: invite.inviteeEmail },
        { label: 'Maximum uses', value: invite.maxUses },
        { label: 'Expires at', value: invite.expiresAt }
      ]
    })
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
    details: auditDetails({
      summary: `Updated invitation #${id}`,
      changes: buildChanges(existing, data, ['status', 'expiresAt'])
    })
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
      inviteeEmail: invite.inviteeEmail,
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
