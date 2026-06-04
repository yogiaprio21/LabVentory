const { prisma } = require('../prisma/client')
const bcrypt = require('bcryptjs')
const { logAudit } = require('../utils/audit')
const {
    assertLabAccess,
    assertActiveLabAccess,
    badRequest,
    forbidden,
    isPlatformAdmin,
    scopedUserWhere,
    tenantIdOf
} = require('../utils/tenancy')

const PLATFORM_USER_ROLES = ['platform_admin', 'superadmin']
const LAB_USER_ROLES = ['student', 'admin', 'lab_admin']

const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    institutionId: true,
    institution: { select: { id: true, name: true, slug: true, status: true } },
    labId: true,
    lab: { select: { id: true, name: true, location: true, institutionId: true } },
    createdAt: true
}

const findScopedUser = async (req, id) => {
    const user = await prisma.user.findFirst({
        where: scopedUserWhere(req.user, { id: Number(id) }),
        select: publicUserSelect
    })
    if (!user) {
        const e = new Error('User not found')
        e.status = 404
        throw e
    }
    return user
}

const list = async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search ? String(req.query.search).trim() : ''
    const where = scopedUserWhere(req.user, search
        ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }
        : {}
    )

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: publicUserSelect,
            orderBy: { id: 'asc' },
            skip,
            take: limit
        }),
        prisma.user.count({ where })
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
    const user = await findScopedUser(req, id)
    res.json(user)
}

const update = async (req, res) => {
    const id = Number(req.params.id)
    const existing = await findScopedUser(req, id)

    const { name, email, role, institutionId, labId, password, status } = req.body
    const nextRole = role || existing.role
    const actorIsPlatform = isPlatformAdmin(req.user)
    const actorTenantId = tenantIdOf(req.user)

    if (!actorIsPlatform && PLATFORM_USER_ROLES.includes(nextRole)) {
        throw forbidden()
    }

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

    let targetInstitutionId = actorIsPlatform
        ? (institutionId !== undefined ? (institutionId ? Number(institutionId) : null) : existing.institutionId)
        : actorTenantId

    if (PLATFORM_USER_ROLES.includes(nextRole)) {
        if (!actorIsPlatform) throw forbidden()
        targetInstitutionId = null
        data.institutionId = null
        data.labId = null
    } else {
        if (LAB_USER_ROLES.includes(nextRole)) {
            const selectedLabId = labId !== undefined ? Number(labId) : existing.labId
            const lab = await assertActiveLabAccess(req.user, selectedLabId)
            targetInstitutionId = targetInstitutionId || lab.institutionId
            if (lab.institutionId !== targetInstitutionId) throw forbidden()
            data.labId = lab.id
        } else {
            data.labId = null
        }

        if (!targetInstitutionId) {
            const e = new Error('institutionId is required')
            e.status = 400
            throw e
        }
        data.institutionId = targetInstitutionId
    }

    if (password) data.password = await bcrypt.hash(password, 10)
    if (status !== undefined) {
        if (id === req.user.id && status !== 'active') throw badRequest('Cannot deactivate your own account')
        if (status === 'inactive') {
            const activeBorrowings = await prisma.borrowing.count({
                where: { userId: id, status: { in: ['pending', 'approved', 'late'] } }
            })
            if (activeBorrowings > 0) throw badRequest('Resolve active borrowings before deactivating this user')
        }
        data.status = status
    }

    const user = await prisma.user.update({
        where: { id },
        data,
        select: publicUserSelect
    })
    await logAudit({ userId: req.user.id, institutionId: tenantIdOf(req.user), action: 'update', entity: 'user', entityId: id })
    res.json(user)
}

const remove = async (req, res) => {
    const id = Number(req.params.id)
    const existing = await findScopedUser(req, id)
    if (id === req.user.id) {
        const e = new Error('Cannot delete your own account')
        e.status = 400
        throw e
    }
    if (!isPlatformAdmin(req.user) && PLATFORM_USER_ROLES.includes(existing.role)) {
        throw forbidden()
    }
    const activeBorrowings = await prisma.borrowing.count({
        where: { userId: id, status: { in: ['pending', 'approved', 'late'] } }
    })
    if (activeBorrowings > 0) throw badRequest('Resolve active borrowings before deactivating this user')
    await prisma.user.update({ where: { id }, data: { status: 'inactive' } })
    await logAudit({ userId: req.user.id, institutionId: tenantIdOf(req.user), action: 'deactivate', entity: 'user', entityId: id })
    res.status(204).send()
}

const updateProfile = async (req, res) => {
    const { name } = req.body
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name },
        include: { institution: true, lab: { include: { institution: true } } }
    })
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: tenantIdOf(user),
        institution: user.institution || user.lab?.institution || null,
        labId: user.labId,
        lab: user.lab
    })
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

    await logAudit({ userId: user.id, institutionId: tenantIdOf(req.user), action: 'update', entity: 'user_password', entityId: user.id })
    res.json({ success: true })
}

module.exports = { list, getById, update, remove, updateProfile, changePassword }
