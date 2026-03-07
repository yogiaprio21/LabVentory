const { Router } = require('express')
const { validate } = require('../middleware/validate')
const { authenticate, authorize } = require('../middleware/auth')
const ctrl = require('../controllers/users.controller')
const schemas = require('../utils/schemas')

const router = Router()

// Protected routes for all authenticated users
router.use(authenticate)

router.put('/profile', (req, res, next) => ctrl.updateProfile(req, res).catch(next))
router.put('/change-password', validate(schemas.users.changePassword), (req, res, next) => ctrl.changePassword(req, res).catch(next))

// Restricted routes for superadmin only
const adminOnly = authorize('superadmin')

router.get('/', adminOnly, (req, res, next) => ctrl.list(req, res).catch(next))
router.get('/:id', adminOnly, validate(schemas.common.idParam), (req, res, next) => ctrl.getById(req, res).catch(next))
router.put('/:id', adminOnly, validate(schemas.common.idParam), validate(schemas.users.update), (req, res, next) => ctrl.update(req, res).catch(next))
router.delete('/:id', adminOnly, validate(schemas.common.idParam), (req, res, next) => ctrl.remove(req, res).catch(next))

module.exports = router
