const { prisma } = require('../prisma/client')
const { requestBorrow, approveBorrow, rejectBorrow, returnBorrow, markDamaged: serviceMarkDamaged, markLost: serviceMarkLost } = require('../services/borrowing.service')
const { sendMail } = require('../config/mailer')
const { borrowingApproved, borrowingRejected } = require('../utils/emailTemplates')
const { logAudit } = require('../utils/audit')

const create = async (req, res) => {
  const { inventoryId, quantity, dueDate } = req.body
  const inv = await prisma.inventory.findUnique({ where: { id: inventoryId } })
  if (!inv) {
    const e = new Error('Inventory not found')
    e.status = 404
    throw e
  }
  // Students can borrow from any lab
  const borrow = await requestBorrow({ userId: req.user.id, inventoryId, quantity, dueDate })
  await logAudit({ userId: req.user.id, action: 'create', entity: 'borrowing', entityId: borrow.id })
  res.status(201).json(borrow)
}

const approve = async (req, res) => {
  const id = Number(req.params.id)
  const b = await prisma.borrowing.findUnique({ where: { id }, include: { inventory: true, user: true } })
  if (!b) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  if (req.user.role === 'admin' && b.inventory.labId !== req.user.labId) {
    const e = new Error('Forbidden')
    e.status = 403
    throw e
  }
  const updated = await approveBorrow(id)
  const t = borrowingApproved(b.user, b.inventory)
  await sendMail({ to: b.user.email, subject: t.subject, text: t.text })
  await logAudit({ userId: req.user.id, action: 'approve', entity: 'borrowing', entityId: id })
  res.json(updated)
}

const reject = async (req, res) => {
  const id = Number(req.params.id)
  const b = await prisma.borrowing.findUnique({ where: { id }, include: { inventory: true, user: true } })
  if (!b) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  if (req.user.role === 'admin' && b.inventory.labId !== req.user.labId) {
    const e = new Error('Forbidden')
    e.status = 403
    throw e
  }
  const updated = await rejectBorrow(id)
  const t = borrowingRejected(b.user, b.inventory)
  await sendMail({ to: b.user.email, subject: t.subject, text: t.text })
  await logAudit({ userId: req.user.id, action: 'reject', entity: 'borrowing', entityId: id })
  res.json(updated)
}

const returnItem = async (req, res) => {
  const id = Number(req.params.id)
  const b = await prisma.borrowing.findUnique({ where: { id }, include: { inventory: true, user: true } })
  if (!b) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  if (req.user.role === 'admin' && b.inventory.labId !== req.user.labId) {
    const e = new Error('Forbidden')
    e.status = 403
    throw e
  }
  const updated = await returnBorrow(id)
  await logAudit({ userId: req.user.id, action: 'return', entity: 'borrowing', entityId: id })
  res.json(updated)
}

const list = async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const skip = (page - 1) * limit

  const where = req.user.role === 'student' || req.user.role === 'admin'
    ? {
      user: req.user.role === 'student' ? { id: req.user.id } : undefined,
      inventory: req.user.role === 'admin' ? { labId: req.user.labId } : undefined
    }
    : {}

  const [data, total] = await Promise.all([
    prisma.borrowing.findMany({
      where,
      include: { user: true, inventory: { include: { lab: true } } },
      orderBy: { id: 'desc' }, // Latest first is usually better for logs/history
      skip,
      take: limit
    }),
    prisma.borrowing.count({ where })
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

const markDamaged = async (req, res) => {
  const id = Number(req.params.id)
  const updated = await serviceMarkDamaged(id)
  await logAudit({ userId: req.user.id, action: 'mark_damaged', entity: 'borrowing', entityId: id })
  res.json(updated)
}

const markLost = async (req, res) => {
  const id = Number(req.params.id)
  const updated = await serviceMarkLost(id)
  await logAudit({ userId: req.user.id, action: 'mark_lost', entity: 'borrowing', entityId: id })
  res.json(updated)
}

module.exports = { create, approve, reject, returnItem, list, markDamaged, markLost }
