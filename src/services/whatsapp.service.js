const whapi = require('../utils/whapi');
const logger = require('../utils/logger');
const config = require('../config');
const SystemConfig = require('../models/systemConfig.model');

/**
 * Service for WhatsApp related operations
 */
class WhatsAppService {
    /**
     * Send a direct text message via WhatsApp
     * @param {string} to - Phone number with country code (e.g. "919876543210")
     * @param {string} message - The message content
     * @returns {Promise<Object>}
     */
    async sendTextMessage(to, message) {
        if (!(await whapi.isConfigured())) {
            logger.warn('WhatsApp service requested but Whapi not configured');
            return { success: false, error: 'WhatsApp service not configured' };
        }

        try {
            // Use default number if 'to' is not provided
            let recipientNumber = to;

            if (!recipientNumber) {
                const dbConfig = await SystemConfig.findOne({ isActive: true });
                recipientNumber = dbConfig?.whapi?.defaultNumber || config.whapi.defaultNumber;
            }

            if (!recipientNumber) {
                return { success: false, error: 'No recipient number provided and no default configured' };
            }

            // Ensure phone number format is correct for Whapi if needed
            const recipient = recipientNumber.includes('@') ? recipientNumber : `${recipientNumber}@s.whatsapp.net`;

            const result = await whapi.sendTextMessage(recipient, message);
            return { success: true, data: result };
        } catch (error) {
            logger.error(`Failed to send WhatsApp message to ${to || 'default'}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send a template-like notification (custom formatted message)
     * @param {string} to - Recipient number
     * @param {string} type - Notification type (for internal logging/logic)
     * @param {Object} data - Data to populate message
     * @returns {Promise<Object>}
     */
    async sendNotification(to, type, data) {
        let message = '';

        switch (type) {
            case 'REVIEW_SCHEDULED':
                message = `📅 *Review Scheduled*\n\nHello ${data.studentName},\nYour review for *${data.taskName}* has been scheduled for *${data.date}* at *${data.time}*.\n\nGood luck!`;
                break;
            case 'REVIEW_REMINDER':
                message = `⏰ *Reminder*\n\nHi ${data.studentName},\nDon't forget your review for *${data.taskName}* today at *${data.time}*.`;
                break;
            default:
                message = data.message || '';
        }

        if (!message) {
            return { success: false, error: 'No message content provided' };
        }

        return this.sendTextMessage(to, message);
    }
}

module.exports = new WhatsAppService();
