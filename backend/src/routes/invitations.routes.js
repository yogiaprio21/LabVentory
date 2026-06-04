const { Router } = require('express')
const { validate } = require('../middleware/validate')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/invitations.controller')
const schemas = require('../utils/schemas')

const router = Router()

router.get('/resolve/:code', validate(schemas.invitations.codeParam), (req, res, next) => ctrl.resolve(req, res).catch(next))

router.use(authenticate)
router.get('/', requirePermission('invitation.view'), (req, res, next) => ctrl.list(req, res).catch(next))
router.post('/', requirePermission('invitation.create'), validate(schemas.invitations.create), (req, res, next) => ctrl.create(req, res).catch(next))
router.put('/:id', requirePermission('invitation.update'), validate(schemas.common.idParam), validate(schemas.invitations.update), (req, res, next) => ctrl.update(req, res).catch(next))

module.exports = router
