const { Router } = require('express')
const multer = require('multer')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/import.controller')

const router = Router()
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) return cb(null, true)
        const e = new Error('Only CSV files are allowed')
        e.status = 400
        return cb(e)
    }
})

router.post('/inventory', authenticate, requirePermission('inventory.import'), upload.single('file'), (req, res, next) => ctrl.importInventory(req, res).catch(next))

module.exports = router
