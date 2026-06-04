const { Router } = require('express')
const { z } = require('zod')
const { validate } = require('../middleware/validate')
const { authenticate, requirePermission, requireBodyPermission } = require('../middleware/auth')
const ctrl = require('../controllers/labs.controller')

const router = Router()

const createSchema = z.object({
  body: z.object({ name: z.string().min(1), location: z.string().min(1), institutionId: z.number().int().optional() }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
})

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    institutionId: z.number().int().optional(),
    status: z.enum(['active', 'inactive']).optional()
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({}).optional()
})

const idParam = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({}).optional()
})

router.use(authenticate)

router.get('/', requirePermission('lab.view'), (req, res, next) => ctrl.getLabs(req, res).catch(next))
router.post('/', requirePermission('lab.create'), validate(createSchema), (req, res, next) => ctrl.createLab(req, res).catch(next))
router.put(
  '/:id',
  requirePermission('lab.update'),
  requireBodyPermission('institutionId', 'lab.transfer'),
  requireBodyPermission('status', 'lab.deactivate'),
  validate(updateSchema),
  (req, res, next) => ctrl.updateLab(req, res).catch(next)
)
router.delete('/:id', requirePermission('lab.deactivate'), validate(idParam), (req, res, next) => ctrl.deleteLab(req, res).catch(next))

module.exports = router
