const express = require('express');
const programController = require('../../controllers/program');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', programController.getAll);
router.get('/:id', programController.getById);

// Admin only routes
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', programController.create);
router.put('/:id', programController.update);
router.delete('/:id', programController.remove);

module.exports = router;
