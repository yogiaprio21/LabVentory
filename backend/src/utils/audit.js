const { prisma } = require('../prisma/client')

const logAudit = async ({ userId, action, entity, entityId, details }) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, details }
    })
  } catch (e) { }
}

module.exports = { logAudit }
