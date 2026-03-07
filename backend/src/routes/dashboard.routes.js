const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const ctrl = require('../controllers/dashboard.controller')
const router = Router()
router.use(authenticate)
router.get('/summary', (req, res, next) => ctrl.summary(req, res).catch(next))
module.exports = router
