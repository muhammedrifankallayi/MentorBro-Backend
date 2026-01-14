const express = require('express');
const taskReviewController = require('../../controllers/taskReview');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

// Protected routes
router.get('/admin/stats', restrictTo('admin'), taskReviewController.getAdminStats);
router.get('/', taskReviewController.getAll);
router.get('/student/:studentId', taskReviewController.getByStudentId);
router.get('/reviewer/:reviewerId/earnings', taskReviewController.getReviewerEarnings);
router.get('/reviewer/:reviewerId', taskReviewController.getByReviewerId);
router.get('/next-week/:studentId', taskReviewController.getNextWeekForStudent);
router.get('/last-review/:studentId', taskReviewController.getLastReviewForStudent);
router.get('/:id', taskReviewController.getById);
router.post('/', taskReviewController.create);
router.patch('/bulk-update', taskReviewController.bulkUpdate);
router.patch('/:id/cancel', taskReviewController.cancel);
router.patch('/:id/assign-reviewer', taskReviewController.assignReviewer);
router.patch('/:id/unassign-reviewer', taskReviewController.unassignReviewer);

// Admin only routes
router.put('/:id', taskReviewController.update);
router.delete('/:id', taskReviewController.remove);

module.exports = router;

