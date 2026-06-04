const { Prisma } = require('@prisma/client')
const { prisma } = require('../prisma/client')

const toIso = (value) => new Date(value).toISOString()

const summary = async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalItems,
    stockAggregate,
    activeBorrowings,
    lateBorrowings,
    pendingBorrowings,
    activeInstitutions,
    totalInstitutions,
    activeLabs,
    totalLabs,
    activeUsers,
    totalUsers,
    tenantRows,
    stockRows,
    dailyRows,
    topLabRows
  ] = await Promise.all([
    prisma.inventory.count(),
    prisma.inventory.aggregate({
      _sum: { totalStock: true, availableStock: true }
    }),
    prisma.borrowing.count({ where: { status: { in: ['approved', 'late'] } } }),
    prisma.borrowing.count({ where: { status: 'late' } }),
    prisma.borrowing.count({ where: { status: 'pending' } }),
    prisma.institution.count({ where: { status: 'active' } }),
    prisma.institution.count(),
    prisma.lab.count({ where: { status: 'active' } }),
    prisma.lab.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count(),
    prisma.$queryRaw`
      SELECT ins."id", ins."name", ins."status",
        COALESCE(l."labs", 0)::int AS "labs",
        COALESCE(u."users", 0)::int AS "users",
        COALESCE(inv."items", 0)::int AS "items",
        COALESCE(inv."totalStock", 0)::int AS "totalStock",
        COALESCE(br."activeBorrowings", 0)::int AS "activeBorrowings"
      FROM "Institution" ins
      LEFT JOIN (
        SELECT "institutionId", COUNT(*)::int AS "labs"
        FROM "Lab"
        WHERE "status" = 'active'
        GROUP BY "institutionId"
      ) l ON l."institutionId" = ins."id"
      LEFT JOIN (
        SELECT "institutionId", COUNT(*)::int AS "users"
        FROM "User"
        WHERE "status" = 'active'
        GROUP BY "institutionId"
      ) u ON u."institutionId" = ins."id"
      LEFT JOIN (
        SELECT l."institutionId", COUNT(i."id")::int AS "items", COALESCE(SUM(i."totalStock"), 0)::int AS "totalStock"
        FROM "Lab" l
        LEFT JOIN "Inventory" i ON i."labId" = l."id"
        GROUP BY l."institutionId"
      ) inv ON inv."institutionId" = ins."id"
      LEFT JOIN (
        SELECT l."institutionId", COUNT(b."id")::int AS "activeBorrowings"
        FROM "Borrowing" b
        JOIN "Inventory" i ON i."id" = b."inventoryId"
        JOIN "Lab" l ON l."id" = i."labId"
        WHERE b."status" IN ('approved', 'late')
        GROUP BY l."institutionId"
      ) br ON br."institutionId" = ins."id"
      ORDER BY ins."name" ASC
    `,
    prisma.$queryRaw`
      SELECT c."name" AS "name", COALESCE(SUM(i."totalStock"), 0)::int AS "total", COALESCE(SUM(i."availableStock"), 0)::int AS "available"
      FROM "Inventory" i
      JOIN "Category" c ON c."id" = i."categoryId"
      GROUP BY c."name"
      ORDER BY c."name" ASC
    `,
    prisma.$queryRaw`
      SELECT date_trunc('day', b."borrowDate") AS "day", COUNT(*)::int AS "count"
      FROM "Borrowing" b
      WHERE b."borrowDate" >= ${sevenDaysAgo}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw`
      SELECT l."id", l."name", ins."name" AS "institutionName",
        COALESCE(inv."items", 0)::int AS "items",
        COALESCE(inv."totalStock", 0)::int AS "totalStock",
        COALESCE(br."activeBorrowings", 0)::int AS "activeBorrowings"
      FROM "Lab" l
      JOIN "Institution" ins ON ins."id" = l."institutionId"
      LEFT JOIN (
        SELECT "labId", COUNT(*)::int AS "items", COALESCE(SUM("totalStock"), 0)::int AS "totalStock"
        FROM "Inventory"
        GROUP BY "labId"
      ) inv ON inv."labId" = l."id"
      LEFT JOIN (
        SELECT i."labId", COUNT(b."id")::int AS "activeBorrowings"
        FROM "Borrowing" b
        JOIN "Inventory" i ON i."id" = b."inventoryId"
        WHERE b."status" IN ('approved', 'late')
        GROUP BY i."labId"
      ) br ON br."labId" = l."id"
      WHERE l."status" = 'active'
      ORDER BY "activeBorrowings" DESC, "totalStock" DESC, l."name" ASC
      LIMIT 8
    `
  ])

  res.json({
    generatedAt: new Date().toISOString(),
    totals: {
      totalItems,
      totalStock: stockAggregate._sum.totalStock || 0,
      availableStock: stockAggregate._sum.availableStock || 0,
      activeBorrowings,
      lateBorrowings,
      pendingBorrowings,
      activeInstitutions,
      totalInstitutions,
      activeLabs,
      totalLabs,
      activeUsers,
      totalUsers
    },
    tenantDistribution: tenantRows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      labs: row.labs,
      users: row.users,
      items: row.items,
      totalStock: row.totalStock,
      activeBorrowings: row.activeBorrowings
    })),
    stockPerCategory: stockRows.map(row => ({ name: row.name, total: row.total, available: row.available })),
    dailyTrends: dailyRows.map(row => ({ day: toIso(row.day), count: row.count })),
    topLabs: topLabRows.map(row => ({
      id: row.id,
      name: row.name,
      institutionName: row.institutionName,
      items: row.items,
      totalStock: row.totalStock,
      activeBorrowings: row.activeBorrowings
    }))
  })
}

module.exports = { summary }
