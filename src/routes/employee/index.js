const express = require('express');
const employeeRoutes = require('./employee.routes');
const attendanceRoutes = require('./attendance.routes');

const router = express.Router();

router.use('/', employeeRoutes);
router.use('/attendance', attendanceRoutes);

module.exports = router;
