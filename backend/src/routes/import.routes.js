const { Router } = require('express')
const multer = require('multer')
const { authenticate, authorize } = require('../middleware/auth')
const ctrl = require('../controllers/import.controller')
const path = require('path')

const router = Router()
const upload = multer({ dest: 'uploads/' })

router.post('/inventory', authenticate, authorize('admin', 'superadmin'), upload.single('file'), (req, res, next) => ctrl.importInventory(req, res).catch(next))

module.exports = router
