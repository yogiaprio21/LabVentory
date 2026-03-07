const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const ctrl = require('../controllers/export.controller')
const router = Router()
router.use(authenticate)
router.get('/borrowing', (req, res, next) => ctrl.borrowingReport(req, res).catch(next))
router.get('/inventory', (req, res, next) => ctrl.inventorySummary(req, res).catch(next))
module.exports = router
