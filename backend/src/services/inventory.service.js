const { prisma } = require('../prisma/client')
const { generateQrDataUrl } = require('../utils/qrcode')

const createInventory = async (data) => {
  const item = await prisma.inventory.create({ data })
  const code = await generateQrDataUrl(`inventory:${item.id}`)
  const updated = await prisma.inventory.update({ where: { id: item.id }, data: { qrCodeUrl: code } })
  return updated
}

const updateInventory = async (id, data) => {
  const updated = await prisma.inventory.update({ where: { id }, data })
  return updated
}

const ensureStockAvailable = (item, quantity) => {
  if (quantity <= 0 || quantity > item.availableStock) {
    const e = new Error('Insufficient stock')
    e.status = 400
    throw e
  }
}

module.exports = { createInventory, updateInventory, ensureStockAvailable }
