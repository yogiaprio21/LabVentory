const { Router } = require('express')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/access-control.controller')

const router = Router()

router.use(authenticate)
router.get('/me', requirePermission('profile.view'), (req, res, next) => ctrl.me(req, res).catch(next))
router.get('/matrix', requirePermission('accessControl.view'), (req, res, next) => ctrl.matrix(req, res).catch(next))

module.exports = router
