const express = require('express');
const mailController = require('../../controllers/mail.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();

// All mail routes are protected and restricted to admin
router.use(protect);
router.use(restrictTo('admin'));

router.post('/send', mailController.sendCustomEmail);

module.exports = router;
