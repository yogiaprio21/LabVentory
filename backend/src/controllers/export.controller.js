const { prisma } = require('../prisma/client')
const { borrowingReportPdf, inventorySummaryPdf } = require('../utils/pdf')
const dayjs = require('dayjs')
const { scopedBorrowingWhere, scopedInventoryWhere } = require('../utils/tenancy')

const borrowingReport = async (req, res) => {
  const { from, to } = req.query
  const fromDate = from ? dayjs(from).toDate() : new Date(0)
  const toDate = to ? dayjs(to).toDate() : new Date()
  const records = await prisma.borrowing.findMany({
    where: scopedBorrowingWhere(req.user, { borrowDate: { gte: fromDate, lte: toDate } }),
    include: { user: true, inventory: true },
    orderBy: { borrowDate: 'asc' }
  })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="borrowing_report.pdf"')
  const doc = borrowingReportPdf(records, `${from || ''} - ${to || ''}`)
  doc.pipe(res)
}

const inventorySummary = async (req, res) => {
  const where = scopedInventoryWhere(req.user)
  const items = await prisma.inventory.findMany({ where })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="inventory_summary.pdf"')
  const doc = inventorySummaryPdf(items)
  doc.pipe(res)
}

module.exports = { borrowingReport, inventorySummary }
