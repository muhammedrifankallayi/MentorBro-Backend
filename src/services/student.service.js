const jwt = require('jsonwebtoken');
const { Student } = require('../models');
const { AppError } = require('../utils');
const config = require('../config');

/**
 * Generate JWT token for student
 */
const signToken = (id) => {
    return jwt.sign({ id, role: 'student' }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

/**
 * Create and send token response
 */
const createSendToken = (student, statusCode, res) => {
    const token = signToken(student._id);

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
    student.password = undefined;

    return {
        token,
        student,
    };
};

/**
 * Register a new student
 */
const register = async (studentData) => {
    const { name, type, email, password, mobileNo, address, batch, program } = studentData;

    // Check if name, email and password are provided
    if (!name || !email || !password) {
        throw new AppError('Please provide name, email and password', 400);
    }

    // Check if student already exists by email
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
        throw new AppError('Email already in use', 400);
    }

    // Create new student
    const student = await Student.create({
        name,
        type,
        email,
        password,
        mobileNo,
        address,
        batch,
        program,
    });

    return student;
};

/**
 * Login student by email and password
 */
const login = async (email, password) => {
    // Check if email and password exist
    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    // Check if student exists && password is correct
    const student = await Student.findOne({ email }).select('+password');

    if (!student || !(await student.comparePassword(password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    return student;
};

/**
 * Get student by ID
 */
const getById = async (studentId) => {
    const student = await Student.findById(studentId)
        .populate('batch', 'name startOn endedOn')
        .populate('program', 'name totalWeeks');

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    return student;
};

/**
 * Update password
 */
const updatePassword = async (studentId, currentPassword, newPassword) => {
    // Get student with password
    const student = await Student.findById(studentId).select('+password');

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    // Check if current password is correct
    if (!(await student.comparePassword(currentPassword))) {
        throw new AppError('Your current password is incorrect', 401);
    }

    // Update password
    student.password = newPassword;
    await student.save();

    return student;
};

/**
 * Get students by approval status
 * @param {string} status - 'pending', 'approved', or 'rejected'
 * @param {Object} queryParams - Query parameters for pagination and search
 */
const getByApprovalStatus = async (status, queryParams = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
    } = queryParams;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Build filter
    const filter = { approvalStatus: status };

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [students, total] = await Promise.all([
        Student.find(filter)
            .populate('batch', 'name startOn endedOn')
            .populate('program', 'name totalWeeks')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Student.countDocuments(filter),
    ]);

    return {
        students,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Update student approval status
 * @param {string} studentId - Student ID
 * @param {string} approvalStatus - 'pending', 'approved', or 'rejected'
 */
const updateApprovalStatus = async (studentId, approvalStatus) => {
    const student = await Student.findByIdAndUpdate(
        studentId,
        { approvalStatus },
        { new: true, runValidators: true }
    ).populate('batch', 'name startOn endedOn').populate('program', 'name totalWeeks');

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    return student;
};

/**
 * Update student profile (name, email, mobileNo, address, program)
 * @param {string} studentId - Student ID
 * @param {Object} updateData - Data to update
 */
const updateProfile = async (studentId, updateData) => {
    // Only allow updating specific fields
    const allowedFields = ['name', 'email', 'mobileNo', 'address', 'program'];
    const filteredData = {};

    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
            filteredData[key] = updateData[key];
        }
    });

    // If email is being updated, check if it's already in use
    if (filteredData.email) {
        const existingStudent = await Student.findOne({
            email: filteredData.email,
            _id: { $ne: studentId }
        });
        if (existingStudent) {
            throw new AppError('Email already in use', 400);
        }
    }

    const student = await Student.findByIdAndUpdate(
        studentId,
        filteredData,
        { new: true, runValidators: true }
    )
        .populate('batch', 'name startOn endedOn')
        .populate('program', 'name totalWeeks');

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    return student;
};

module.exports = {
    signToken,
    createSendToken,
    register,
    login,
    getById,
    updatePassword,
    updateProfile,
    getByApprovalStatus,
    updateApprovalStatus,
};


