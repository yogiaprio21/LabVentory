const { prisma } = require('../prisma/client')
const { Prisma } = require('@prisma/client')
const { scopedBorrowingWhere, scopedInventoryWhere, isPlatformAdmin, isInstitutionAdmin, isLabAdmin, tenantIdOf } = require('../utils/tenancy')

const scopeConditions = (user) => {
  if (isPlatformAdmin(user)) return []
  if (isInstitutionAdmin(user)) return [Prisma.sql`l."institutionId" = ${tenantIdOf(user) || -1}`]
  if (isLabAdmin(user)) return [Prisma.sql`i."labId" = ${user.labId || -1}`]
  return [Prisma.sql`false`]
}

const whereSql = (conditions) => conditions.length
  ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
  : Prisma.empty

const toIso = (value) => new Date(value).toISOString()

const summary = async (req, res) => {
  if (req.user.role === 'student') {
    const totalBorrowed = await prisma.borrowing.count({ where: { userId: req.user.id } })
    const activeBorrowed = await prisma.borrowing.count({ where: { userId: req.user.id, status: 'approved' } })
    const lateCount = await prisma.borrowing.count({ where: { userId: req.user.id, status: 'late' } })

    const recentBorrowings = await prisma.borrowing.findMany({
      where: { userId: req.user.id },
      include: { inventory: { include: { lab: true } } },
      orderBy: { id: 'desc' },
      take: 5
    })

    return res.json({ isStudent: true, totalBorrowed, activeBorrowed, lateCount, recentBorrowings })
  }

  const inventoryWhere = scopedInventoryWhere(req.user)
  const borrowingScope = scopedBorrowingWhere(req.user)
  const totalItems = await prisma.inventory.count({ where: inventoryWhere })
  const totalBorrowed = await prisma.borrowing.count({
    where: scopedBorrowingWhere(req.user, { status: { in: ['approved', 'late'] } })
  })
  const lateCount = await prisma.borrowing.count({
    where: scopedBorrowingWhere(req.user, { status: 'late' })
  })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const baseConditions = scopeConditions(req.user)
  const dailyConditions = [...baseConditions, Prisma.sql`b."borrowDate" >= ${sevenDaysAgo}`]

  const [monthlyRows, mostBorrowedRows, stockRows, dailyRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT date_trunc('month', b."borrowDate") AS month, COUNT(*)::int AS count
      FROM "Borrowing" b
      JOIN "Inventory" i ON i."id" = b."inventoryId"
      JOIN "Lab" l ON l."id" = i."labId"
      ${whereSql(baseConditions)}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw`
      SELECT i."name" AS name, COALESCE(SUM(b."quantity"), 0)::int AS count
      FROM "Borrowing" b
      JOIN "Inventory" i ON i."id" = b."inventoryId"
      JOIN "Lab" l ON l."id" = i."labId"
      ${whereSql(baseConditions)}
      GROUP BY i."name"
      ORDER BY count DESC, i."name" ASC
      LIMIT 5
    `,
    prisma.$queryRaw`
      SELECT c."name" AS name, COALESCE(SUM(i."totalStock"), 0)::int AS total, COALESCE(SUM(i."availableStock"), 0)::int AS available
      FROM "Inventory" i
      JOIN "Category" c ON c."id" = i."categoryId"
      JOIN "Lab" l ON l."id" = i."labId"
      ${whereSql(baseConditions)}
      GROUP BY c."name"
      ORDER BY c."name" ASC
    `,
    prisma.$queryRaw`
      SELECT date_trunc('day', b."borrowDate") AS day, COUNT(*)::int AS count
      FROM "Borrowing" b
      JOIN "Inventory" i ON i."id" = b."inventoryId"
      JOIN "Lab" l ON l."id" = i."labId"
      ${whereSql(dailyConditions)}
      GROUP BY 1
      ORDER BY 1 ASC
    `
  ])

  const monthly = monthlyRows.map(row => ({ month: toIso(row.month), count: row.count }))
  const mostBorrowed = mostBorrowedRows.map(row => ({ name: row.name, count: row.count }))
  const stockPerCategory = stockRows.map(row => ({ name: row.name, total: row.total, available: row.available }))
  const dailyTrends = dailyRows.map(row => ({ day: toIso(row.day), count: row.count }))

  res.json({ totalItems, totalBorrowed, lateCount, monthly, mostBorrowed, stockPerCategory, dailyTrends })
}

module.exports = { summary }
