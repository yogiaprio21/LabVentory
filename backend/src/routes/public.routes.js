const { Router } = require('express')
const ctrl = require('../controllers/public.controller')

const router = Router()

router.get('/institutions/:slug/labs', (req, res, next) => ctrl.listInstitutionLabs(req, res).catch(next))

module.exports = router
