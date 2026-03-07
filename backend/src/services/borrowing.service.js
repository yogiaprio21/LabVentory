const { prisma } = require('../prisma/client')
const dayjs = require('dayjs')
const { borrowingLate, dueReminder, borrowingApproved, borrowingRejected, criticalStockAlert } = require('../utils/emailTemplates')
const { sendMail } = require('../config/mailer')

const requestBorrow = async ({ userId, inventoryId, quantity, dueDate }) => {
  const item = await prisma.inventory.findUnique({ where: { id: inventoryId }, include: { lab: true } })
  if (!item) {
    const e = new Error('Inventory not found')
    e.status = 404
    throw e
  }
  if (quantity <= 0) {
    const e = new Error('Invalid quantity')
    e.status = 400
    throw e
  }
  const borrow = await prisma.borrowing.create({
    data: { userId, inventoryId, quantity, dueDate: new Date(dueDate), status: 'pending' },
    include: { user: true }
  })

  // Notify Admins of this lab and all Superadmins
  const admins = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'admin', labId: item.labId },
        { role: 'superadmin' }
      ]
    }
  })

  await prisma.notification.createMany({
    data: admins.map(admin => ({
      userId: admin.id,
      title: 'New Borrowing Request',
      message: `${borrow.user.name} requested ${quantity}x ${item.name}`
    }))
  })

  return borrow
}

const approveBorrow = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const b = await tx.borrowing.findUnique({ where: { id }, include: { inventory: true, user: true } })
    if (!b) {
      const e = new Error('Not Found')
      e.status = 404
      throw e
    }
    if (b.status !== 'pending') {
      const e = new Error('Invalid status')
      e.status = 400
      throw e
    }
    if (b.quantity > b.inventory.availableStock) {
      const e = new Error('Insufficient stock')
      e.status = 400
      throw e
    }

    // Check for critical stock
    const newStock = b.inventory.availableStock - b.quantity
    if (newStock <= b.inventory.minStock) {
      const admins = await tx.user.findMany({
        where: { OR: [{ role: 'admin', labId: b.inventory.labId }, { role: 'superadmin' }] }
      })
      await tx.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: 'Critical Stock Alert',
          message: `Stock for ${b.inventory.name} is low (${newStock} units left).`
        }))
      })

      // Send email alerts for stock
      for (const admin of admins) {
        const t = criticalStockAlert(admin, b.inventory, newStock)
        await sendMail({ to: admin.email, subject: t.subject, html: t.html }).catch(() => { })
      }
    }

    await tx.inventory.update({
      where: { id: b.inventoryId },
      data: { availableStock: newStock }
    })

    const updated = await tx.borrowing.update({ where: { id }, data: { status: 'approved', borrowDate: new Date() } })

    // Notify Student
    await tx.notification.create({
      data: {
        userId: b.userId,
        title: 'Borrowing Approved',
        message: `Your request for ${b.inventory.name} has been approved.`
      }
    })

    // Email Student
    const t = borrowingApproved(b.user, b.inventory)
    await sendMail({ to: b.user.email, subject: t.subject, html: t.html }).catch(() => { })

    return updated
  })
}

const rejectBorrow = async (id) => {
  const b = await prisma.borrowing.update({
    where: { id },
    data: { status: 'rejected' },
    include: { inventory: true, user: true }
  })

  // Notify Student
  await prisma.notification.create({
    data: {
      userId: b.userId,
      title: 'Borrowing Rejected',
      message: `Your request for ${b.inventory.name} was rejected.`
    }
  })

  // Email Student
  const t = borrowingRejected(b.user, b.inventory)
  await sendMail({ to: b.user.email, subject: t.subject, html: t.html }).catch(() => { })

  return b
}

const returnBorrow = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const b = await tx.borrowing.findUnique({ where: { id }, include: { inventory: true } })
    if (!b) {
      const e = new Error('Not Found')
      e.status = 404
      throw e
    }
    if (!['approved', 'late'].includes(b.status)) {
      const e = new Error('Invalid status')
      e.status = 400
      throw e
    }
    await tx.inventory.update({
      where: { id: b.inventoryId },
      data: { availableStock: b.inventory.availableStock + b.quantity }
    })
    const updated = await tx.borrowing.update({ where: { id }, data: { status: 'returned', returnDate: new Date() } })
    return updated
  })
}

const markLateAndDueReminders = async (sendMailFn) => {
  const mailer = sendMailFn || sendMail
  const now = dayjs()
  const lates = await prisma.borrowing.findMany({
    where: { status: 'approved', dueDate: { lt: now.toDate() } },
    include: { user: true, inventory: true }
  })
  for (const b of lates) {
    // Check if we already alerted about this late borrowing today to avoid spamming
    const today = now.startOf('day').toDate()
    const alreadyNotified = await prisma.notification.findFirst({
      where: { userId: b.userId, title: 'Borrowing Overdue', createdAt: { gte: today } }
    })

    if (!alreadyNotified) {
      await prisma.borrowing.update({ where: { id: b.id }, data: { status: 'late' } })

      await prisma.notification.create({
        data: {
          userId: b.userId,
          title: 'Borrowing Overdue',
          message: `Your borrowing of ${b.inventory.name} is now late! Please return it immediately.`
        }
      })

      const t = borrowingLate(b.user, b.inventory)
      await mailer({ to: b.user.email, subject: t.subject, html: t.html }).catch(() => { })
    }
  }
  const tomorrow = now.add(1, 'day').startOf('day')
  const dueSoon = await prisma.borrowing.findMany({
    where: {
      status: 'approved',
      dueDate: { gte: tomorrow.toDate(), lt: tomorrow.add(1, 'day').toDate() }
    },
    include: { user: true, inventory: true }
  })
  for (const b of dueSoon) {
    const today = now.startOf('day').toDate()
    const alreadyReminded = await prisma.notification.findFirst({
      where: { userId: b.userId, title: 'Upcoming Due Date', createdAt: { gte: today } }
    })

    if (!alreadyReminded) {
      await prisma.notification.create({
        data: {
          userId: b.userId,
          title: 'Upcoming Due Date',
          message: `Your borrowing of ${b.inventory.name} is due tomorrow (${dayjs(b.dueDate).format('DD MMM YYYY')}).`
        }
      })
      const t = dueReminder(b.user, b.inventory)
      await mailer({ to: b.user.email, subject: t.subject, html: t.html }).catch(() => { })
    }
  }
}

const markDamaged = async (id) => {
  const b = await prisma.borrowing.update({
    where: { id },
    data: { status: 'damaged' },
    include: { user: true, inventory: true }
  })

  await prisma.notification.create({
    data: {
      userId: b.userId,
      title: 'Item Marked Damaged',
      message: `The item "${b.inventory.name}" you borrowed has been marked as damaged by the admin.`
    }
  })

  return b
}

const markLost = async (id) => {
  const b = await prisma.borrowing.update({
    where: { id },
    data: { status: 'lost' },
    include: { user: true, inventory: true }
  })

  await prisma.notification.create({
    data: {
      userId: b.userId,
      title: 'Item Marked Lost',
      message: `The item "${b.inventory.name}" you borrowed has been marked as lost by the admin.`
    }
  })

  return b
}

module.exports = { requestBorrow, approveBorrow, rejectBorrow, returnBorrow, markLateAndDueReminders, markDamaged, markLost }
