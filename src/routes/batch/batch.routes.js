const express = require('express');
const batchController = require('../../controllers/batch');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', batchController.getAll);
router.get('/:id', batchController.getById);

// Admin only routes
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', batchController.create);
router.put('/:id', batchController.update);
router.delete('/:id', batchController.remove);
router.patch('/:id/status', batchController.updateStatus);

module.exports = router;
