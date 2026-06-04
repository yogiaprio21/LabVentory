const { prisma } = require('../prisma/client')

const PLATFORM_ROLES = ['platform_admin', 'superadmin']
const INSTITUTION_ADMIN_ROLES = ['institution_admin']
const LAB_ADMIN_ROLES = ['lab_admin', 'admin']

const isPlatformAdmin = (user) => PLATFORM_ROLES.includes(user?.role)
const isInstitutionAdmin = (user) => INSTITUTION_ADMIN_ROLES.includes(user?.role)
const isLabAdmin = (user) => LAB_ADMIN_ROLES.includes(user?.role)
const isStudent = (user) => user?.role === 'student'
const canManageUsers = (user) => isPlatformAdmin(user) || isInstitutionAdmin(user)
const canManageLabs = (user) => isPlatformAdmin(user) || isInstitutionAdmin(user)
const canManageInventory = (user) => isPlatformAdmin(user) || isInstitutionAdmin(user) || isLabAdmin(user)

const tenantIdOf = (user) => user?.institutionId || user?.lab?.institutionId || null
const roleRequiresLab = (role) => ['student', 'admin', 'lab_admin'].includes(role)
const roleIsInstitutionScoped = (role) => role === 'institution_admin' || roleRequiresLab(role)
const roleIsPlatformScoped = (role) => ['platform_admin', 'superadmin'].includes(role)

const forbidden = () => {
  const e = new Error('Forbidden')
  e.status = 403
  return e
}

const badRequest = (message) => {
  const e = new Error(message)
  e.status = 400
  return e
}

const inactiveResource = (message = 'Resource is inactive') => {
  const e = new Error(message)
  e.status = 409
  return e
}

const mergeScope = (scope, extra = {}) => {
  if (!extra || Object.keys(extra).length === 0) return scope
  return { AND: [scope, extra] }
}

const scopedLabWhere = (user, extra = {}) => {
  if (isPlatformAdmin(user)) return extra
  const institutionId = tenantIdOf(user)
  if (!institutionId) return mergeScope({ id: -1 }, extra)
  return mergeScope({ institutionId }, extra)
}

const scopedUserWhere = (user, extra = {}) => {
  if (isPlatformAdmin(user)) return extra
  const institutionId = tenantIdOf(user)
  if (!institutionId) return mergeScope({ id: -1 }, extra)
  return mergeScope({ institutionId }, extra)
}

const scopedInventoryWhere = (user, extra = {}) => {
  if (isPlatformAdmin(user)) return extra
  if (isInstitutionAdmin(user)) {
    const institutionId = tenantIdOf(user)
    return mergeScope({ lab: { institutionId } }, extra)
  }
  if (isLabAdmin(user) || isStudent(user)) return mergeScope({ labId: user.labId || -1 }, extra)
  return mergeScope({ id: -1 }, extra)
}

const scopedCategoryWhere = (user, extra = {}) => {
  if (isPlatformAdmin(user)) return extra
  if (isInstitutionAdmin(user)) {
    const institutionId = tenantIdOf(user)
    return mergeScope({ lab: { institutionId } }, extra)
  }
  if (isLabAdmin(user) || isStudent(user)) return mergeScope({ labId: user.labId || -1 }, extra)
  return mergeScope({ id: -1 }, extra)
}

const scopedBorrowingWhere = (user, extra = {}) => {
  if (isPlatformAdmin(user)) return extra
  if (isInstitutionAdmin(user)) {
    const institutionId = tenantIdOf(user)
    return mergeScope({ inventory: { lab: { institutionId } } }, extra)
  }
  if (isLabAdmin(user)) return mergeScope({ inventory: { labId: user.labId || -1 } }, extra)
  if (isStudent(user)) return mergeScope({ userId: user.id }, extra)
  return mergeScope({ id: -1 }, extra)
}

const assertLabAccess = async (user, labId) => {
  if (!labId) throw badRequest('labId is required')
  const lab = await prisma.lab.findFirst({ where: scopedLabWhere(user, { id: Number(labId) }) })
  if (!lab) throw forbidden()
  return lab
}

const assertActiveLabAccess = async (user, labId) => {
  const lab = await assertLabAccess(user, labId)
  if (lab.status && lab.status !== 'active') throw inactiveResource('Laboratory is inactive')
  return lab
}

const assertInstitutionAccess = async (user, institutionId) => {
  if (!institutionId) throw badRequest('institutionId is required')
  if (isPlatformAdmin(user)) {
    const institution = await prisma.institution.findUnique({ where: { id: Number(institutionId) } })
    if (!institution) throw forbidden()
    return institution
  }
  if (Number(institutionId) !== Number(tenantIdOf(user))) throw forbidden()
  const institution = await prisma.institution.findUnique({ where: { id: Number(institutionId) } })
  if (!institution) throw forbidden()
  return institution
}

const assertCategoryAccess = async (user, categoryId, expectedLabId) => {
  const extra = { id: Number(categoryId) }
  if (expectedLabId) extra.labId = Number(expectedLabId)
  const where = scopedCategoryWhere(user, extra)
  const category = await prisma.category.findFirst({ where })
  if (!category) throw forbidden()
  return category
}

const assertInventoryAccess = async (user, inventoryId) => {
  const inventory = await prisma.inventory.findFirst({
    where: scopedInventoryWhere(user, { id: Number(inventoryId) }),
    include: { lab: true, category: true }
  })
  if (!inventory) throw forbidden()
  return inventory
}

const assertBorrowingAccess = async (user, borrowingId) => {
  const borrowing = await prisma.borrowing.findFirst({
    where: scopedBorrowingWhere(user, { id: Number(borrowingId) }),
    include: { inventory: { include: { lab: true } }, user: true }
  })
  if (!borrowing) throw forbidden()
  return borrowing
}

const assertInventoryAccessWithClient = async (client, user, inventoryId) => {
  const inventory = await client.inventory.findFirst({
    where: scopedInventoryWhere(user, { id: Number(inventoryId) }),
    include: { lab: true, category: true }
  })
  if (!inventory) throw forbidden()
  return inventory
}

const assertBorrowingAccessWithClient = async (client, user, borrowingId) => {
  const borrowing = await client.borrowing.findFirst({
    where: scopedBorrowingWhere(user, { id: Number(borrowingId) }),
    include: { inventory: { include: { lab: true } }, user: true }
  })
  if (!borrowing) throw forbidden()
  return borrowing
}

module.exports = {
  PLATFORM_ROLES,
  INSTITUTION_ADMIN_ROLES,
  LAB_ADMIN_ROLES,
  isPlatformAdmin,
  isInstitutionAdmin,
  isLabAdmin,
  isStudent,
  canManageUsers,
  canManageLabs,
  canManageInventory,
  tenantIdOf,
  roleRequiresLab,
  roleIsInstitutionScoped,
  roleIsPlatformScoped,
  scopedLabWhere,
  scopedUserWhere,
  scopedInventoryWhere,
  scopedCategoryWhere,
  scopedBorrowingWhere,
  assertInstitutionAccess,
  assertLabAccess,
  assertActiveLabAccess,
  assertCategoryAccess,
  assertInventoryAccess,
  assertBorrowingAccess,
  assertInventoryAccessWithClient,
  assertBorrowingAccessWithClient,
  forbidden,
  badRequest,
  inactiveResource
}
