const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email',
    }),
    password: Joi.string().min(8).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
    }),
    passwordConfirm: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Password confirmation is required',
    }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
    }),
});

const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        'string.empty': 'Current password is required',
    }),
    newPassword: Joi.string().min(8).required().messages({
        'string.empty': 'New password is required',
        'string.min': 'New password must be at least 8 characters',
    }),
    passwordConfirm: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Password confirmation is required',
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    updatePasswordSchema,
};
