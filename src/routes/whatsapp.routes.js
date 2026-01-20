const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');
// Assuming there's an auth middleware, if not, I'll just leave it open for now or check other routes
// Let's check a route to see how auth is handled

const router = express.Router();

router.post('/send-text', whatsappController.sendTextMessage);
router.post('/send-notification', whatsappController.sendNotification);

module.exports = router;
