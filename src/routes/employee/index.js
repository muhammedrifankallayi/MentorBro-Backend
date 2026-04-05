const express = require('express');
const employeeRoutes = require('./employee.routes');
const attendanceRoutes = require('./attendance.routes');
const employeeTaskRoutes = require('./employeeTask.routes');

const router = express.Router();

router.use('/', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/tasks', employeeTaskRoutes);

module.exports = router;
