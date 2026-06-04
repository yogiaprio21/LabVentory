const { prisma } = require('../prisma/client')
const { assertActiveLabAccess, assertCategoryAccess, scopedCategoryWhere, isPlatformAdmin, isInstitutionAdmin } = require('../utils/tenancy')

const createCategory = async (req, res) => {
  const { name, labId } = req.body
  let useLab = labId
  if (!isPlatformAdmin(req.user) && !isInstitutionAdmin(req.user)) {
    useLab = req.user.labId
  }

  if (!useLab) {
    const e = new Error('labId is required to create a category')
    e.status = 400
    throw e
  }

  await assertActiveLabAccess(req.user, useLab)
  const cat = await prisma.category.create({ data: { name, labId: Number(useLab) } })
  res.status(201).json(cat)
}

const updateCategory = async (req, res) => {
  const id = Number(req.params.id)
  const { name } = req.body
  const existing = await assertCategoryAccess(req.user, id).catch(err => {
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
  const cat = await prisma.category.update({ where: { id }, data: { name } })
  res.json(cat)
}

const deleteCategory = async (req, res) => {
  const id = Number(req.params.id)
  const existing = await assertCategoryAccess(req.user, id).catch(err => {
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
  await prisma.category.delete({ where: { id } })
  res.status(204).send()
}

const listCategories = async (req, res) => {
  const where = scopedCategoryWhere(req.user)
  const cats = await prisma.category.findMany({ where, orderBy: { id: 'asc' } })
  res.json(cats)
}

module.exports = { createCategory, updateCategory, deleteCategory, listCategories }
