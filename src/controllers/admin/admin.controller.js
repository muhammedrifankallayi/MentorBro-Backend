const adminService = require('../../services/admin.service');
const studentService = require('../../services/student.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Register admin
 * @route   POST /api/v1/admin/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
    const { username, password } = req.body;
    const admin = await adminService.register(username, password);
    const { token, admin: adminData } = adminService.createSendToken(admin, 201, res);

    ApiResponse.success(res, { admin: adminData, token }, 'Admin registered successfully', 201);
});

/**
 * @desc    Login admin
 * @route   POST /api/v1/admin/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
    const { username, password } = req.body;
    const admin = await adminService.login(username, password);
    const { token, admin: adminData } = adminService.createSendToken(admin, 200, res);

    ApiResponse.success(res, { admin: adminData, token }, 'Logged in successfully');
});

/**
 * @desc    Logout admin
 * @route   POST /api/v1/admin/logout
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
 * @desc    Get current admin
 * @route   GET /api/v1/admin/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res) => {
    const admin = await adminService.getById(req.user.id);
    ApiResponse.success(res, { admin }, 'Admin retrieved successfully');
});

/**
 * @desc    Update password
 * @route   PATCH /api/v1/admin/update-password
 * @access  Private
 */
const updatePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const admin = await adminService.updatePassword(
        req.user.id,
        currentPassword,
        newPassword
    );
    const { token, admin: adminData } = adminService.createSendToken(admin, 200, res);

    ApiResponse.success(res, { admin: adminData, token }, 'Password updated successfully');
});

/**
 * @desc    Get students by approval status
 * @route   GET /api/v1/admin/students/status/:status
 * @access  Admin only
 */
const getStudentsByApprovalStatus = catchAsync(async (req, res) => {
    const { status } = req.params;
    const result = await studentService.getByApprovalStatus(status, req.query);
    ApiResponse.list(res, result.students, result.pagination, `${status.charAt(0).toUpperCase() + status.slice(1)} students retrieved successfully`);
});

/**
 * @desc    Update student approval status
 * @route   PATCH /api/v1/admin/students/:id/approval
 * @access  Admin only
 */
const updateStudentApproval = catchAsync(async (req, res) => {
    const { approvalStatus } = req.body;
    const student = await studentService.updateApprovalStatus(req.params.id, approvalStatus);
    ApiResponse.success(res, { student }, 'Student approval status updated successfully');
});

/**
 * @desc    Get students by batch ID
 * @route   GET /api/v1/admin/students/batch/:batchId
 * @access  Admin only
 */
const getStudentsByBatch = catchAsync(async (req, res) => {
    const { batchId } = req.params;
    const result = await studentService.getByBatch(batchId, req.query);
    ApiResponse.list(res, result.students, result.pagination, 'Students retrieved successfully');
});

/**
 * @desc    Update student details
 * @route   PUT /api/v1/admin/students/:id
 * @access  Admin only
 */
const updateStudent = catchAsync(async (req, res) => {
    const student = await studentService.updateProfile(req.params.id, req.body);
    ApiResponse.success(res, { student }, 'Student updated successfully');
});

/**
 * @desc    Impersonate student
 * @route   POST /api/v1/admin/students/:id/impersonate
 * @access  Admin only
 */
const impersonateStudent = catchAsync(async (req, res) => {
    const student = await studentService.getById(req.params.id);
    const token = studentService.signToken(student._id);

    ApiResponse.success(res, { token }, 'Impersonation token generated successfully');
});

module.exports = {
    register,
    login,
    logout,
    getMe,
    updatePassword,
    getStudentsByApprovalStatus,
    updateStudentApproval,
    getStudentsByBatch,
    updateStudent,
    impersonateStudent,
};


