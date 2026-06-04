const { Router } = require('express')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/audit.controller')
const router = Router()
router.use(authenticate, requirePermission('audit.view'))
router.get('/', (req, res, next) => ctrl.listLogs(req, res).catch(next))
module.exports = router
