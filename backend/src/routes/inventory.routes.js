const { Router } = require('express')
const { validate } = require('../middleware/validate')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/inventory.controller')
const schemas = require('../utils/schemas')

const router = Router()
router.use(authenticate)

router.post('/resolve-qr', requirePermission('inventory.view'), validate(schemas.inventory.resolveQr), (req, res, next) => ctrl.resolveQr(req, res).catch(next))
router.post('/', requirePermission('inventory.create'), validate(schemas.inventory.upsert), (req, res, next) => ctrl.create(req, res).catch(next))
router.put('/:id', requirePermission('inventory.update'), validate(schemas.common.idParam), validate(schemas.inventory.upsert), (req, res, next) => ctrl.update(req, res).catch(next))
router.delete('/:id', requirePermission('inventory.delete'), validate(schemas.common.idParam), (req, res, next) => ctrl.remove(req, res).catch(next))
router.get('/:id', requirePermission('inventory.view'), validate(schemas.common.idParam), (req, res, next) => ctrl.get(req, res).catch(next))
router.get('/', requirePermission('inventory.view'), (req, res, next) => ctrl.list(req, res).catch(next))

module.exports = router
