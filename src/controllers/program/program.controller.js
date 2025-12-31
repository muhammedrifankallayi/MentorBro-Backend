const programService = require('../../services/program.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Create a new program
 * @route   POST /api/v1/program
 * @access  Admin only
 */
const create = catchAsync(async (req, res) => {
    const program = await programService.create(req.body);
    ApiResponse.success(res, program, 'Program created successfully', 201);
});

/**
 * @desc    Get all programs
 * @route   GET /api/v1/program
 * @access  Public
 */
const getAll = catchAsync(async (req, res) => {
    const result = await programService.getAll(req.query);
    ApiResponse.list(res, result.programs, result.pagination, 'Programs retrieved successfully');
});

/**
 * @desc    Get program by ID
 * @route   GET /api/v1/program/:id
 * @access  Public
 */
const getById = catchAsync(async (req, res) => {
    const program = await programService.getById(req.params.id);
    ApiResponse.success(res, program, 'Program retrieved successfully');
});

/**
 * @desc    Update program
 * @route   PUT /api/v1/program/:id
 * @access  Admin only
 */
const update = catchAsync(async (req, res) => {
    const program = await programService.update(req.params.id, req.body);
    ApiResponse.success(res, program, 'Program updated successfully');
});

/**
 * @desc    Delete program
 * @route   DELETE /api/v1/program/:id
 * @access  Admin only
 */
const remove = catchAsync(async (req, res) => {
    await programService.remove(req.params.id);
    ApiResponse.success(res, null, 'Program deleted successfully');
});

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
};

