const { Router } = require('express')
const { validate } = require('../middleware/validate')
const { authenticate, requirePermission, requireAnyPermission, requireBodyPermission } = require('../middleware/auth')
const ctrl = require('../controllers/users.controller')
const schemas = require('../utils/schemas')

const router = Router()

// Protected routes for all authenticated users
router.use(authenticate)

router.put('/profile', requirePermission('profile.update'), (req, res, next) => ctrl.updateProfile(req, res).catch(next))
router.put('/change-password', requirePermission('profile.password'), validate(schemas.users.changePassword), (req, res, next) => ctrl.changePassword(req, res).catch(next))

// Tenant user management: platform admins are global, institution admins are scoped.
router.get('/', requirePermission('user.view'), (req, res, next) => ctrl.list(req, res).catch(next))
router.get('/:id', requirePermission('user.view'), validate(schemas.common.idParam), (req, res, next) => ctrl.getById(req, res).catch(next))
router.put(
  '/:id',
  requireAnyPermission(['user.update', 'platformUser.manage']),
  requireBodyPermission('status', 'user.deactivate'),
  validate(schemas.common.idParam),
  validate(schemas.users.update),
  (req, res, next) => ctrl.update(req, res).catch(next)
)
router.delete('/:id', requirePermission('user.deactivate'), validate(schemas.common.idParam), (req, res, next) => ctrl.remove(req, res).catch(next))

module.exports = router
