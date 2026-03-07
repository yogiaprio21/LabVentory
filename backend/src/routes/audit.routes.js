const { Router } = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const ctrl = require('../controllers/audit.controller')
const router = Router()
router.use(authenticate, authorize('admin', 'superadmin'))
router.get('/', (req, res, next) => ctrl.listLogs(req, res).catch(next))
module.exports = router
