const programTaskService = require('../../services/programTask.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Create a new program task
 * @route   POST /api/v1/program-task
 * @access  Admin only
 */
const create = catchAsync(async (req, res) => {
    const programTask = await programTaskService.create(req.body);
    ApiResponse.success(res, programTask, 'Program task created successfully', 201);
});

/**
 * @desc    Get all program tasks
 * @route   GET /api/v1/program-task
 * @access  Public
 */
const getAll = catchAsync(async (req, res) => {
    const result = await programTaskService.getAll(req.query);
    ApiResponse.list(res, result.programTasks, result.pagination, 'Program tasks retrieved successfully');
});

/**
 * @desc    Get program task by ID
 * @route   GET /api/v1/program-task/:id
 * @access  Public
 */
const getById = catchAsync(async (req, res) => {
    const programTask = await programTaskService.getById(req.params.id);
    ApiResponse.success(res, programTask, 'Program task retrieved successfully');
});

/**
 * @desc    Get program tasks by program ID
 * @route   GET /api/v1/program-task/program/:programId
 * @access  Public
 */
const getByProgramId = catchAsync(async (req, res) => {
    const programTasks = await programTaskService.getByProgramId(req.params.programId);
    ApiResponse.success(res, programTasks, 'Program tasks retrieved successfully');
});

/**
 * @desc    Update program task
 * @route   PUT /api/v1/program-task/:id
 * @access  Admin only
 */
const update = catchAsync(async (req, res) => {
    const programTask = await programTaskService.update(req.params.id, req.body);
    ApiResponse.success(res, programTask, 'Program task updated successfully');
});

/**
 * @desc    Delete program task
 * @route   DELETE /api/v1/program-task/:id
 * @access  Admin only
 */
const remove = catchAsync(async (req, res) => {
    await programTaskService.remove(req.params.id);
    ApiResponse.success(res, null, 'Program task deleted successfully');
});

/**
 * @desc    Get next week number for a program
 * @route   GET /api/v1/program-task/next-week/:programId
 * @access  Public
 */
const getNextWeek = catchAsync(async (req, res) => {
    const result = await programTaskService.getNextWeek(req.params.programId);
    ApiResponse.success(res, result, 'Next week number retrieved successfully');
});

/**
 * @desc    Update all program tasks cost to 120 (Test API)
 * @route   GET /api/v1/program-task/update-all-cost
 * @access  Public
 */
const updateAllCost = catchAsync(async (req, res) => {
    const result = await programTaskService.updateAllCost(120);
    ApiResponse.success(res, result, 'All program tasks cost updated to 120');
});

module.exports = {
    create,
    getAll,
    getById,
    getByProgramId,
    update,
    remove,
    getNextWeek,
    updateAllCost,
};

