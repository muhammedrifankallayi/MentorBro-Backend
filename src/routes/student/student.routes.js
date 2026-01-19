const express = require('express');
const studentController = require('../../controllers/student');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', studentController.register);
router.post('/login', studentController.login);
router.post('/forgot-password', studentController.forgotPassword);
router.patch('/reset-password/:token', studentController.resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', studentController.logout);
router.get('/me', studentController.getMe);
router.patch('/me', studentController.updateMe);
router.patch('/update-my-password', studentController.updateMyPassword);

module.exports = router;


