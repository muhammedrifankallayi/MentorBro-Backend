const errorHandler = require('./error.middleware');
const { protect, restrictTo } = require('./auth.middleware');
const validate = require('./validate.middleware');

module.exports = {
    errorHandler,
    protect,
    restrictTo,
    validate,
};
