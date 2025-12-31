const express = require('express');
const adminController = require('../../controllers/admin');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);

// Protected routes - Admin only
router.use(protect);
router.use(restrictTo('admin'));

router.post('/logout', adminController.logout);
router.get('/me', adminController.getMe);
router.patch('/update-password', adminController.updatePassword);

// Student management routes
router.get('/students/status/:status', adminController.getStudentsByApprovalStatus);
router.patch('/students/:id/approval', adminController.updateStudentApproval);

module.exports = router;


