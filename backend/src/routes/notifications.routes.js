const { Router } = require('express')
const { list, markAsRead, markAllAsRead } = require('../controllers/notifications.controller')
const { authenticate, requirePermission } = require('../middleware/auth')

const router = Router()

router.use(authenticate)
router.get('/', requirePermission('notification.view'), list)
router.put('/mark-all', requirePermission('notification.update'), markAllAsRead)
router.put('/:id/read', requirePermission('notification.update'), markAsRead)

module.exports = router
