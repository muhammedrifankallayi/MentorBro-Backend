const Joi = require('joi');

const registerSchema = {
    body: Joi.object().keys({
        name: Joi.string().min(2).max(50).required().messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot exceed 50 characters',
        }),
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email',
        }),
        password: Joi.string().min(6).required().messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters',
        }),
    }),
};

const loginSchema = {
    body: Joi.object().keys({
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email',
        }),
        password: Joi.string().required().messages({
            'string.empty': 'Password is required',
        }),
    }),
};

const updatePasswordSchema = {
    body: Joi.object().keys({
        currentPassword: Joi.string().required().messages({
            'string.empty': 'Current password is required',
        }),
        newPassword: Joi.string().min(6).required().messages({
            'string.empty': 'New password is required',
            'string.min': 'New password must be at least 6 characters',
        }),
    }),
};

const updateProfileSchema = {
    body: Joi.object().keys({
        name: Joi.string().min(2).max(50),
        email: Joi.string().email(),
        mobileNo: Joi.string().pattern(/^\d{10}$/).messages({
            'string.pattern.base': 'Please provide a valid 10-digit mobile number'
        }),
        address: Joi.string().max(200),
    }),
};

const forgotPasswordSchema = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        resetUrlBase: Joi.string(),
    }),
};

const resetPasswordSchema = {
    params: Joi.object().keys({
        token: Joi.string().required(),
    }),
    body: Joi.object().keys({
        password: Joi.string().min(6).required(),
    }),
};

module.exports = {
    registerSchema,
    loginSchema,
    updatePasswordSchema,
    updateProfileSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};
