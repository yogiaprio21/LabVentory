const { prisma } = require('../prisma/client')

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const list = async (req, res) => {
  const institutions = await prisma.institution.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { labs: true, users: true } } }
  })
  res.json(institutions)
}

const create = async (req, res) => {
  const { name, slug, status = 'active' } = req.body
  const useSlug = slugify(slug || name)
  const institution = await prisma.institution.create({
    data: { name, slug: useSlug, status }
  })
  res.status(201).json(institution)
}

const update = async (req, res) => {
  const id = Number(req.params.id)
  const { name, slug, status } = req.body
  const institution = await prisma.institution.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(slug !== undefined ? { slug: slugify(slug) } : {}),
      ...(status !== undefined ? { status } : {})
    }
  })
  res.json(institution)
}

module.exports = { list, create, update }
