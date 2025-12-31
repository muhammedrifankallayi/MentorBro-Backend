const Program = require('../models/program.model');
const { AppError } = require('../utils');

/**
 * Create a new program
 * @param {Object} programData - Program data
 * @returns {Promise<Object>} Created program
 */
const create = async (programData) => {
    const program = await Program.create(programData);
    return program;
};

/**
 * Get all programs with optional filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Programs list with pagination info
 */
const getAll = async (queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
    } = queryParams;

    // Build filter
    const filter = {};

    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [programs, total] = await Promise.all([
        Program.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Program.countDocuments(filter),
    ]);

    return {
        programs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get program by ID
 * @param {string} id - Program ID
 * @returns {Promise<Object>} Program
 */
const getById = async (id) => {
    const program = await Program.findById(id);

    if (!program) {
        throw new AppError('Program not found', 404);
    }

    return program;
};

/**
 * Update program by ID
 * @param {string} id - Program ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated program
 */
const update = async (id, updateData) => {
    const program = await Program.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!program) {
        throw new AppError('Program not found', 404);
    }

    return program;
};

/**
 * Delete program by ID (soft delete - sets isActive to false)
 * @param {string} id - Program ID
 * @returns {Promise<Object>} Deleted program
 */
const remove = async (id) => {
    const program = await Program.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
    );

    if (!program) {
        throw new AppError('Program not found', 404);
    }

    return program;
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
};
