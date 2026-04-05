const attendanceService = require('../../services/attendance.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Check in for today
 * @route   POST /api/v1/employee/attendance/check-in
 * @access  Private (employee)
 */
const checkIn = catchAsync(async (req, res) => {
    const record = await attendanceService.checkIn(req.user._id);
    ApiResponse.success(res, record, 'Checked in successfully');
});

/**
 * @desc    Check out for today
 * @route   POST /api/v1/employee/attendance/check-out
 * @access  Private (employee)
 */
const checkOut = catchAsync(async (req, res) => {
    const record = await attendanceService.checkOut(req.user._id);
    ApiResponse.success(res, record, 'Checked out successfully');
});

/**
 * @desc    Get today's attendance record
 * @route   GET /api/v1/employee/attendance/today
 * @access  Private (employee)
 */
const getToday = catchAsync(async (req, res) => {
    const record = await attendanceService.getToday(req.user._id);
    ApiResponse.success(res, record, 'Today\'s attendance retrieved');
});

module.exports = { checkIn, checkOut, getToday };
