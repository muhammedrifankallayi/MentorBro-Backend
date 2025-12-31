const { AppError, logger } = require('../utils');

/**
 * Handle CastError from MongoDB (invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

/**
 * Handle Duplicate Key Error from MongoDB
 */
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

/**
 * Handle Validation Error from MongoDB
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

/**
 * Handle JWT Error
 */
const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401, 'JWT_INVALID');

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401, 'JWT_EXPIRED');

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
    const response = {
        success: false,
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    };

    if (err.errorCode) {
        response.errorCode = err.errorCode;
    }

    res.status(err.statusCode).json(response);
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        const response = {
            success: false,
            status: err.status,
            message: err.message,
        };

        if (err.errorCode) {
            response.errorCode = err.errorCode;
        }

        res.status(err.statusCode).json(response);
    } else {
        // Programming or other unknown error: don't leak error details
        logger.error('ERROR 💥', err);

        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Something went wrong!',
        });
    }
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

module.exports = errorHandler;
