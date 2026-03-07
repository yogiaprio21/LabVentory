const { prisma } = require('../prisma/client')

const createCategory = async (req, res) => {
  const { name, labId } = req.body
  let useLab = labId
  if (req.user.role === 'admin' || req.user.role === 'student') {
    useLab = req.user.labId
  }

  if (!useLab) {
    const e = new Error('labId is required to create a category')
    e.status = 400
    throw e
  }

  const cat = await prisma.category.create({ data: { name, labId: useLab } })
  res.status(201).json(cat)
}

const updateCategory = async (req, res) => {
  const id = Number(req.params.id)
  const { name } = req.body
  const existing = await prisma.category.findUnique({ where: { id } })
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
  const cat = await prisma.category.update({ where: { id }, data: { name } })
  res.json(cat)
}

const deleteCategory = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.category.findUnique({ where: { id } })
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
  await prisma.category.delete({ where: { id } })
  res.status(204).send()
}

const listCategories = async (req, res) => {
  const where = req.user.role === 'student' || req.user.role === 'admin' ? { labId: req.user.labId } : {}
  const cats = await prisma.category.findMany({ where, orderBy: { id: 'asc' } })
  res.json(cats)
}

module.exports = { createCategory, updateCategory, deleteCategory, listCategories }
