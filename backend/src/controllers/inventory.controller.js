const { prisma } = require('../prisma/client')
const { createInventory, updateInventory, ensureStockAvailable } = require('../services/inventory.service')
const { logAudit } = require('../utils/audit')
const { auditDetails, buildChanges } = require('../utils/audit-details')
const { assertActiveLabAccess, assertCategoryAccess, assertInventoryAccess, scopedInventoryWhere, isPlatformAdmin, isInstitutionAdmin, badRequest } = require('../utils/tenancy')

const parseInventoryQrCode = (code) => {
  const match = String(code || '').trim().match(/^inventory:(\d+)$/)
  return match ? Number(match[1]) : null
}

const create = async (req, res) => {
  const { name, categoryId, labId, totalStock, availableStock, minStock, location, condition } = req.body
  const useLab = (!isPlatformAdmin(req.user) && !isInstitutionAdmin(req.user)) ? req.user.labId : labId
  if (!useLab) throw badRequest('labId is required')
  await assertActiveLabAccess(req.user, useLab)
  await assertCategoryAccess(req.user, categoryId, useLab)
  const data = { name, categoryId, labId: Number(useLab), totalStock, availableStock, minStock: minStock || 0, location, condition }
  const item = await createInventory(data)
  await logAudit({
    userId: req.user.id,
    action: 'create',
    entity: 'inventory',
    entityId: item.id,
    details: auditDetails({
      summary: `Created inventory item "${item.name}"`,
      attributes: [
        { label: 'Item name', value: item.name },
        { label: 'Lab ID', value: item.labId },
        { label: 'Category ID', value: item.categoryId },
        { label: 'Total stock', value: item.totalStock },
        { label: 'Available stock', value: item.availableStock },
        { label: 'Minimum stock', value: item.minStock },
        { label: 'Location', value: item.location },
        { label: 'Condition', value: item.condition }
      ]
    })
  })
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

  const proposed = {
    name,
    categoryId,
    totalStock,
    availableStock,
    minStock,
    location,
    condition
  }
  const changes = buildChanges(existing, proposed, ['name', 'categoryId', 'totalStock', 'availableStock', 'minStock', 'location', 'condition'])

  const item = await updateInventory(id, { name, categoryId, totalStock, availableStock, minStock, location, condition })
  await logAudit({
    userId: req.user.id,
    action: 'update',
    entity: 'inventory',
    entityId: id,
    details: auditDetails({
      summary: changes.length ? `Updated ${changes.length} field${changes.length === 1 ? '' : 's'} on "${existing.name}"` : `Updated "${existing.name}"`,
      changes
    })
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

const resolveQr = async (req, res) => {
  const inventoryId = parseInventoryQrCode(req.body.code)
  if (!inventoryId) throw badRequest('Invalid inventory QR code')

  const item = await assertInventoryAccess(req.user, inventoryId)
  res.json({
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    labId: item.labId,
    totalStock: item.totalStock,
    availableStock: item.availableStock,
    minStock: item.minStock,
    location: item.location,
    condition: item.condition,
    qrCodeUrl: item.qrCodeUrl,
    lab: item.lab,
    category: item.category
  })
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

module.exports = { create, update, remove, get, resolveQr, list }
