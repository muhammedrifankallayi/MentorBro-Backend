const batchService = require('../../services/batch.service');
const { catchAsync, ApiResponse } = require('../../utils');

/**
 * @desc    Create a new batch
 * @route   POST /api/v1/batch
 * @access  Admin only
 */
const create = catchAsync(async (req, res) => {
    const batch = await batchService.create(req.body);
    ApiResponse.success(res, { batch }, 'Batch created successfully', 201);
});

/**
 * @desc    Get all batches
 * @route   GET /api/v1/batch
 * @access  Public
 */
const getAll = catchAsync(async (req, res) => {
    const result = await batchService.getAll(req.query);
    ApiResponse.list(res, result.batches, result.pagination, 'Batches retrieved successfully');
});

/**
 * @desc    Get batch by ID
 * @route   GET /api/v1/batch/:id
 * @access  Public
 */
const getById = catchAsync(async (req, res) => {
    const batch = await batchService.getById(req.params.id);
    ApiResponse.success(res, { batch }, 'Batch retrieved successfully');
});

/**
 * @desc    Update batch
 * @route   PUT /api/v1/batch/:id
 * @access  Admin only
 */
const update = catchAsync(async (req, res) => {
    const batch = await batchService.update(req.params.id, req.body);
    ApiResponse.success(res, { batch }, 'Batch updated successfully');
});

/**
 * @desc    Delete batch
 * @route   DELETE /api/v1/batch/:id
 * @access  Admin only
 */
const remove = catchAsync(async (req, res) => {
    await batchService.remove(req.params.id);
    ApiResponse.success(res, null, 'Batch deleted successfully');
});

/**
 * @desc    Update batch status
 * @route   PATCH /api/v1/batch/:id/status
 * @access  Admin only
 */
const updateStatus = catchAsync(async (req, res) => {
    const { isActive } = req.body;
    const batch = await batchService.updateStatus(req.params.id, isActive);
    ApiResponse.success(res, { batch }, 'Batch status updated successfully');
});

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    updateStatus,
};
