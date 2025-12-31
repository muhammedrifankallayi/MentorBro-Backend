const express = require('express');
const reviewerController = require('../../controllers/reviewer');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', reviewerController.register);
router.post('/login', reviewerController.login);

// Protected routes (authenticated users)
router.post('/logout', protect, reviewerController.logout);
router.get('/me', protect, reviewerController.getMe);

// Admin only routes
router.get('/', protect, restrictTo('admin'), reviewerController.getAllReviewers);
router.post('/', protect, restrictTo('admin'), reviewerController.addReviewerByAdmin);
router.get('/:id', protect, restrictTo('admin'), reviewerController.getReviewerById);
router.patch('/:id', protect, restrictTo('admin'), reviewerController.updateReviewer);
router.patch('/:id/status', protect, restrictTo('admin'), reviewerController.updateReviewerStatus);
router.delete('/:id', protect, restrictTo('admin'), reviewerController.deleteReviewer);
router.delete('/:id/permanent', protect, restrictTo('admin'), reviewerController.permanentlyDeleteReviewer);

module.exports = router;

