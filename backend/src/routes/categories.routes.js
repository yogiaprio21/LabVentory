const { Router } = require('express')
const { z } = require('zod')
const { validate } = require('../middleware/validate')
const { authenticate, requirePermission } = require('../middleware/auth')
const ctrl = require('../controllers/categories.controller')

const router = Router()
router.use(authenticate)

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    labId: z.number().int().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
})

const updateSchema = z.object({
  body: z.object({ name: z.string().min(1) }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({}).optional()
})

const idParam = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({}).optional()
})

router.post('/', requirePermission('category.create'), validate(createSchema), (req, res, next) => ctrl.createCategory(req, res).catch(next))
router.put('/:id', requirePermission('category.update'), validate(updateSchema), (req, res, next) => ctrl.updateCategory(req, res).catch(next))
router.delete('/:id', requirePermission('category.delete'), validate(idParam), (req, res, next) => ctrl.deleteCategory(req, res).catch(next))
router.get('/', requirePermission('category.view'), (req, res, next) => ctrl.listCategories(req, res).catch(next))

module.exports = router
