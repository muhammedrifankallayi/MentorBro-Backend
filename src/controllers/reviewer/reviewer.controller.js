const reviewerService = require('../../services/reviewer.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Register reviewer
 * @route   POST /api/v1/reviewer/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
    const { username, password } = req.body;
    const reviewer = await reviewerService.register(username, password);
    const { token, reviewer: reviewerData } = reviewerService.createSendToken(reviewer, 201, res);

    ApiResponse.success(res, { reviewer: reviewerData, token }, 'Reviewer registered successfully', 201);
});

/**
 * @desc    Login reviewer
 * @route   POST /api/v1/reviewer/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
    const { username, password } = req.body;
    const reviewer = await reviewerService.login(username, password);
    const { token, reviewer: reviewerData } = reviewerService.createSendToken(reviewer, 200, res);

    ApiResponse.success(res, { reviewer: reviewerData, token }, 'Logged in successfully');
});

/**
 * @desc    Logout reviewer
 * @route   POST /api/v1/reviewer/logout
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
 * @desc    Get current reviewer
 * @route   GET /api/v1/reviewer/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res) => {
    const reviewer = await reviewerService.getById(req.user.id);
    ApiResponse.success(res, { reviewer }, 'Reviewer retrieved successfully');
});

/**
 * @desc    Add reviewer by admin (auto-generates password and sends email)
 * @route   POST /api/v1/reviewer/add
 * @access  Private/Admin
 */
const addReviewerByAdmin = catchAsync(async (req, res) => {
    const reviewerData = req.body;

    // Optional: Get login URL from environment or request
    const loginUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/reviewer/login`
        : null;

    // Create reviewer with auto-generated password
    const { reviewer, generatedPassword } = await reviewerService.createReviewerByAdmin(
        reviewerData,
        loginUrl
    );

    // Populate teaching programs if they exist
    if (reviewer.teachingPrograms && reviewer.teachingPrograms.length > 0) {
        await reviewer.populate('teachingPrograms', 'name totalWeeks');
    }

    ApiResponse.success(
        res,
        {
            reviewer,
            generatedPassword, // Include in response for admin
            emailSent: !!reviewer.email,
            message: reviewer.email
                ? `Credentials have been sent to ${reviewer.email}`
                : 'Please share the credentials manually as no email was provided'
        },
        'Reviewer created successfully',
        201
    );
});

/**
 * @desc    Get all reviewers with filtering and pagination
 * @route   GET /api/v1/reviewer/list
 * @access  Private/Admin
 */
const getAllReviewers = catchAsync(async (req, res) => {
    const queryParams = req.query;

    const { reviewers, pagination } = await reviewerService.getAllReviewers(queryParams);

    ApiResponse.list(res, reviewers, pagination, 'Reviewers retrieved successfully');
});

/**
 * @desc    Get reviewer by ID
 * @route   GET /api/v1/reviewer/:id
 * @access  Private/Admin
 */
const getReviewerById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const reviewer = await reviewerService.getReviewerById(id);

    ApiResponse.success(res, { reviewer }, 'Reviewer retrieved successfully');
});

/**
 * @desc    Update reviewer
 * @route   PATCH /api/v1/reviewer/:id
 * @access  Private/Admin
 */
const updateReviewer = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const reviewer = await reviewerService.updateReviewer(id, updateData);

    ApiResponse.success(res, { reviewer }, 'Reviewer updated successfully');
});

/**
 * @desc    Update reviewer status (activate/deactivate)
 * @route   PATCH /api/v1/reviewer/:id/status
 * @access  Private/Admin
 */
const updateReviewerStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
        throw new ApiResponse.error(res, 'isActive field is required', 400);
    }

    const reviewer = await reviewerService.updateReviewerStatus(id, isActive);

    ApiResponse.success(
        res,
        { reviewer },
        `Reviewer ${isActive ? 'activated' : 'deactivated'} successfully`
    );
});

/**
 * @desc    Delete reviewer (soft delete)
 * @route   DELETE /api/v1/reviewer/:id
 * @access  Private/Admin
 */
const deleteReviewer = catchAsync(async (req, res) => {
    const { id } = req.params;

    await reviewerService.deleteReviewer(id);

    ApiResponse.success(res, null, 'Reviewer deleted successfully');
});

/**
 * @desc    Permanently delete reviewer
 * @route   DELETE /api/v1/reviewer/:id/permanent
 * @access  Private/Admin
 */
const permanentlyDeleteReviewer = catchAsync(async (req, res) => {
    const { id } = req.params;

    await reviewerService.permanentlyDeleteReviewer(id);

    ApiResponse.success(res, null, 'Reviewer permanently deleted');
});

module.exports = {
    register,
    login,
    logout,
    getMe,
    addReviewerByAdmin,
    getAllReviewers,
    getReviewerById,
    updateReviewer,
    updateReviewerStatus,
    deleteReviewer,
    permanentlyDeleteReviewer,
};

