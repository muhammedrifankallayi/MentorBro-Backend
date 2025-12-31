const Joi = require('joi');

const updateUserSchema = Joi.object({
    name: Joi.string().min(2).max(50).messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
    }),
    email: Joi.string().email().messages({
        'string.email': 'Please provide a valid email',
    }),
});

const mongoIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid ID format',
            'string.empty': 'ID is required',
        }),
});

module.exports = {
    updateUserSchema,
    mongoIdSchema,
};
