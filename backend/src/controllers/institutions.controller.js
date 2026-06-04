const { prisma } = require('../prisma/client')
const bcrypt = require('bcryptjs')
const { Prisma } = require('@prisma/client')
const { logAudit } = require('../utils/audit')

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const normalizeSlug = (value) => {
  const next = slugify(value || '')
  if (!next) {
    const e = new Error('Institution slug must contain letters or numbers')
    e.status = 400
    throw e
  }
  return next
}

const normalizeDomain = (value) => {
  if (value === null || value === undefined || value === '') return null
  return String(value).trim().toLowerCase()
}

const handlePrismaWriteError = (e) => {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2025') {
      const err = new Error('Institution not found')
      err.status = 404
      throw err
    }
    if (e.code === 'P2002') {
      const err = new Error('Institution unique field already exists')
      err.status = 409
      throw err
    }
  }
  throw e
}

const list = async (req, res) => {
  const institutions = await prisma.institution.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { labs: true, users: true } } }
  })
  res.json(institutions)
}

const create = async (req, res) => {
  const { name, slug, status = 'active', domain, registrationMode = 'invite', admin } = req.body
  const useSlug = normalizeSlug(slug || name)
  const useDomain = normalizeDomain(domain)
  const existing = await prisma.institution.findUnique({ where: { slug: useSlug } })
  if (existing) {
    const e = new Error('Institution slug already exists')
    e.status = 409
    throw e
  }

  const result = await prisma.$transaction(async (tx) => {
    const institution = await tx.institution.create({
      data: { name, slug: useSlug, status, domain: useDomain, registrationMode }
    })

    let adminUser = null
    if (admin) {
      const emailTaken = await tx.user.findUnique({ where: { email: admin.email.toLowerCase() } })
      if (emailTaken) {
        const e = new Error('Admin email already in use')
        e.status = 409
        throw e
      }
      adminUser = await tx.user.create({
        data: {
          name: admin.name,
          email: admin.email.toLowerCase(),
          password: await bcrypt.hash(admin.password, 10),
          role: 'institution_admin',
          institutionId: institution.id
        },
        select: { id: true, name: true, email: true, role: true, institutionId: true }
      })
    }

    return { institution, adminUser }
  }).catch(handlePrismaWriteError)

  await logAudit({
    userId: req.user.id,
    institutionId: result.institution.id,
    action: 'create',
    entity: 'institution',
    entityId: result.institution.id,
    details: { adminUserId: result.adminUser?.id || null, registrationMode }
  })
  res.status(201).json(result)
}

const update = async (req, res) => {
  const id = Number(req.params.id)
  const { name, slug, status, domain, registrationMode } = req.body
  const useSlug = slug !== undefined ? normalizeSlug(slug) : undefined
  if (slug !== undefined) {
    const taken = await prisma.institution.findUnique({ where: { slug: useSlug } })
    if (taken && taken.id !== id) {
      const e = new Error('Institution slug already exists')
      e.status = 409
      throw e
    }
  }
  const institution = await prisma.institution.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(useSlug !== undefined ? { slug: useSlug } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(domain !== undefined ? { domain: normalizeDomain(domain) } : {}),
        ...(registrationMode !== undefined ? { registrationMode } : {})
      }
    })
    .catch(handlePrismaWriteError)
  await logAudit({ userId: req.user.id, institutionId: id, action: 'update', entity: 'institution', entityId: id, details: { name, slug, status, domain, registrationMode } })
  res.json(institution)
}

module.exports = { list, create, update }
