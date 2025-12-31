const studentService = require('../../services/student.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Register a new student
 * @route   POST /api/v1/student/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
    const student = await studentService.register(req.body);
    const { token, student: studentData } = studentService.createSendToken(student, 201, res);

    ApiResponse.created(res, { student: studentData, token }, 'Student registered successfully');
});

/**
 * @desc    Login student
 * @route   POST /api/v1/student/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const student = await studentService.login(email, password);
    const { token, student: studentData } = studentService.createSendToken(student, 200, res);

    ApiResponse.success(res, { student: studentData, token }, 'Logged in successfully');
});

/**
 * @desc    Logout student
 * @route   POST /api/v1/student/logout
 * @access  Private
 */
const logout = catchAsync(async (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * @desc    Get current student
 * @route   GET /api/v1/student/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res) => {
    const student = await studentService.getById(req.user._id);
    ApiResponse.success(res, student, 'Student retrieved successfully');
});

/**
 * @desc    Update current student profile
 * @route   PATCH /api/v1/student/me
 * @access  Private
 */
const updateMe = catchAsync(async (req, res) => {
    const student = await studentService.updateProfile(req.user._id, req.body);
    ApiResponse.success(res, student, 'Profile updated successfully');
});

module.exports = {
    register,
    login,
    logout,
    getMe,
    updateMe,
};

