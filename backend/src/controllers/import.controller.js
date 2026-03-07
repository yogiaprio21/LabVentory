const { prisma } = require('../prisma/client')
const csv = require('csv-parser')
const fs = require('fs')

const importInventory = async (req, res) => {
    if (!req.file) {
        const e = new Error('No file uploaded')
        e.status = 400
        throw e
    }

    const results = []
    const labId = Number(req.user.labId) || Number(req.body.labId)

    if (!labId && req.user.role !== 'superadmin') {
        const e = new Error('labId is required')
        e.status = 400
        throw e
    }

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                const imports = results.map(row => ({
                    name: row.name,
                    categoryId: Number(row.categoryId),
                    labId: labId || Number(row.labId),
                    totalStock: Number(row.totalStock),
                    availableStock: Number(row.availableStock),
                    minStock: Number(row.minStock) || 0,
                    location: row.location || '',
                    condition: row.condition || 'Good'
                }))

                await prisma.inventory.createMany({ data: imports })

                // Clean up file
                fs.unlinkSync(req.file.path)

                res.json({ message: `Successfully imported ${imports.length} items` })
            } catch (err) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
                res.status(500).json({ error: 'Failed to process CSV data', details: err.message })
            }
        })
}

module.exports = { importInventory }
