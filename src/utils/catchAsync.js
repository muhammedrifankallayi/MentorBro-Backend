/**
 * Async handler wrapper to catch errors in async functions
 * Eliminates the need for try-catch blocks in controllers
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = catchAsync;
