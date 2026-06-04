const { Router } = require('express')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/export.controller')
const router = Router()
router.use(authenticate)
router.get('/borrowing', requirePermission('report.export'), (req, res, next) => ctrl.borrowingReport(req, res).catch(next))
router.get('/inventory', requirePermission('report.export'), (req, res, next) => ctrl.inventorySummary(req, res).catch(next))
module.exports = router
