const { prisma } = require('../prisma/client')
const bcrypt = require('bcryptjs')
const { logAudit } = require('../utils/audit')

const list = async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, labId: true, createdAt: true },
            orderBy: { id: 'asc' },
            skip,
            take: limit
        }),
        prisma.user.count()
    ])

    res.json({
        data: users,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    })
}

const getById = async (req, res) => {
    const id = Number(req.params.id)
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, role: true, labId: true, createdAt: true }
    })
    if (!user) {
        const e = new Error('User not found')
        e.status = 404
        throw e
    }
    res.json(user)
}

const update = async (req, res) => {
    const id = Number(req.params.id)
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
        const e = new Error('User not found')
        e.status = 404
        throw e
    }

    const { name, email, role, labId, password } = req.body

    // Check email uniqueness if changing email
    if (email && email.toLowerCase() !== existing.email) {
        const taken = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        if (taken) {
            const e = new Error('Email already in use')
            e.status = 409
            throw e
        }
    }

    const data = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email.toLowerCase()
    if (role !== undefined) data.role = role
    if (labId !== undefined) {
        if (role === 'superadmin') {
            data.labId = null;
        } else {
            data.labId = labId ? Number(labId) : null;
        }
    }
    if (password) data.password = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true, labId: true }
    })
    await logAudit({ userId: req.user.id, action: 'update', entity: 'user', entityId: id })
    res.json(user)
}

const remove = async (req, res) => {
    const id = Number(req.params.id)
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
        const e = new Error('User not found')
        e.status = 404
        throw e
    }
    if (id === req.user.id) {
        const e = new Error('Cannot delete your own account')
        e.status = 400
        throw e
    }
    await prisma.user.delete({ where: { id } })
    await logAudit({ userId: req.user.id, action: 'delete', entity: 'user', entityId: id })
    res.status(204).send()
}

const updateProfile = async (req, res) => {
    const { name } = req.body
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name }
    })
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role })
}

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) {
        const e = new Error('Current password incorrect')
        e.status = 401
        throw e
    }

    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hash }
    })

    await logAudit({ userId: user.id, action: 'update', entity: 'user_password', entityId: user.id })
    res.json({ success: true })
}

module.exports = { list, getById, update, remove, updateProfile, changePassword }
