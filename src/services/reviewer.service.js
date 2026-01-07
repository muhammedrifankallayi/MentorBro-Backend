const jwt = require('jsonwebtoken');
const { Reviewer } = require('../models');
const { AppError } = require('../utils');
const config = require('../config');

/**
 * Generate JWT token for reviewer
 */
const signToken = (id) => {
    return jwt.sign({ id, role: 'reviewer' }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

/**
 * Create and send token response
 */
const createSendToken = (reviewer, statusCode, res) => {
    const token = signToken(reviewer._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + config.jwt.cookieExpiresIn * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    reviewer.password = undefined;

    return {
        token,
        reviewer,
    };
};

/**
 * Register a new reviewer
 */
const register = async (username, password) => {
    // Check if username and password exist
    if (!username || !password) {
        throw new AppError('Please provide username and password', 400);
    }

    // Check if reviewer already exists
    const existingReviewer = await Reviewer.findOne({ username });
    if (existingReviewer) {
        throw new AppError('Username already exists', 400);
    }

    // Create new reviewer
    const reviewer = await Reviewer.create({
        username,
        password,
    });

    return reviewer;
};

/**
 * Login reviewer by username and password
 */
const login = async (username, password) => {
    // Check if username and password exist
    if (!username || !password) {
        throw new AppError('Please provide username and password', 400);
    }

    // Find reviewer by username
    const reviewer = await Reviewer.findOne({ username }).select('+password');

    if (!reviewer || !(await reviewer.comparePassword(password))) {
        throw new AppError('Incorrect username or password', 401);
    }

    return reviewer;
};

/**
 * Get reviewer by ID
 */
const getById = async (reviewerId) => {
    const reviewer = await Reviewer.findById(reviewerId);

    if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
    }

    return reviewer;
};

/**
 * Create a new reviewer by admin with auto-generated password
 * @param {Object} reviewerData - Reviewer data (without password)
 * @param {string} loginUrl - Optional login URL to include in email
 * @returns {Object} Created reviewer and generated password
 */
const createReviewerByAdmin = async (reviewerData, loginUrl = null) => {
    const {
        fullName,
        username,
        email,
        mobileNo,
        address,
        teachingPrograms,
        totalExperience,
        currentCompany
    } = reviewerData;

    // Validate required fields - only username is required
    if (!username) {
        throw new AppError('Please provide username', 400);
    }

    // Must have either email or mobileNo
    if (!email && !mobileNo) {
        throw new AppError('Please provide either email or mobile number', 400);
    }

    // Check if username already exists
    const existingUsername = await Reviewer.findOne({ username });
    if (existingUsername) {
        throw new AppError('Username already exists', 400);
    }

    // Check if email already exists (if provided)
    if (email) {
        const existingEmail = await Reviewer.findOne({ email });
        if (existingEmail) {
            throw new AppError('Email already exists', 400);
        }
    }

    // Check if mobile number already exists (if provided)
    if (mobileNo) {
        const existingMobile = await Reviewer.findOne({ mobileNo });
        if (existingMobile) {
            throw new AppError('Mobile number already exists', 400);
        }
    }

    // Generate a secure random password
    const passwordGenerator = require('../utils/passwordGenerator');
    const generatedPassword = passwordGenerator.generateSimplePassword(12);

    // Create reviewer with generated password
    const reviewer = await Reviewer.create({
        fullName, // Will be set to username by pre-save hook if not provided
        username,
        password: generatedPassword, // Will be hashed by the model pre-save hook
        email,
        mobileNo,
        address,
        teachingPrograms: teachingPrograms || [],
        totalExperience: totalExperience || 0,
        currentCompany,
    });

    // Send credentials email
    if (email) {
        try {
            const mailer = require('../utils/mailer');
            await mailer.sendReviewerCredentialsEmail(email, {
                fullName: reviewer.fullName || username, // Use actual fullName from reviewer or username
                username,
                password: generatedPassword,
                loginUrl
            });
        } catch (emailError) {
            // Log error but don't fail the creation
            const logger = require('../utils/logger');
            logger.error('Failed to send credentials email:', emailError);
            // Note: You might want to handle this differently in production
        }
    }

    return {
        reviewer,
        generatedPassword, // Return for admin to see (in response only)
    };
};

/**
 * Get all reviewers with filtering, searching, and pagination
 * @param {Object} queryParams - Query parameters for filtering
 * @returns {Object} Reviewers list with pagination info
 */
const getAllReviewers = async (queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isActive,
        isVerified,
        minExperience,
        maxExperience,
        currentCompany,
        teachingProgram,
    } = queryParams;

    // Build filter object
    const filter = {};

    // Active status filter
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true' || isActive === true;
    }

    // Verified status filter
    if (isVerified !== undefined) {
        filter.isVerified = isVerified === 'true' || isVerified === true;
    }

    // Experience range filter
    if (minExperience !== undefined) {
        filter.totalExperience = { ...filter.totalExperience, $gte: Number(minExperience) };
    }
    if (maxExperience !== undefined) {
        filter.totalExperience = { ...filter.totalExperience, $lte: Number(maxExperience) };
    }

    // Current company filter
    if (currentCompany) {
        filter.currentCompany = { $regex: currentCompany, $options: 'i' };
    }

    // Teaching program filter
    if (teachingProgram) {
        filter.teachingPrograms = teachingProgram;
    }

    // Search across multiple fields
    if (search) {
        filter.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { mobileNo: { $regex: search, $options: 'i' } },
        ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const reviewers = await Reviewer.find(filter)
        .select('-password')
        .populate('teachingPrograms', 'name totalWeeks')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

    // Get total count for pagination
    const total = await Reviewer.countDocuments(filter);

    return {
        reviewers,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
            hasNextPage: skip + reviewers.length < total,
            hasPrevPage: Number(page) > 1,
        },
    };
};

/**
 * Get reviewer by ID (admin version with full details)
 * @param {string} reviewerId - Reviewer ID
 * @returns {Object} Reviewer details
 */
const getReviewerById = async (reviewerId) => {
    const reviewer = await Reviewer.findById(reviewerId)
        .select('-password')
        .populate('teachingPrograms', 'name totalWeeks topics');

    if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
    }

    return reviewer;
};

/**
 * Update reviewer by admin
 * @param {string} reviewerId - Reviewer ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated reviewer
 */
const updateReviewer = async (reviewerId, updateData) => {
    // Don't allow password updates through this endpoint
    delete updateData.password;

    // If teachingProgramIds is provided, validate and update
    if (updateData.teachingProgramIds) {
        const Program = require('../models/program.model');
        const programs = await Program.find({
            _id: { $in: updateData.teachingProgramIds }
        });

        if (programs.length !== updateData.teachingProgramIds.length) {
            throw new AppError('One or more program IDs are invalid', 400);
        }

        updateData.teachingPrograms = updateData.teachingProgramIds;
        delete updateData.teachingProgramIds;
    }

    // Check if username is being updated and if it's already taken
    if (updateData.username) {
        const existingUsername = await Reviewer.findOne({
            username: updateData.username,
            _id: { $ne: reviewerId }
        });
        if (existingUsername) {
            throw new AppError('Username already exists', 400);
        }
    }

    // Check if email is being updated and if it's already taken
    if (updateData.email) {
        const existingEmail = await Reviewer.findOne({
            email: updateData.email,
            _id: { $ne: reviewerId }
        });
        if (existingEmail) {
            throw new AppError('Email already exists', 400);
        }
    }

    // Check if mobile number is being updated and if it's already taken
    if (updateData.mobileNo) {
        const existingMobile = await Reviewer.findOne({
            mobileNo: updateData.mobileNo,
            _id: { $ne: reviewerId }
        });
        if (existingMobile) {
            throw new AppError('Mobile number already exists', 400);
        }
    }

    const reviewer = await Reviewer.findByIdAndUpdate(
        reviewerId,
        updateData,
        { new: true, runValidators: true }
    )
        .select('-password')
        .populate('teachingPrograms', 'name totalWeeks topics');

    if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
    }

    return reviewer;
};

/**
 * Update reviewer status (activate/deactivate)
 * @param {string} reviewerId - Reviewer ID
 * @param {boolean} isActive - Active status
 * @returns {Object} Updated reviewer
 */
const updateReviewerStatus = async (reviewerId, isActive) => {
    const reviewer = await Reviewer.findByIdAndUpdate(
        reviewerId,
        { isActive },
        { new: true, runValidators: true }
    )
        .select('-password')
        .populate('teachingPrograms', 'name totalWeeks');

    if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
    }

    return reviewer;
};

/**
 * Delete reviewer (soft delete by setting isActive to false)
 * @param {string} reviewerId - Reviewer ID
 * @returns {Object} Success message
 */
const deleteReviewer = async (reviewerId) => {
    const reviewer = await Reviewer.findById(reviewerId);

    if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
    }

    // Soft delete by setting isActive to false
    reviewer.isActive = false;
    await reviewer.save();

    return { message: 'Reviewer deleted successfully' };
};

/**
 * Permanently delete reviewer (hard delete)
 * @param {string} reviewerId - Reviewer ID
 * @returns {Object} Success message
 */
const permanentlyDeleteReviewer = async (reviewerId) => {
    const reviewer = await Reviewer.findByIdAndDelete(reviewerId);

    if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
    }

    return { message: 'Reviewer permanently deleted' };
};

/**
 * Update reviewer verification status
 * @param {string} reviewerId - Reviewer ID
 * @param {boolean} isVerified - Verification status
 * @returns {Object} Updated reviewer
 */
const updateReviewerVerificationStatus = async (reviewerId, isVerified) => {
    const reviewer = await Reviewer.findByIdAndUpdate(
        reviewerId,
        { isVerified },
        { new: true, runValidators: true }
    )
        .select('-password')
        .populate('teachingPrograms', 'name totalWeeks');

    if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
    }

    return reviewer;
};

/**
 * Get reviewer verification status
 * @param {string} reviewerId - Reviewer ID
 * @returns {Object} Verification status details
 */
const getVerificationStatus = async (reviewerId) => {
    const reviewer = await Reviewer.findById(reviewerId)
        .select('username fullName email isVerified isActive');

    if (!reviewer) {
        throw new AppError('Reviewer not found', 404);
    }

    return {
        isVerified: reviewer.isVerified,
        isActive: reviewer.isActive,
        username: reviewer.username,
        fullName: reviewer.fullName,
        email: reviewer.email,
    };
};

module.exports = {
    signToken,
    createSendToken,
    register,
    login,
    getById,
    getVerificationStatus,
    createReviewerByAdmin,
    getAllReviewers,
    getReviewerById,
    updateReviewer,
    updateReviewerStatus,
    updateReviewerVerificationStatus,
    deleteReviewer,
    permanentlyDeleteReviewer,
};



