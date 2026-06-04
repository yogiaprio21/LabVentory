const { Router } = require('express')
const { z } = require('zod')
const { validate } = require('../middleware/validate')
const { authenticate, authorize } = require('../middleware/auth')
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

router.get('/', (req, res, next) => ctrl.getLabs(req, res).catch(next))
router.post('/', authorize('superadmin', 'institution_admin'), validate(createSchema), (req, res, next) => ctrl.createLab(req, res).catch(next))
router.put('/:id', authorize('superadmin', 'institution_admin'), validate(updateSchema), (req, res, next) => ctrl.updateLab(req, res).catch(next))
router.delete('/:id', authorize('superadmin', 'institution_admin'), validate(idParam), (req, res, next) => ctrl.deleteLab(req, res).catch(next))

module.exports = router
