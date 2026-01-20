const express = require('express');
const systemConfigController = require('../../controllers/systemConfig.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();

// Ensure all config routes are protected and restricted to admin
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', systemConfigController.getConfig);
router.patch('/', systemConfigController.updateConfig);

module.exports = router;
