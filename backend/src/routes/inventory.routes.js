const { Router } = require('express')
const { validate } = require('../middleware/validate')
const { authenticate, authorize } = require('../middleware/auth')
const ctrl = require('../controllers/inventory.controller')
const schemas = require('../utils/schemas')

const router = Router()
router.use(authenticate)

router.post('/', authorize('admin', 'superadmin'), validate(schemas.inventory.upsert), (req, res, next) => ctrl.create(req, res).catch(next))
router.put('/:id', authorize('admin', 'superadmin'), validate(schemas.common.idParam), validate(schemas.inventory.upsert), (req, res, next) => ctrl.update(req, res).catch(next))
router.delete('/:id', authorize('admin', 'superadmin'), validate(schemas.common.idParam), (req, res, next) => ctrl.remove(req, res).catch(next))
router.get('/:id', validate(schemas.common.idParam), (req, res, next) => ctrl.get(req, res).catch(next))
router.get('/', (req, res, next) => ctrl.list(req, res).catch(next))

module.exports = router

module.exports = router
