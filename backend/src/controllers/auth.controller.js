const { prisma } = require('../prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { env } = require('../config/env')
const { logAudit } = require('../utils/audit')

const signToken = (user) => {
  const payload = { sub: user.id, role: user.role, labId: user.labId }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
}

/**
 * Public student self-registration (role is always 'student')
 * Requires labId. Called from /auth/register without any token.
 */
const registerStudent = async (req, res) => {
  const { name, email, password, labId } = req.body
  if (!labId) {
    const e = new Error('labId is required for student registration')
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
    data: { name, email: email.toLowerCase(), password: hash, role: 'student', labId },
    include: { lab: true }
  })
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, labId: user.labId, lab: user.lab })
}

/**
 * Admin-only registration (superadmin can create any role)
 */
const register = async (req, res) => {
  const { name, email, password, role, labId } = req.body

  // Validate student must have a lab
  if (role === 'student' && !labId) {
    const e = new Error('labId is required for student role')
    e.status = 400
    throw e
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
    data: { name, email: email.toLowerCase(), password: hash, role, labId: role === 'superadmin' ? null : labId || null },
    include: { lab: true }
  })
  await logAudit({ userId: req.user.id, action: 'create', entity: 'user', entityId: user.id })
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, labId: user.labId, lab: user.lab })
}

const login = async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { lab: true } })
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
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, labId: user.labId, lab: user.lab } })
}

module.exports = { register, registerStudent, login }
