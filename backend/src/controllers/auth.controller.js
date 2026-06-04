const { prisma } = require('../prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Prisma } = require('@prisma/client')
const { env } = require('../config/env')
const { logAudit } = require('../utils/audit')
const { isInviteUsable } = require('../utils/invite')
const { assertActiveLabAccess, assertInstitutionAccess, isPlatformAdmin, tenantIdOf, badRequest, forbidden } = require('../utils/tenancy')

const signToken = (user) => {
  const payload = { sub: user.id, role: user.role, institutionId: tenantIdOf(user), labId: user.labId }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
}

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  institutionId: tenantIdOf(user),
  institution: user.institution || user.lab?.institution || null,
  labId: user.labId,
  lab: user.lab
})

/**
 * Public registration. Without invite it creates a student in a public institution.
 * With invite it creates the role encoded by the invitation.
 */
const registerStudent = async (req, res) => {
  const { name, email, password, labId, institutionSlug, inviteCode } = req.body
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      const e = new Error('Email already in use')
      e.status = 409
      throw e
    }

    let role = 'student'
    let selectedLab = null
    let selectedInstitutionId = null
    let invitation = null
    const now = new Date()

    if (inviteCode) {
      invitation = await tx.invitation.findUnique({
        where: { code: inviteCode },
        include: { institution: true, lab: true }
      })
      if (!isInviteUsable(invitation)) {
        const e = new Error('Invitation is invalid or expired')
        e.status = 400
        throw e
      }
      if (invitation.inviteeEmail && invitation.inviteeEmail.toLowerCase() !== email.toLowerCase()) {
        const e = new Error('Invitation email does not match this account')
        e.status = 400
        throw e
      }
      role = invitation.role
      selectedInstitutionId = invitation.institutionId
      if (['student', 'admin', 'lab_admin'].includes(role)) {
        const useLabId = invitation.labId || Number(labId)
        if (!useLabId) throw badRequest('labId is required for this invitation')
        selectedLab = await tx.lab.findFirst({ where: { id: Number(useLabId), institutionId: selectedInstitutionId, status: 'active' }, include: { institution: true } })
        if (!selectedLab) throw badRequest('Invalid laboratory selection')
      }

      const consumed = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          status: 'active',
          expiresAt: { gt: now },
          usedCount: { lt: invitation.maxUses }
        },
        data: { usedCount: { increment: 1 } }
      })
      if (consumed.count !== 1) {
        const e = new Error('Invitation is invalid or expired')
        e.status = 400
        throw e
      }
      await tx.invitation.updateMany({
        where: { id: invitation.id, usedCount: { gte: invitation.maxUses } },
        data: { status: 'used' }
      })
    } else {
      if (!labId) throw badRequest('labId is required for student registration')
      selectedLab = await tx.lab.findFirst({
        where: {
          id: Number(labId),
          status: 'active',
          institution: { slug: institutionSlug || 'default', status: 'active', registrationMode: 'public' }
        },
        include: { institution: true }
      })
      if (!selectedLab) throw badRequest('Invalid laboratory selection or registration requires an invitation')
      selectedInstitutionId = selectedLab.institutionId
    }

    const created = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hash,
        role,
        institutionId: selectedInstitutionId,
        labId: ['platform_admin', 'superadmin', 'institution_admin'].includes(role) ? null : selectedLab?.id || null
      },
      include: { institution: true, lab: { include: { institution: true } } }
    })

    if (invitation) {
      await tx.auditLog.create({
        data: {
          userId: created.id,
          institutionId: selectedInstitutionId,
          action: 'consume',
          entity: 'invitation',
          entityId: invitation.id,
          details: { role, labId: selectedLab?.id || null, inviteeEmail: invitation.inviteeEmail || null }
        }
      })
    }

    return created
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted })
  await logAudit({ userId: user.id, institutionId: user.institutionId || user.lab?.institutionId || null, action: 'create', entity: 'user_registration', entityId: user.id, details: { invite: !!inviteCode, role: user.role } })
  res.status(201).json(serializeUser(user))
}

/**
 * Admin-only registration (superadmin can create any role)
 */
const register = async (req, res) => {
  const { name, email, password, role = 'lab_admin', institutionId, labId } = req.body
  let targetInstitutionId = isPlatformAdmin(req.user) ? (institutionId ? Number(institutionId) : null) : tenantIdOf(req.user)

  if (role === 'platform_admin' || role === 'superadmin') {
    if (!isPlatformAdmin(req.user)) throw forbidden()
    targetInstitutionId = null
  }

  if ((role === 'student' || role === 'admin' || role === 'lab_admin') && !labId) {
    const e = new Error('labId is required for this role')
    e.status = 400
    throw e
  }
  let lab = null
  if (labId) {
    lab = await assertActiveLabAccess(req.user, Number(labId))
    targetInstitutionId = targetInstitutionId || lab.institutionId
    if (targetInstitutionId && lab.institutionId !== targetInstitutionId) throw badRequest('labId does not belong to selected institution')
  }

  if (role !== 'platform_admin' && role !== 'superadmin' && !targetInstitutionId) {
    throw badRequest('institutionId is required')
  }
  if (role === 'institution_admin') {
    const institution = await assertInstitutionAccess(req.user, targetInstitutionId)
    if (institution.status !== 'active') throw badRequest('Cannot create user for an inactive institution')
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    const e = new Error('Email already in use')
    e.status = 409
    throw e
  }

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hash,
      role,
      institutionId: targetInstitutionId,
      labId: (role === 'platform_admin' || role === 'superadmin' || role === 'institution_admin') ? null : lab?.id || null
    },
    include: { institution: true, lab: { include: { institution: true } } }
  })
  await logAudit({ userId: req.user.id, institutionId: targetInstitutionId, action: 'create', entity: 'user', entityId: user.id, details: { role } })
  res.status(201).json(serializeUser(user))
}

const login = async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { institution: true, lab: { include: { institution: true } } }
  })
  if (!user) {
    await logAudit({ userId: null, action: 'failed', entity: 'login', entityId: 0, details: { email: email.toLowerCase(), reason: 'invalid_credentials' } })
    const e = new Error('Invalid credentials')
    e.status = 401
    throw e
  }
  if (user.status !== 'active' || (user.institution && user.institution.status !== 'active') || (user.lab && user.lab.status !== 'active')) {
    await logAudit({ userId: user.id, institutionId: tenantIdOf(user), action: 'failed', entity: 'login', entityId: user.id, details: { reason: 'inactive_scope' } })
    const e = new Error('Account is inactive')
    e.status = 403
    throw e
  }
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    await logAudit({ userId: user.id, institutionId: tenantIdOf(user), action: 'failed', entity: 'login', entityId: user.id, details: { reason: 'invalid_credentials' } })
    const e = new Error('Invalid credentials')
    e.status = 401
    throw e
  }
  const token = signToken(user)
  await logAudit({ userId: user.id, action: 'login', entity: 'user', entityId: user.id })
  res.json({ token, user: serializeUser(user) })
}

module.exports = { register, registerStudent, login }
