const { prisma } = require('../prisma/client')

const listLogs = async (req, res) => {
  const { userId, from, to } = req.query
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 20

  const where = {}
  if (userId) where.userId = Number(userId)
  if (from || to) {
    where.timestamp = {}
    if (from) where.timestamp.gte = new Date(from)
    if (to) where.timestamp.lte = new Date(to)
  }
  // Admin restricted to their lab users
  if (req.user.role === 'admin') {
    const users = await prisma.user.findMany({ where: { labId: req.user.labId }, select: { id: true } })
    const ids = users.map(u => u.id)
    where.userId = where.userId ? where.userId : { in: ids }
    if (where.userId && typeof where.userId === 'number' && !ids.includes(where.userId)) {
      return res.json({ data: [], meta: { total: 0, page, limit, totalPages: 0 } })
    }
  }
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
