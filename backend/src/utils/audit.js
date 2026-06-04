const { prisma } = require('../prisma/client')

const logAudit = async ({ userId, institutionId, action, entity, entityId, details }) => {
  try {
    let resolvedInstitutionId = institutionId || null
    if (!resolvedInstitutionId && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { institutionId: true, lab: { select: { institutionId: true } } }
      })
      resolvedInstitutionId = user?.institutionId || user?.lab?.institutionId || null
    }
    await prisma.auditLog.create({
      data: { userId, institutionId: resolvedInstitutionId, action, entity, entityId, details }
    })
  } catch (e) { }
}

module.exports = { logAudit }
