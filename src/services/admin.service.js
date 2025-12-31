const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const { AppError } = require('../utils');
const config = require('../config');

/**
 * Generate JWT token for admin
 */
const signToken = (id) => {
    return jwt.sign({ id, role: 'admin' }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

/**
 * Create and send token response
 */
const createSendToken = (admin, statusCode, res) => {
    const token = signToken(admin._id);

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
    admin.password = undefined;

    return {
        token,
        admin,
    };
};

/**
 * Register a new admin
 */
const register = async (username, password) => {
    // Check if username and password exist
    if (!username || !password) {
        throw new AppError('Please provide username and password', 400);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
        throw new AppError('Username already exists', 400);
    }

    // Create new admin
    const admin = await Admin.create({
        username,
        password,
    });

    return admin;
};

/**
 * Login admin by username and password
 */
const login = async (username, password) => {
    // Check if username and password exist
    if (!username || !password) {
        throw new AppError('Please provide username and password', 400);
    }

    // Check if admin exists && password is correct
    const admin = await Admin.findOne({ username }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
        throw new AppError('Incorrect username or password', 401);
    }

    return admin;
};

/**
 * Update password
 */
const updatePassword = async (adminId, currentPassword, newPassword) => {
    // Get admin with password
    const admin = await Admin.findById(adminId).select('+password');

    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    // Check if current password is correct
    if (!(await admin.comparePassword(currentPassword))) {
        throw new AppError('Your current password is incorrect', 401);
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    return admin;
};

/**
 * Get admin by ID
 */
const getById = async (adminId) => {
    const admin = await Admin.findById(adminId);

    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    return admin;
};

module.exports = {
    signToken,
    createSendToken,
    register,
    login,
    updatePassword,
    getById,
};

