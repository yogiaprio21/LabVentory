const jwt = require('jsonwebtoken')
const { env } = require('../config/env')
const { prisma } = require('../prisma/client')

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
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      const e = new Error('Unauthorized')
      e.status = 401
      return next(e)
    }
    req.user = user
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
  if (roles.length && !roles.includes(req.user.role)) {
    const e = new Error('Forbidden')
    e.status = 403
    return next(e)
  }
  next()
}

module.exports = { authenticate, authorize }
