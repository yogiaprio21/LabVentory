const { Router } = require('express')
const { z } = require('zod')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const ctrl = require('../controllers/institutions.controller')
const schemas = require('../utils/schemas')

const router = Router()

const upsertSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  status: z.enum(['active', 'inactive']).optional()
})

router.use(authenticate, authorize('superadmin'))
router.get('/', (req, res, next) => ctrl.list(req, res).catch(next))
router.post('/', validate(upsertSchema.extend({ name: z.string().min(2) })), (req, res, next) => ctrl.create(req, res).catch(next))
router.put('/:id', validate(schemas.common.idParam), validate(upsertSchema), (req, res, next) => ctrl.update(req, res).catch(next))

module.exports = router
