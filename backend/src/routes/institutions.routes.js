const { Router } = require('express')
const { authenticate, requirePermission } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const ctrl = require('../controllers/institutions.controller')
const schemas = require('../utils/schemas')

const router = Router()

router.use(authenticate)
router.get('/', requirePermission('institution.view'), (req, res, next) => ctrl.list(req, res).catch(next))
router.post('/', requirePermission('institution.create'), validate(schemas.institutions.create), (req, res, next) => ctrl.create(req, res).catch(next))
router.put('/:id', requirePermission('institution.update'), validate(schemas.common.idParam), validate(schemas.institutions.upsert), (req, res, next) => ctrl.update(req, res).catch(next))

module.exports = router
