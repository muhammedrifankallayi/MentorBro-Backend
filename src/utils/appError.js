/**
 * Custom Error class for operational errors
 * These are errors we can predict and handle gracefully
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errorCode = errorCode; // Custom error code for specific error types

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
