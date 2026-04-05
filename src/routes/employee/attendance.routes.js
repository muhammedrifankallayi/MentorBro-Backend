const express = require('express');
const attendanceController = require('../../controllers/employee/attendance.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All attendance routes require authentication
router.use(protect);

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/today', attendanceController.getToday);

module.exports = router;
