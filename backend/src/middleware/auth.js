const jwt = require('jsonwebtoken')
const { env } = require('../config/env')
const { prisma } = require('../prisma/client')
const { tenantIdOf, isPlatformAdmin, isInstitutionAdmin, isLabAdmin } = require('../utils/tenancy')

const roleMatches = (actualRole, allowedRole) => {
  if (actualRole === allowedRole) return true
  if (allowedRole === 'superadmin') return ['superadmin', 'platform_admin'].includes(actualRole)
  if (allowedRole === 'admin') return ['admin', 'lab_admin', 'institution_admin'].includes(actualRole)
  return false
}

const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    const e = new Error('Unauthorized')
    e.status = 401
    return next(e)
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { lab: { include: { institution: true } }, institution: true }
    })
    if (!user) {
      const e = new Error('Unauthorized')
      e.status = 401
      return next(e)
    }
    req.user = user
    req.tenantId = tenantIdOf(user)
    req.isPlatformAdmin = isPlatformAdmin(user)
    req.isInstitutionAdmin = isInstitutionAdmin(user)
    req.isLabAdmin = isLabAdmin(user)
    next()
  } catch (err) {
    const e = new Error('Unauthorized')
    e.status = 401
    return next(e)
  }
}

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    const e = new Error('Unauthorized')
    e.status = 401
    return next(e)
  }
  if (roles.length && !roles.some(role => roleMatches(req.user.role, role))) {
    const e = new Error('Forbidden')
    e.status = 403
    return next(e)
  }
  next()
}

module.exports = { authenticate, authorize }
