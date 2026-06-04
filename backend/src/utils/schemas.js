const { z } = require('zod')

const roleEnum = z.enum(['platform_admin', 'institution_admin', 'lab_admin', 'admin', 'student', 'superadmin'])
const inviteRoleEnum = z.enum(['institution_admin', 'lab_admin', 'admin', 'student'])
const inviteStatusEnum = z.enum(['active', 'revoked', 'used', 'expired'])
const tenantStatusEnum = z.enum(['active', 'inactive'])

const auth = {
    login: z.object({
        body: z.object({
            email: z.string().email(),
            password: z.string().min(6)
        })
    }),
    register: z.object({
        body: z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(6),
            role: roleEnum.optional(),
            institutionId: z.number().optional(),
            labId: z.number().optional()
        })
    }),
    registerStudent: z.object({
        body: z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(6),
            inviteCode: z.string().min(6).optional(),
            institutionSlug: z.string().min(1).optional(),
            labId: z.number().optional()
        })
    })
}

const institutions = {
    upsert: z.object({
        body: z.object({
            name: z.string().min(2).optional(),
            slug: z.string().min(2).optional(),
            status: z.enum(['active', 'inactive', 'archived']).optional(),
            domain: z.string().min(3).nullable().optional(),
            registrationMode: z.enum(['invite', 'public']).optional()
        })
    }),
    create: z.object({
        body: z.object({
            name: z.string().min(2),
            slug: z.string().min(2).optional(),
            status: z.enum(['active', 'inactive', 'archived']).optional(),
            domain: z.string().min(3).nullable().optional(),
            registrationMode: z.enum(['invite', 'public']).optional(),
            admin: z.object({
                name: z.string().min(2),
                email: z.string().email(),
                password: z.string().min(6)
            }).optional()
        })
    })
}

const invitations = {
    create: z.object({
        body: z.object({
            institutionId: z.number().optional(),
            labId: z.number().nullable().optional(),
            role: inviteRoleEnum.default('student'),
            inviteeEmail: z.string().email().optional(),
            maxUses: z.number().int().min(1).max(500).optional(),
            expiresAt: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date format' }).optional()
        })
    }),
    update: z.object({
        body: z.object({
            status: inviteStatusEnum.optional(),
            expiresAt: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date format' }).optional()
        })
    }),
    codeParam: z.object({
        params: z.object({
            code: z.string().min(6)
        })
    })
}

const users = {
    update: z.object({
        body: z.object({
            name: z.string().min(2).optional(),
            email: z.string().email().optional(),
            role: roleEnum.optional(),
            status: tenantStatusEnum.optional(),
            institutionId: z.number().nullable().optional(),
            labId: z.number().nullable().optional(),
            password: z.string().min(6).optional()
        })
    }),
    changePassword: z.object({
        body: z.object({
            currentPassword: z.string(),
            newPassword: z.string().min(6)
        })
    })
}

const inventory = {
    upsert: z.object({
        body: z.object({
            name: z.string().min(2),
            categoryId: z.number(),
            institutionId: z.number().optional(),
            labId: z.number().optional(),
            totalStock: z.number().min(0),
            availableStock: z.number().min(0),
            minStock: z.number().min(0).optional(),
            location: z.string().optional(),
            condition: z.string().optional()
        })
    }),
    resolveQr: z.object({
        body: z.object({
            code: z.string().min(1)
        })
    })
}

const borrowings = {
    create: z.object({
        body: z.object({
            inventoryId: z.number(),
            quantity: z.number().min(1),
            dueDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        })
    })
}

const common = {
    idParam: z.object({
        params: z.object({
            id: z.string().regex(/^\d+$/).transform(Number)
        })
    })
}

module.exports = { auth, institutions, invitations, users, inventory, borrowings, common }
