const Batch = require('../models/batch.model');
const { AppError } = require('../utils');

/**
 * Create a new batch
 * @param {Object} batchData - Batch data
 * @returns {Promise<Object>} Created batch
 */
const create = async (batchData) => {
    const batch = await Batch.create(batchData);
    return batch;
};

/**
 * Get all batches with optional filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Batches list with pagination info
 */
const getAll = async (queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        isActive,
    } = queryParams;

    // Build filter
    const filter = {};

    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === 'true' || isActive === true;
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [batches, total] = await Promise.all([
        Batch.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Batch.countDocuments(filter),
    ]);

    return {
        batches,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get batch by ID
 * @param {string} id - Batch ID
 * @returns {Promise<Object>} Batch
 */
const getById = async (id) => {
    const batch = await Batch.findById(id);

    if (!batch) {
        throw new AppError('Batch not found', 404);
    }

    return batch;
};

/**
 * Update batch by ID
 * @param {string} id - Batch ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated batch
 */
const update = async (id, updateData) => {
    const batch = await Batch.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!batch) {
        throw new AppError('Batch not found', 404);
    }

    return batch;
};

/**
 * Delete batch by ID (soft delete - sets isActive to false)
 * @param {string} id - Batch ID
 * @returns {Promise<Object>} Deleted batch
 */
const remove = async (id) => {
    const batch = await Batch.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
    );

    if (!batch) {
        throw new AppError('Batch not found', 404);
    }

    return batch;
};

/**
 * Update batch status
 * @param {string} id - Batch ID
 * @param {boolean} isActive - New status
 * @returns {Promise<Object>} Updated batch
 */
const updateStatus = async (id, isActive) => {
    // Use findOneAndUpdate to bypass the pre-find hook that filters by isActive
    const batch = await Batch.findOneAndUpdate(
        { _id: id },
        { isActive },
        { new: true, runValidators: true }
    );

    if (!batch) {
        throw new AppError('Batch not found', 404);
    }

    return batch;
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    updateStatus,
};
