const { Router } = require('express')
const { z } = require('zod')
const { validate } = require('../middleware/validate')
const { authenticate, authorize } = require('../middleware/auth')
const ctrl = require('../controllers/labs.controller')

const router = Router()

const createSchema = z.object({
  body: z.object({ name: z.string().min(1), location: z.string().min(1) }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
})

const updateSchema = z.object({
  body: z.object({ name: z.string().min(1), location: z.string().min(1) }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({}).optional()
})

const idParam = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({}).optional()
})

// Public: list all labs (needed for student registration page)
router.get('/', (req, res, next) => ctrl.getLabs(req, res).catch(next))

// Protected: superadmin only for mutations
router.post('/', authenticate, authorize('superadmin'), validate(createSchema), (req, res, next) => ctrl.createLab(req, res).catch(next))
router.put('/:id', authenticate, authorize('superadmin'), validate(updateSchema), (req, res, next) => ctrl.updateLab(req, res).catch(next))
router.delete('/:id', authenticate, authorize('superadmin'), validate(idParam), (req, res, next) => ctrl.deleteLab(req, res).catch(next))

module.exports = router
