const { Router } = require('express')
const { list, markAsRead, markAllAsRead } = require('../controllers/notifications.controller')
const { authenticate } = require('../middleware/auth')

const router = Router()

router.use(authenticate)
router.get('/', list)
router.put('/mark-all', markAllAsRead)
router.put('/:id/read', markAsRead)

module.exports = router
