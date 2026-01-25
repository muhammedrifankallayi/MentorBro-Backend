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

            // Ensure phone number format is correct for Whapi
            let recipient = recipientNumber;

            // If it's not already a formatted Whapi ID (like a group ID)
            if (!recipient.includes('@')) {
                recipient = recipient.replace(/\D/g, ''); // Remove non-numeric characters

                // If it's a 10 digit number, add 91 prefix
                if (recipient.length === 10) {
                    recipient = '91' + recipient;
                }

                recipient = recipient + '@s.whatsapp.net';
            }

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

        // Format Date to dd/mm/yyyy if possible
        const formatDate = (dateValue) => {
            if (!dateValue) return '';
            try {
                const d = new Date(dateValue);
                if (isNaN(d.getTime())) return dateValue; // If invalid date, return as is
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}/${month}/${year}`;
            } catch (e) {
                return dateValue;
            }
        };

        const studentName = data.studentName || data.studentUsername || data.studentEmail || 'Student';
        const formattedDate = formatDate(data.date);
        const batchInfo = data.batchName ? `\n*Batch:* ${data.batchName}` : '';
        const secondTimeInfo = data.secondTime ? `\n*Alt Time:* ${data.secondTime}` : '';

        switch (type) {
            case 'REVIEW_SCHEDULED':
                message = `🔴 *Review Scheduled*\n\nStudent: *${studentName}*${batchInfo}\n\nYour review for *${data.taskName}* has been scheduled.\n\n*Date:* ${formattedDate}\n*Primary Time:* ${data.time}${secondTimeInfo}\n\nGood luck!`;
                break;
            case 'REVIEW_REMINDER':
                const revHeader = data.reviewerName ? ` for *${data.reviewerName}*` : '';
                message = `⏰ *Review Reminder${revHeader}*\n\nStudent: *${studentName}*${batchInfo}\n\nFriendly reminder that your review for *${data.taskName}* is scheduled for today at *${data.time}*.\n\nPlease be ready on time. Good luck!`;
                break;
            case 'REVIEWER_ASSIGNED':
                const reviewerName = data.reviewerName || data.reviewerUsername || data.reviewerEmail || 'Mentor';
                const dayName = data.date ? new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long' }) : 'Scheduled Day';
                message = `👤 *Reviewer Assigned*\n\n*${studentName}'s* review scheduled for *${data.time}* *${dayName}* by *${reviewerName}* (Reviewer).`;
                break;
            case 'REVIEW_CANCELLED':
                const cancelledBy = data.cancelledBy ? `\n*Cancelled By:* ${data.cancelledBy}` : '';
                const reason = data.reason ? `\n*Reason:* ${data.reason}` : '';
                message = `❌ *Review Cancelled*\n\nReview for *${studentName}* on *${formattedDate}* at *${data.time}* has been *CANCELLED*.${cancelledBy}${reason}`;
                break;
            case 'REVIEW_COMPLETED':
                const status = data.status ? `\n*Status:* ${data.status}` : '';
                const score = data.score !== undefined ? `\n*Total Score:* ${data.score}/20` : '';
                message = `✅ *Review Completed*\n\nReview for *${studentName}* for *${data.taskName}* has been completed.${status}${score}\n\nWell done!`;
                break;
            case 'REVIEWER_UNASSIGNED':
                message = `👤 *Reviewer Unassigned*\n\nReview for *${studentName}* on *${formattedDate}* at *${data.time}* is now *UNASSIGNED* and available for other reviewers.`;
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
