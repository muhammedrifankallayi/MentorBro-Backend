const express = require('express');
const { getPublicConfig, updatePublicConfig } = require('../controllers/publicConfig.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/v1/public-config
 * @desc    Get public configuration (e.g., WhatsApp group link)
 * @access  Public
 */
router.get('/', getPublicConfig);

/**
 * @route   PUT /api/v1/public-config
 * @desc    Update public configuration
 * @access  Private (Admin, Super Admin)
 */
router.put('/', protect, restrictTo('admin', 'super_admin'), updatePublicConfig);

module.exports = router;
