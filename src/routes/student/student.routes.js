const express = require('express');
const studentController = require('../../controllers/student');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', studentController.register);
router.post('/login', studentController.login);

// Protected routes
router.use(protect);
router.post('/logout', studentController.logout);
router.get('/me', studentController.getMe);
router.patch('/me', studentController.updateMe);

module.exports = router;


