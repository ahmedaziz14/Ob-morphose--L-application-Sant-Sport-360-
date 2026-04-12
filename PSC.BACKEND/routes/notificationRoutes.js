const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

// 1. Lire toutes mes notifications (Les plus récentes en premier)
router.get('/', protect, notificationController.getMyNotifications);

// 2. Marquer TOUTES les notifications comme lues
 
router.put('/read-all', protect, notificationController.markAllAsRead);

// 3. Marquer UNE notification spécifique comme lue
router.put('/:id/read', protect, notificationController.markAsRead);

module.exports = router;