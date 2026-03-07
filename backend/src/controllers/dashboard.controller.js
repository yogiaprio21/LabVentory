const { prisma } = require('../prisma/client')
const { Prisma } = require('@prisma/client')

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

  const whereInv = req.user.role === 'admin' ? { labId: req.user.labId } : {}
  const totalItems = await prisma.inventory.count({ where: whereInv })
  const totalBorrowed = await prisma.borrowing.count({
    where: { status: { in: ['approved', 'late'] }, inventory: whereInv }
  })
  const lateCount = await prisma.borrowing.count({
    where: { status: 'late', inventory: whereInv }
  })
  const monthly = await prisma.$queryRaw(
    Prisma.sql`
      SELECT date_trunc('month', "borrowDate") as month, count(*)::int as count
      FROM "Borrowing" b
      ${Object.keys(whereInv).length ? Prisma.sql`JOIN "Inventory" i ON i.id = b."inventoryId" AND i."labId" = ${whereInv.labId}` : Prisma.empty}
      GROUP BY 1
      ORDER BY 1
    `
  )
  const mostBorrowed = await prisma.$queryRaw(
    Prisma.sql`
      SELECT i.name, sum(b.quantity)::int as count
      FROM "Borrowing" b
      JOIN "Inventory" i ON i.id = b."inventoryId"
      ${Object.keys(whereInv).length ? Prisma.sql`WHERE i."labId" = ${whereInv.labId}` : Prisma.empty}
      GROUP BY i.name
      ORDER BY count DESC
      LIMIT 5
    `
  )
  const stockPerCategory = await prisma.$queryRaw(
    Prisma.sql`
      SELECT c.name, sum(i."totalStock")::int as total, sum(i."availableStock")::int as available
      FROM "Inventory" i
      JOIN "Category" c ON c.id = i."categoryId"
      ${Object.keys(whereInv).length ? Prisma.sql`WHERE i."labId" = ${whereInv.labId}` : Prisma.empty}
      GROUP BY c.name
    `
  )

  const dailyTrends = await prisma.$queryRaw(
    Prisma.sql`
      SELECT date_trunc('day', "borrowDate") as day, count(*)::int as count
      FROM "Borrowing" b
      ${Object.keys(whereInv).length ? Prisma.sql`JOIN "Inventory" i ON i.id = b."inventoryId" AND i."labId" = ${whereInv.labId}` : Prisma.empty}
      WHERE "borrowDate" >= now() - interval '7 days'
      GROUP BY 1
      ORDER BY 1
    `
  )

  res.json({ totalItems, totalBorrowed, lateCount, monthly, mostBorrowed, stockPerCategory, dailyTrends })
}

module.exports = { summary }
