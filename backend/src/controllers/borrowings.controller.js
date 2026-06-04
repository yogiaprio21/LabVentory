const { prisma } = require('../prisma/client')
const { requestBorrow, approveBorrow, rejectBorrow, returnBorrow, markDamaged: serviceMarkDamaged, markLost: serviceMarkLost } = require('../services/borrowing.service')
const { logAudit } = require('../utils/audit')
const { assertInventoryAccess, assertBorrowingAccess, scopedBorrowingWhere } = require('../utils/tenancy')

const create = async (req, res) => {
  const { inventoryId, quantity, dueDate } = req.body
  await assertInventoryAccess(req.user, inventoryId)
  const borrow = await requestBorrow({ actor: req.user, userId: req.user.id, inventoryId, quantity, dueDate })
  await logAudit({ userId: req.user.id, action: 'create', entity: 'borrowing', entityId: borrow.id })
  res.status(201).json(borrow)
}

const approve = async (req, res) => {
  const id = Number(req.params.id)
  const b = await assertBorrowingAccess(req.user, id)
  if (!b) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  const updated = await approveBorrow(id, req.user)
  await logAudit({ userId: req.user.id, action: 'approve', entity: 'borrowing', entityId: id })
  res.json(updated)
}

const reject = async (req, res) => {
  const id = Number(req.params.id)
  const b = await assertBorrowingAccess(req.user, id)
  if (!b) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  const updated = await rejectBorrow(id, req.user)
  await logAudit({ userId: req.user.id, action: 'reject', entity: 'borrowing', entityId: id })
  res.json(updated)
}

const returnItem = async (req, res) => {
  const id = Number(req.params.id)
  const b = await assertBorrowingAccess(req.user, id)
  if (!b) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  const updated = await returnBorrow(id, req.user)
  await logAudit({ userId: req.user.id, action: 'return', entity: 'borrowing', entityId: id })
  res.json(updated)
}

const list = async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const skip = (page - 1) * limit
  const { from, to, status } = req.query

  const filters = { ...(status ? { status } : {}) }
  if (from || to) {
    filters.borrowDate = {}
    if (from) filters.borrowDate.gte = new Date(from)
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      filters.borrowDate.lte = end
    }
  }
  const where = scopedBorrowingWhere(req.user, filters)

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
  await assertBorrowingAccess(req.user, id)
  const updated = await serviceMarkDamaged(id, req.user)
  await logAudit({ userId: req.user.id, action: 'mark_damaged', entity: 'borrowing', entityId: id })
  res.json(updated)
}

const markLost = async (req, res) => {
  const id = Number(req.params.id)
  await assertBorrowingAccess(req.user, id)
  const updated = await serviceMarkLost(id, req.user)
  await logAudit({ userId: req.user.id, action: 'mark_lost', entity: 'borrowing', entityId: id })
  res.json(updated)
}

module.exports = { create, approve, reject, returnItem, list, markDamaged, markLost }
