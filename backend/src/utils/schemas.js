const { z } = require('zod')

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
            role: z.enum(['admin', 'student', 'superadmin']).optional(),
            labId: z.number().optional()
        })
    }),
    registerStudent: z.object({
        body: z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(6),
            labId: z.number()
        })
    })
}

const users = {
    update: z.object({
        body: z.object({
            name: z.string().min(2).optional(),
            email: z.string().email().optional(),
            role: z.enum(['admin', 'student', 'superadmin']).optional(),
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
            labId: z.number(),
            totalStock: z.number().min(0),
            availableStock: z.number().min(0),
            minStock: z.number().min(0).optional(),
            location: z.string().optional(),
            condition: z.string().optional()
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

module.exports = { auth, users, inventory, borrowings, common }
