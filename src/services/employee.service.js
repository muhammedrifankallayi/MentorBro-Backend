const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Employee = require('../models/employee.model');
const { AppError, mailer } = require('../utils');
const config = require('../config');

/**
 * Generate JWT token for employee
 */
const signToken = (id) => {
    return jwt.sign({ id, role: 'employee' }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

/**
 * Create and send token response
 */
const createSendToken = (employee, statusCode, res) => {
    const token = signToken(employee._id);

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
    employee.password = undefined;

    return {
        token,
        employee,
    };
};

/**
 * Register a new employee
 */
const register = async (employeeData) => {
    const { name, email, password } = employeeData;

    if (!name || !email || !password) {
        throw new AppError('Please provide name, email and password', 400);
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
        throw new AppError('Email already in use', 400);
    }

    const employee = await Employee.create({
        name,
        email,
        password,
    });

    return employee;
};

/**
 * Login employee by email and password
 */
const login = async (email, password) => {
    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    const employee = await Employee.findOne({ email }).select('+password');

    if (!employee || !(await employee.comparePassword(password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    return employee;
};

/**
 * Get employee by ID
 */
const getById = async (employeeId) => {
    const employee = await Employee.findById(employeeId);

    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    return employee;
};

/**
 * Update password
 */
const updatePassword = async (employeeId, currentPassword, newPassword) => {
    const employee = await Employee.findById(employeeId).select('+password');

    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    if (!(await employee.comparePassword(currentPassword))) {
        throw new AppError('Your current password is incorrect', 401);
    }

    employee.password = newPassword;
    await employee.save();

    return employee;
};

/**
 * Send password reset email
 */
const forgotPassword = async (email, resetUrlBase) => {
    const trimmedEmail = email?.trim()?.toLowerCase();

    const employee = await Employee.findOne({ email: trimmedEmail });
    if (!employee) {
        throw new AppError('There is no employee with that email address.', 404);
    }

    const resetToken = employee.createPasswordResetToken();
    await employee.save({ validateBeforeSave: false });

    try {
        const resetURL = `${resetUrlBase}/${resetToken}`;
        await mailer.sendPasswordResetEmail(employee.email, resetToken, resetURL);
    } catch (err) {
        const logger = require('../utils/logger');
        logger.error('Forgot password email failed:', err);

        employee.passwordResetToken = undefined;
        employee.passwordResetExpires = undefined;
        await employee.save({ validateBeforeSave: false });

        throw new AppError(`There was an error sending the email: ${err.message}`, 500);
    }
};

/**
 * Reset password
 */
const resetPassword = async (token, password) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const employee = await Employee.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!employee) {
        throw new AppError('Token is invalid or has expired', 400);
    }
    employee.password = password;
    employee.passwordResetToken = undefined;
    employee.passwordResetExpires = undefined;
    await employee.save({ validateBeforeSave: false });

    return employee;
};

/**
 * Update profile
 */
const updateProfile = async (employeeId, updateData) => {
    const allowedFields = ['name', 'email', 'mobileNo', 'address'];
    const filteredData = {};

    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
            filteredData[key] = updateData[key];
        }
    });

    if (filteredData.email) {
        const existingEmployee = await Employee.findOne({
            email: filteredData.email,
            _id: { $ne: employeeId }
        });
        if (existingEmployee) {
            throw new AppError('Email already in use', 400);
        }
    }

    const employee = await Employee.findByIdAndUpdate(
        employeeId,
        filteredData,
        { new: true, runValidators: true }
    );

    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    return employee;
};

module.exports = {
    signToken,
    createSendToken,
    register,
    login,
    forgotPassword,
    resetPassword,
    getById,
    updatePassword,
    updateProfile,
};
