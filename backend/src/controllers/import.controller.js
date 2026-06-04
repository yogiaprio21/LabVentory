const { prisma } = require('../prisma/client')
const csv = require('csv-parser')
const fs = require('fs')
const { assertLabAccess, isPlatformAdmin, isInstitutionAdmin } = require('../utils/tenancy')

const readCsv = (path) => new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('error', reject)
        .on('end', () => resolve(results))
})

const cleanup = (path) => {
    if (path && fs.existsSync(path)) fs.unlinkSync(path)
}

const importInventory = async (req, res) => {
    if (!req.file) {
        const e = new Error('No file uploaded')
        e.status = 400
        throw e
    }

    const requestedLabId = Number(req.body.labId) || null
    const defaultLabId = (isPlatformAdmin(req.user) || isInstitutionAdmin(req.user))
        ? requestedLabId
        : Number(req.user.labId)

    if (!defaultLabId && !isPlatformAdmin(req.user)) {
        const e = new Error('labId is required')
        e.status = 400
        throw e
    }

    try {
        const rows = await readCsv(req.file.path)
        const imports = []
        const labCache = new Map()

        for (const row of rows) {
            const currentLabId = defaultLabId || Number(row.labId)
            if (!currentLabId) continue
            if (!labCache.has(currentLabId)) {
                labCache.set(currentLabId, await assertLabAccess(req.user, currentLabId))
            }

            const totalStock = Number(row.totalStock)
            const availableStock = Number(row.availableStock)
            const minStock = Number(row.minStock) || 0
            if (!row.name || !Number.isInteger(totalStock) || totalStock < 0 || !Number.isInteger(availableStock) || availableStock < 0 || availableStock > totalStock) {
                const e = new Error(`Invalid CSV row for item "${row.name || '(missing name)'}"`)
                e.status = 400
                throw e
            }

            const categoryName = row.category || 'Uncategorized'
            let category = await prisma.category.findFirst({
                where: {
                    name: { equals: categoryName, mode: 'insensitive' },
                    labId: currentLabId
                }
            })

            if (!category) {
                category = await prisma.category.create({
                    data: {
                        name: categoryName,
                        labId: currentLabId
                    }
                })
            }

            imports.push({
                name: row.name,
                categoryId: category.id,
                labId: currentLabId,
                totalStock,
                availableStock,
                minStock,
                location: row.location || '',
                condition: row.condition || 'Good'
            })
        }

        if (imports.length > 0) {
            await prisma.inventory.createMany({ data: imports })
        }

        res.json({ message: `Successfully imported ${imports.length} items` })
    } finally {
        cleanup(req.file.path)
    }
}

module.exports = { importInventory }
