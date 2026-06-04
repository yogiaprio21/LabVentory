const { prisma } = require('../prisma/client')
const { createInventory, updateInventory, ensureStockAvailable } = require('../services/inventory.service')
const { logAudit } = require('../utils/audit')
const { assertLabAccess, assertCategoryAccess, assertInventoryAccess, scopedInventoryWhere, isPlatformAdmin, isInstitutionAdmin, badRequest } = require('../utils/tenancy')

const create = async (req, res) => {
  const { name, categoryId, labId, totalStock, availableStock, minStock, location, condition } = req.body
  const useLab = (!isPlatformAdmin(req.user) && !isInstitutionAdmin(req.user)) ? req.user.labId : labId
  if (!useLab) throw badRequest('labId is required')
  await assertLabAccess(req.user, useLab)
  await assertCategoryAccess(req.user, categoryId, useLab)
  const data = { name, categoryId, labId: Number(useLab), totalStock, availableStock, minStock: minStock || 0, location, condition }
  const item = await createInventory(data)
  await logAudit({ userId: req.user.id, action: 'create', entity: 'inventory', entityId: item.id, details: data })
  res.status(201).json(item)
}

const update = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await assertInventoryAccess(req.user, id).catch(err => {
    if (err.status === 403) {
      err.message = 'Not Found'
      err.status = 404
    }
    throw err
  })
  if (!existing) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  const { name, categoryId, totalStock, availableStock, minStock, location, condition } = req.body
  await assertCategoryAccess(req.user, categoryId, existing.labId)

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
  const existing = await assertInventoryAccess(req.user, id).catch(err => {
    if (err.status === 403) {
      err.message = 'Not Found'
      err.status = 404
    }
    throw err
  })
  if (!existing) {
    const e = new Error('Not Found')
    e.status = 404
    throw e
  }
  await prisma.inventory.delete({ where: { id } })
  await logAudit({ userId: req.user.id, action: 'delete', entity: 'inventory', entityId: id })
  res.status(204).send()
}

const get = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await assertInventoryAccess(req.user, id)
  res.json(existing)
}

const list = async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const skip = (page - 1) * limit
  const search = req.query.q || ''
  const categoryId = req.query.categoryId && req.query.categoryId !== 'all' ? Number(req.query.categoryId) : undefined

  const where = scopedInventoryWhere(req.user, {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(categoryId ? { categoryId } : {})
  })

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
