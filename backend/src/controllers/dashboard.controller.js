const { prisma } = require('../prisma/client')
const { scopedBorrowingWhere, scopedInventoryWhere } = require('../utils/tenancy')

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

  const [borrowings, items] = await Promise.all([
    prisma.borrowing.findMany({
      where: borrowingScope,
      select: { borrowDate: true, quantity: true, inventory: { select: { name: true } } }
    }),
    prisma.inventory.findMany({
      where: inventoryWhere,
      select: {
        totalStock: true,
        availableStock: true,
        category: { select: { name: true } }
      }
    })
  ])

  const monthlyMap = new Map()
  const dailyMap = new Map()
  const borrowedMap = new Map()
  const stockMap = new Map()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  for (const b of borrowings) {
    const monthKey = new Date(b.borrowDate.getFullYear(), b.borrowDate.getMonth(), 1).toISOString()
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1)
    borrowedMap.set(b.inventory.name, (borrowedMap.get(b.inventory.name) || 0) + b.quantity)

    if (b.borrowDate >= sevenDaysAgo) {
      const dayKey = new Date(b.borrowDate.getFullYear(), b.borrowDate.getMonth(), b.borrowDate.getDate()).toISOString()
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1)
    }
  }

  for (const item of items) {
    const name = item.category.name
    const current = stockMap.get(name) || { name, total: 0, available: 0 }
    current.total += item.totalStock
    current.available += item.availableStock
    stockMap.set(name, current)
  }

  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))
  const mostBorrowed = Array.from(borrowedMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))
  const stockPerCategory = Array.from(stockMap.values())
  const dailyTrends = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }))

  res.json({ totalItems, totalBorrowed, lateCount, monthly, mostBorrowed, stockPerCategory, dailyTrends })
}

module.exports = { summary }
