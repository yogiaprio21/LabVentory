const { prisma } = require('../prisma/client')
const { borrowingReportPdf, inventorySummaryPdf } = require('../utils/pdf')
const dayjs = require('dayjs')

const borrowingReport = async (req, res) => {
  const { from, to } = req.query
  const fromDate = from ? dayjs(from).toDate() : new Date(0)
  const toDate = to ? dayjs(to).toDate() : new Date()
  const whereInv = req.user.role === 'student' || req.user.role === 'admin' ? { labId: req.user.labId } : {}
  const records = await prisma.borrowing.findMany({
    where: { borrowDate: { gte: fromDate, lte: toDate }, inventory: whereInv },
    include: { user: true, inventory: true },
    orderBy: { borrowDate: 'asc' }
  })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="borrowing_report.pdf"')
  const doc = borrowingReportPdf(records, `${from || ''} - ${to || ''}`)
  doc.pipe(res)
}

const inventorySummary = async (req, res) => {
  const where = req.user.role === 'student' || req.user.role === 'admin' ? { labId: req.user.labId } : {}
  const items = await prisma.inventory.findMany({ where })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="inventory_summary.pdf"')
  const doc = inventorySummaryPdf(items)
  doc.pipe(res)
}

module.exports = { borrowingReport, inventorySummary }
