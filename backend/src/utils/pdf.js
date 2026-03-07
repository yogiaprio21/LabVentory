const PDFDocument = require('pdfkit')
const dayjs = require('dayjs')

const COLORS = {
  primary: '#4f46e5', // Indigo 600
  secondary: '#64748b', // Slate 500
  border: '#e2e8f0', // Slate 200
  background: '#f8fafc', // Slate 50
  text: '#0f172a' // Slate 900
}

const drawHeader = (doc, title) => {
  // Brand Header
  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.background)

  doc.fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .fontSize(24)
    .text('L', 40, 35, { characterSpacing: 1 })
    .fillColor(COLORS.text)
    .fontSize(20)
    .text('LabVentory', 65, 38)

  doc.fillColor(COLORS.secondary)
    .fontSize(10)
    .font('Helvetica')
    .text('Professional Laboratory Management System', 65, 60)

  doc.fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text(title, 40, 120)
}

const drawFooter = (doc) => {
  const range = doc.page.height - 40
  doc.moveTo(40, range).lineTo(doc.page.width - 40, range).strokeColor(COLORS.border).stroke()
  doc.fillColor(COLORS.secondary)
    .fontSize(8)
    .text(`Generated on ${dayjs().format('MMMM D, YYYY [at] HH:mm')} | © 2026 LabVentory Systems`, 40, range + 10, { align: 'center', width: doc.page.width - 80 })
}

const drawTable = (doc, headers, rows, startY) => {
  let currentY = startY
  const colWidth = (doc.page.width - 80) / headers.length

  // Table Header
  doc.rect(40, currentY, doc.page.width - 80, 25).fill(COLORS.primary)
  doc.fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(10)

  headers.forEach((h, i) => {
    doc.text(h.toUpperCase(), 40 + i * colWidth + 10, currentY + 8, { width: colWidth - 20, align: 'left' })
  })

  currentY += 25
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.text)

  rows.forEach((row, rowIndex) => {
    // Zebra stipe
    if (rowIndex % 2 === 0) {
      doc.rect(40, currentY, doc.page.width - 80, 20).fill('#f1f5f9')
    }

    doc.fillColor(COLORS.text)
    row.forEach((cell, i) => {
      doc.text(cell.toString(), 40 + i * colWidth + 10, currentY + 6, { width: colWidth - 20, align: 'left', ellipsis: true })
    })

    currentY += 20

    // Check for page break (simple check)
    if (currentY > doc.page.height - 80) {
      doc.addPage()
      currentY = 50
    }
  })
}

const borrowingReportPdf = (records, range) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  drawHeader(doc, 'Borrowing History Report')

  if (range) {
    doc.fillColor(COLORS.secondary).fontSize(10).font('Helvetica').text(`Reporting Period: ${range}`, 40, 145)
  }

  const headers = ['Date', 'Borrower', 'Equipment', 'Qty', 'Status']
  const rows = records.map(r => [
    dayjs(r.borrowDate).format('YYYY-MM-DD'),
    r.user.name,
    r.inventory.name,
    r.quantity,
    r.status.toUpperCase()
  ])

  drawTable(doc, headers, rows, 170)
  drawFooter(doc)
  doc.end()
  return doc
}

const inventorySummaryPdf = (items) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  drawHeader(doc, 'Inventory Summary Report')

  const headers = ['Item Name', 'Condition', 'Total', 'Available', 'Status']
  const rows = items.map(i => [
    i.name,
    i.condition || 'Good',
    i.totalStock,
    i.availableStock,
    i.availableStock > 0 ? 'AVAILABLE' : 'OUT'
  ])

  drawTable(doc, headers, rows, 150)
  drawFooter(doc)
  doc.end()
  return doc
}

module.exports = { borrowingReportPdf, inventorySummaryPdf }
