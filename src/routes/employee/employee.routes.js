const express = require('express');
const { employeeController } = require('../../controllers/employee');
const { validate } = require('../../middleware');
const { employeeValidation } = require('../../validations');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// Auth routes
router.post(
    '/register',
    validate(employeeValidation.registerSchema),
    employeeController.register
);

router.post(
    '/login',
    validate(employeeValidation.loginSchema),
    employeeController.login
);

router.post('/logout', employeeController.logout);

router.post(
    '/forgot-password',
    validate(employeeValidation.forgotPasswordSchema),
    employeeController.forgotPassword
);

router.patch(
    '/reset-password/:token',
    validate(employeeValidation.resetPasswordSchema),
    employeeController.resetPassword
);

// Protected routes
router.use(protect); // All routes below this line require authentication

router.get('/me', employeeController.getMe);
router.patch(
    '/me',
    validate(employeeValidation.updateProfileSchema),
    employeeController.updateMe
);
router.patch(
    '/update-my-password',
    validate(employeeValidation.updatePasswordSchema),
    employeeController.updateMyPassword
);

module.exports = router;
