const express = require('express');
const programTaskController = require('../../controllers/programTask');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', programTaskController.getAll);
router.get('/next-week/:programId', programTaskController.getNextWeek);
router.get('/program/:programId', programTaskController.getByProgramId);
router.get('/:id', programTaskController.getById);

// Admin only routes
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', programTaskController.create);
router.put('/:id', programTaskController.update);
router.delete('/:id', programTaskController.remove);

module.exports = router;

