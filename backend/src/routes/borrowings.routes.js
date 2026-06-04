const { Router } = require('express')
const { validate } = require('../middleware/validate')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/borrowings.controller')
const schemas = require('../utils/schemas')

const router = Router()
router.use(authenticate)

router.post('/', requirePermission('borrowing.create'), validate(schemas.borrowings.create), (req, res, next) => ctrl.create(req, res).catch(next))
router.post('/:id/approve', requirePermission('borrowing.approve'), validate(schemas.common.idParam), (req, res, next) => ctrl.approve(req, res).catch(next))
router.post('/:id/reject', requirePermission('borrowing.reject'), validate(schemas.common.idParam), (req, res, next) => ctrl.reject(req, res).catch(next))
router.post('/:id/return', requirePermission('borrowing.return'), validate(schemas.common.idParam), (req, res, next) => ctrl.returnItem(req, res).catch(next))
router.post('/:id/damaged', requirePermission('borrowing.markDamaged'), validate(schemas.common.idParam), (req, res, next) => ctrl.markDamaged(req, res).catch(next))
router.post('/:id/lost', requirePermission('borrowing.markLost'), validate(schemas.common.idParam), (req, res, next) => ctrl.markLost(req, res).catch(next))
router.get('/', requirePermission('borrowing.view'), (req, res, next) => ctrl.list(req, res).catch(next))

module.exports = router
