const { prisma } = require('../prisma/client')

const list = async (req, res) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    })
    res.json(notifications)
}

const markAsRead = async (req, res) => {
    const { id } = req.params
    await prisma.notification.updateMany({
        where: { id: Number(id), userId: req.user.id },
        data: { isRead: true }
    })
    res.json({ success: true })
}

const markAllAsRead = async (req, res) => {
    await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true }
    })
    res.json({ success: true })
}

module.exports = { list, markAsRead, markAllAsRead }
