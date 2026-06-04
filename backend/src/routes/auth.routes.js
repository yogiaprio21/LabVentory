const { Router } = require('express')
const { validate } = require('../middleware/validate')
const { authenticate, requireAnyPermission } = require('../middleware/auth')
const ctrl = require('../controllers/auth.controller')

const schemas = require('../utils/schemas')

const router = Router()

// Public: student self-registration
router.post('/register', validate(schemas.auth.registerStudent), (req, res, next) => ctrl.registerStudent(req, res).catch(next))

// Tenant admins can create users within their allowed scope.
router.post('/register/admin', authenticate, requireAnyPermission(['user.create', 'platformUser.create']), validate(schemas.auth.register), (req, res, next) => ctrl.register(req, res).catch(next))

router.post('/login', validate(schemas.auth.login), (req, res, next) => ctrl.login(req, res).catch(next))

module.exports = router
