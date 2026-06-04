const { Router } = require('express')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/analytics.controller')

const router = Router()
router.use(authenticate)

router.get('/summary', requirePermission('platform.analytics.view'), (req, res, next) => ctrl.summary(req, res).catch(next))

module.exports = router
