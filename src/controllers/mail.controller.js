const mailerService = require('../services/mailer.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Send custom email from admin
 * @route POST /api/v1/admin/mail/send
 */
const sendCustomEmail = catchAsync(async (req, res, next) => {
    const { to, subject, content } = req.body;

    if (!to || !subject || !content) {
        return next(new AppError('Email address, subject, and content are required', 400));
    }

    const result = await mailerService.sendCustomEmail(to, subject, content);

    if (!result.success) {
        return next(new AppError(result.error || 'Failed to send email', 500));
    }

    res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        data: {
            messageId: result.messageId
        }
    });
});

module.exports = {
    sendCustomEmail
};
