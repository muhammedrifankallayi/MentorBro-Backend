const whatsappService = require('../services/whatsapp.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * WhatsApp Controller
 */

/**
 * Send a direct text message
 * @route POST /api/v1/whatsapp/send-text
 */
const sendTextMessage = catchAsync(async (req, res, next) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return next(new AppError('Phone number (to) and message are required', 400));
    }

    const result = await whatsappService.sendTextMessage(to, message);

    if (!result.success) {
        return next(new AppError(result.error, 400));
    }

    res.status(200).json({
        success: true,
        message: 'WhatsApp message sent successfully',
        data: result.data
    });
});

/**
 * Send a predefined notification
 * @route POST /api/v1/whatsapp/send-notification
 */
const sendNotification = catchAsync(async (req, res, next) => {
    const { to, type, data } = req.body;

    if (!to || !type) {
        return next(new AppError('Phone number (to) and type are required', 400));
    }

    const result = await whatsappService.sendNotification(to, type, data);

    if (!result.success) {
        return next(new AppError(result.error, 400));
    }

    res.status(200).json({
        success: true,
        message: 'WhatsApp notification sent successfully',
        data: result.data
    });
});

module.exports = {
    sendTextMessage,
    sendNotification
};
