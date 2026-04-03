const authValidation = require('./auth.validation');
const userValidation = require('./user.validation');
const employeeValidation = require('./employee.validation');

module.exports = {
    ...authValidation,
    ...userValidation,
    employeeValidation,
};
