const { prisma } = require('../prisma/client')
const { isPlatformAdmin, isInstitutionAdmin, tenantIdOf } = require('../utils/tenancy')

const listLogs = async (req, res) => {
  const { userId, from, to } = req.query
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 20

  const filters = []
  if (from || to) {
    const timestamp = {}
    if (from) timestamp.gte = new Date(from)
    if (to) timestamp.lte = new Date(to)
    filters.push({ timestamp })
  }
  if (userId) filters.push({ userId: Number(userId) })

  if (!isPlatformAdmin(req.user)) {
    if (isInstitutionAdmin(req.user)) {
      filters.push({ institutionId: tenantIdOf(req.user) || -1 })
    } else {
      filters.push({ user: { labId: req.user.labId || -1 } })
    }
  }

  const where = filters.length ? { AND: filters } : {}
  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })
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

module.exports = { listLogs }
