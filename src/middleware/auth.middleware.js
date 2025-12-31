const jwt = require('jsonwebtoken');
const { AppError, catchAsync } = require('../utils');
const { Admin, Reviewer, Student } = require('../models');
const config = require('../config');

/**
 * Get the appropriate model based on role
 */
const getModelByRole = (role) => {
    switch (role) {
        case 'admin':
            return Admin;
        case 'reviewer':
            return Reviewer;
        case 'student':
        default:
            return Student;
    }
};

/**
 * Protect routes - Authentication middleware
 */
const protect = catchAsync(async (req, res, next) => {
    // 1) Get token from header
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError('You are not logged in! Please log in to get access.', 401)
        );
    }

    // 2) Verify token
    let decoded;
    try {
        decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(
                new AppError('Your token has expired! Please log in again.', 401, 'JWT_EXPIRED')
            );
        }
        if (error.name === 'JsonWebTokenError') {
            return next(
                new AppError('Invalid token! Please log in again.', 401, 'JWT_INVALID')
            );
        }
        return next(error);
    }

    // 3) Get the appropriate model based on role and check if user exists
    const Model = getModelByRole(decoded.role);
    const currentUser = await Model.findById(decoded.id);

    if (!currentUser) {
        return next(
            new AppError('The user belonging to this token no longer exists.', 401)
        );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError('User recently changed password! Please log in again.', 401)
        );
    }

    // Grant access to protected route
    req.user = currentUser;
    req.user.role = decoded.role; // Attach role from token
    next();
});

/**
 * Restrict access to specific roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

module.exports = {
    protect,
    restrictTo,
};

