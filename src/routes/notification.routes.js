const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

/**
 * Notification Routes
 * Base path: /api/v1/notification
 */

// Public route to check Firebase status
router.get('/status', notificationController.getStatus);

// Protected routes (require authentication)
router.use(protect);

// Register FCM token for push notifications
router.post('/register-token', notificationController.registerToken);

// Unregister FCM token (e.g., on logout)
router.post('/unregister-token', notificationController.unregisterToken);

// Subscribe to a notification topic
router.post('/subscribe', notificationController.subscribeToTopic);

// Unsubscribe from a notification topic
router.post('/unsubscribe', notificationController.unsubscribeFromTopic);

// Send a test notification (for testing purposes)
router.post('/send-test', notificationController.sendTestNotification);

module.exports = router;
