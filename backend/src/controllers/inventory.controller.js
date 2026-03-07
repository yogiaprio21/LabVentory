const { prisma } = require('../prisma/client')
const { createInventory, updateInventory, ensureStockAvailable } = require('../services/inventory.service')
const { logAudit } = require('../utils/audit')

const create = async (req, res) => {
  const { name, categoryId, labId, totalStock, availableStock, minStock, location, condition } = req.body
  const useLab = req.user.role === 'admin' ? req.user.labId : labId
  const data = { name, categoryId, labId: useLab, totalStock, availableStock, minStock: minStock || 0, location, condition }
  const item = await createInventory(data)
  await logAudit({ userId: req.user.id, action: 'create', entity: 'inventory', entityId: item.id, details: data })
  res.status(201).json(item)
}

const update = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.inventory.findUnique({ where: { id } })
  if (!existing) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  if (req.user.role === 'admin' && existing.labId !== req.user.labId) {
    const e = new Error('Forbidden')
    e.status = 403
    throw e
  }
  const { name, categoryId, totalStock, availableStock, minStock, location, condition } = req.body

  // Track changes for audit
  const changes = {}
  if (name !== undefined && name !== existing.name) changes.name = { old: existing.name, new: name }
  if (totalStock !== undefined && totalStock !== existing.totalStock) changes.totalStock = { old: existing.totalStock, new: totalStock }
  if (availableStock !== undefined && availableStock !== existing.availableStock) changes.availableStock = { old: existing.availableStock, new: availableStock }
  if (minStock !== undefined && minStock !== existing.minStock) changes.minStock = { old: existing.minStock, new: minStock }

  const item = await updateInventory(id, { name, categoryId, totalStock, availableStock, minStock, location, condition })
  await logAudit({
    userId: req.user.id,
    action: 'update',
    entity: 'inventory',
    entityId: id,
    details: Object.keys(changes).length ? changes : { message: 'Fields updated (location/condition/cat)' }
  })
  res.json(item)
}

const remove = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.inventory.findUnique({ where: { id } })
  if (!existing) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  if (req.user.role === 'admin' && existing.labId !== req.user.labId) {
    const e = new Error('Forbidden')
    e.status = 403
    throw e
  }
  await prisma.inventory.delete({ where: { id } })
  await logAudit({ userId: req.user.id, action: 'delete', entity: 'inventory', entityId: id })
  res.status(204).send()
}

const get = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.inventory.findUnique({ where: { id } })
  if (!existing) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  if ((req.user.role === 'student' || req.user.role === 'admin') && existing.labId !== req.user.labId) {
    const e = new Error('Forbidden')
    e.status = 403
    throw e
  }
  res.json(existing)
}

const list = async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const skip = (page - 1) * limit
  const search = req.query.q || ''
  const categoryId = req.query.categoryId && req.query.categoryId !== 'all' ? Number(req.query.categoryId) : undefined

  const where = {
    ...(req.user.role === 'admin' ? { labId: req.user.labId } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(categoryId ? { categoryId } : {})
  }

  const [data, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: { lab: true },
      orderBy: { id: 'asc' },
      skip,
      take: limit
    }),
    prisma.inventory.count({ where })
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

module.exports = { create, update, remove, get, list }
