const { Router } = require('express')
const { validate } = require('../middleware/validate')
const { authenticate, authorize } = require('../middleware/auth')
const ctrl = require('../controllers/borrowings.controller')
const schemas = require('../utils/schemas')

const router = Router()
router.use(authenticate)

router.post('/', authorize('student', 'admin', 'superadmin'), validate(schemas.borrowings.create), (req, res, next) => ctrl.create(req, res).catch(next))
router.post('/:id/approve', authorize('admin', 'superadmin'), validate(schemas.common.idParam), (req, res, next) => ctrl.approve(req, res).catch(next))
router.post('/:id/reject', authorize('admin', 'superadmin'), validate(schemas.common.idParam), (req, res, next) => ctrl.reject(req, res).catch(next))
router.post('/:id/return', authorize('admin', 'superadmin'), validate(schemas.common.idParam), (req, res, next) => ctrl.returnItem(req, res).catch(next))
router.post('/:id/damaged', authorize('admin', 'superadmin'), validate(schemas.common.idParam), (req, res, next) => ctrl.markDamaged(req, res).catch(next))
router.post('/:id/lost', authorize('admin', 'superadmin'), validate(schemas.common.idParam), (req, res, next) => ctrl.markLost(req, res).catch(next))
router.get('/', (req, res, next) => ctrl.list(req, res).catch(next))

module.exports = router

module.exports = router
