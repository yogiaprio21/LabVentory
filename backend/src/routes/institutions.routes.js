const { Router } = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const ctrl = require('../controllers/institutions.controller')
const schemas = require('../utils/schemas')

const router = Router()

router.use(authenticate, authorize('superadmin'))
router.get('/', (req, res, next) => ctrl.list(req, res).catch(next))
router.post('/', validate(schemas.institutions.create), (req, res, next) => ctrl.create(req, res).catch(next))
router.put('/:id', validate(schemas.common.idParam), validate(schemas.institutions.upsert), (req, res, next) => ctrl.update(req, res).catch(next))

module.exports = router
