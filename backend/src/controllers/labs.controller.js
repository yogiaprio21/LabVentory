const { prisma } = require('../prisma/client')

const createLab = async (req, res) => {
  const { name, location } = req.body
  const lab = await prisma.lab.create({ data: { name, location } })
  res.status(201).json(lab)
}

const updateLab = async (req, res) => {
  const id = Number(req.params.id)
  const { name, location } = req.body
  const lab = await prisma.lab.update({ where: { id }, data: { name, location } })
  res.json(lab)
}

const deleteLab = async (req, res) => {
  const id = Number(req.params.id)
  await prisma.lab.delete({ where: { id } })
  res.status(204).send()
}

const getLabs = async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : null
  const limit = req.query.limit ? Number(req.query.limit) : 10

  if (!page) {
    // Return all for dropdowns/selects
    const labs = await prisma.lab.findMany({ orderBy: { id: 'asc' } })
    return res.json(labs)
  }

  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    prisma.lab.findMany({ orderBy: { id: 'asc' }, skip, take: limit }),
    prisma.lab.count()
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

module.exports = { createLab, updateLab, deleteLab, getLabs }
