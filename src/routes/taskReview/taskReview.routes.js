const express = require('express');
const taskReviewController = require('../../controllers/taskReview');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

// Protected routes
router.get('/', taskReviewController.getAll);
router.get('/student/:studentId', taskReviewController.getByStudentId);
router.get('/reviewer/:reviewerId', taskReviewController.getByReviewerId);
router.get('/:id', taskReviewController.getById);
router.post('/', taskReviewController.create);
router.patch('/:id/cancel', taskReviewController.cancel);
router.patch('/:id/assign-reviewer', taskReviewController.assignReviewer);

// Admin only routes
router.put('/:id', taskReviewController.update);
router.delete('/:id', taskReviewController.remove);

module.exports = router;

