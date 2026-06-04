const { prisma } = require('../prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { env } = require('../config/env')
const { logAudit } = require('../utils/audit')
const { assertLabAccess, isPlatformAdmin, tenantIdOf, badRequest, forbidden } = require('../utils/tenancy')

const signToken = (user) => {
  const payload = { sub: user.id, role: user.role, institutionId: tenantIdOf(user), labId: user.labId }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
}

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  institutionId: tenantIdOf(user),
  institution: user.institution || user.lab?.institution || null,
  labId: user.labId,
  lab: user.lab
})

/**
 * Public student self-registration (role is always 'student')
 * Requires labId. Called from /auth/register without any token.
 */
const registerStudent = async (req, res) => {
  const { name, email, password, labId, institutionSlug } = req.body
  if (!labId) {
    const e = new Error('labId is required for student registration')
    e.status = 400
    throw e
  }
  const lab = await prisma.lab.findFirst({
    where: {
      id: Number(labId),
      ...(institutionSlug ? { institution: { slug: institutionSlug, status: 'active' } } : {})
    },
    include: { institution: true }
  })
  if (!lab) {
    const e = new Error('Invalid laboratory selection')
    e.status = 400
    throw e
  }
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    const e = new Error('Email already in use')
    e.status = 409
    throw e
  }
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hash, role: 'student', institutionId: lab.institutionId, labId: lab.id },
    include: { institution: true, lab: { include: { institution: true } } }
  })
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
    lab = await assertLabAccess(req.user, Number(labId))
    targetInstitutionId = targetInstitutionId || lab.institutionId
    if (targetInstitutionId && lab.institutionId !== targetInstitutionId) throw badRequest('labId does not belong to selected institution')
  }

  if (role !== 'platform_admin' && role !== 'superadmin' && !targetInstitutionId) {
    throw badRequest('institutionId is required')
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
  await logAudit({ userId: req.user.id, action: 'create', entity: 'user', entityId: user.id })
  res.status(201).json(serializeUser(user))
}

const login = async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { institution: true, lab: { include: { institution: true } } }
  })
  if (!user) {
    const e = new Error('Invalid credentials')
    e.status = 401
    throw e
  }
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    const e = new Error('Invalid credentials')
    e.status = 401
    throw e
  }
  const token = signToken(user)
  await logAudit({ userId: user.id, action: 'login', entity: 'user', entityId: user.id })
  res.json({ token, user: serializeUser(user) })
}

module.exports = { register, registerStudent, login }
