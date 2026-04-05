const employeeService = require('../../services/employee.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Register a new employee
 * @route   POST /api/v1/employee/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
    const employee = await employeeService.register(req.body);
    const { token, employee: employeeData } = employeeService.createSendToken(employee, 201, res);

    ApiResponse.created(res, { employee: employeeData, token }, 'Employee registered successfully');
});

/**
 * @desc    Login employee
 * @route   POST /api/v1/employee/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const employee = await employeeService.login(email, password);
    const { token, employee: employeeData } = employeeService.createSendToken(employee, 200, res);

    ApiResponse.success(res, { employee: employeeData, token }, 'Logged in successfully');
});

/**
 * @desc    Logout employee
 * @route   POST /api/v1/employee/logout
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
 * @desc    Get current employee
 * @route   GET /api/v1/employee/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res) => {
    const employee = await employeeService.getById(req.user._id);
    ApiResponse.success(res, employee, 'Employee retrieved successfully');
});

/**
 * @desc    Update current employee profile
 * @route   PATCH /api/v1/employee/me
 * @access  Private
 */
const updateMe = catchAsync(async (req, res) => {
    const employee = await employeeService.updateProfile(req.user._id, req.body);
    ApiResponse.success(res, employee, 'Profile updated successfully');
});

/**
 * @desc    Update current employee password
 * @route   PATCH /api/v1/employee/update-my-password
 * @access  Private
 */
const updateMyPassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const employee = await employeeService.updatePassword(req.user._id, currentPassword, newPassword);
    const { token, employee: employeeData } = employeeService.createSendToken(employee, 200, res);

    ApiResponse.success(res, { employee: employeeData, token }, 'Password updated successfully');
});

/**
 * @desc    Complete onboarding
 * @route   PATCH /api/v1/employee/onboarding
 * @access  Private
 */
const completeOnboarding = catchAsync(async (req, res) => {
    const employee = await employeeService.completeOnboarding(req.user._id, req.body);
    ApiResponse.success(res, employee, 'Onboarding completed successfully');
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/employee/forgot-password
 * @access  Public
 */
const forgotPassword = catchAsync(async (req, res) => {
    const { email, resetUrlBase } = req.body;

    const urlBase = resetUrlBase || `${req.protocol}://${req.get('host')}/reset-password`;

    await employeeService.forgotPassword(email, urlBase);
    ApiResponse.success(res, null, 'Token sent to email!');
});

/**
 * @desc    Reset password
 * @route   PATCH /api/v1/employee/reset-password/:token
 * @access  Public
 */
const resetPassword = catchAsync(async (req, res) => {
    const employee = await employeeService.resetPassword(req.params.token, req.body.password);
    const { token, employee: employeeData } = employeeService.createSendToken(employee, 200, res);

    ApiResponse.success(res, { employee: employeeData, token }, 'Password reset successfully');
});

module.exports = {
    register,
    login,
    logout,
    getMe,
    updateMe,
    updateMyPassword,
    completeOnboarding,
    forgotPassword,
    resetPassword,
};
