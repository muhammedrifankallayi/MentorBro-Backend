const { sendEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

/**
 * Mailer Service for business-specific email operations
 */
class MailerService {
    /**
     * Send email to student when a reviewer is assigned to their review
     * @param {Object} studentData - Student information
     * @param {Object} reviewerData - Reviewer information
     * @param {Object} reviewData - Review details
     * @returns {Promise<Object>}
     */
    async sendReviewerAssignedEmail(studentData, reviewerData, reviewData) {
        try {
            const { email, name: studentName } = studentData;
            const { fullName: reviewerName, username: reviewerUsername } = reviewerData;
            const { scheduledDate, scheduledTime, programTask } = reviewData;

            // Format the date nicely
            const formattedDate = new Date(scheduledDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const subject = '📅 Your Review Has Been Scheduled - MentorBro';

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c3e50; margin-bottom: 10px;">Review Scheduled!</h1>
                            <p style="color: #7f8c8d; font-size: 16px;">Your task review has been assigned to a reviewer</p>
                        </div>
                        
                        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 6px; margin: 20px 0;">
                            <p style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">
                                <strong>Hello ${studentName},</strong>
                            </p>
                            <p style="color: #555; line-height: 1.6; margin: 0;">
                                Great news! A reviewer has been assigned to your upcoming task review.
                            </p>
                        </div>

                        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0;">
                            <h3 style="color: #155724; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
                                📋 Review Details
                            </h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; color: #555; font-weight: bold; width: 140px;">Task:</td>
                                    <td style="padding: 10px 0; color: #2c3e50;">${programTask?.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #555; font-weight: bold;">Date:</td>
                                    <td style="padding: 10px 0; color: #2c3e50;">${formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #555; font-weight: bold;">Time:</td>
                                    <td style="padding: 10px 0; color: #2c3e50;">${scheduledTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #555; font-weight: bold;">Reviewer:</td>
                                    <td style="padding: 10px 0; color: #2c3e50;">${reviewerName || reviewerUsername}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 25px 0;">
                            <p style="color: #0c5460; margin: 0; font-size: 14px;">
                                <strong>💡 Tip:</strong> Make sure you are well-prepared for the review. 
                                Be ready to demonstrate your understanding of both theory and practical aspects.
                            </p>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                            <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
                                Best regards,<br>
                                <strong style="color: #2c3e50;">The MentorBro Team</strong>
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `;

            const text = `
Hello ${studentName},

Great news! Your task review has been scheduled.

Review Details:
- Task: ${programTask?.name || 'N/A'}
- Date: ${formattedDate}
- Time: ${scheduledTime}
- Reviewer: ${reviewerName || reviewerUsername}

Make sure you are well-prepared for the review!

Best regards,
The MentorBro Team
            `.trim();

            const result = await sendEmail({ to: email, subject, html, text });
            logger.info(`Reviewer assigned email sent to student: ${email}`);
            return { success: true, ...result };

        } catch (error) {
            logger.error(`Failed to send reviewer assigned email: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send a custom email from admin to any recipient
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} content - Email content (can be HTML or plain text)
     * @returns {Promise<Object>}
     */
    async sendCustomEmail(to, subject, content) {
        try {
            if (!to || !subject || !content) {
                return { success: false, error: 'Missing required fields (to, subject, content)' };
            }

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="color: #555; line-height: 1.8;">
                            ${content}
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                            <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
                                Best regards,<br>
                                <strong style="color: #2c3e50;">The MentorBro Team</strong>
                            </p>
                        </div>
                    </div>
                </div>
            `;

            // Strip HTML for plain text version
            const text = content.replace(/<[^>]*>/g, '');

            const result = await sendEmail({ to, subject, html, text });
            logger.info(`Custom email sent to: ${to}`);
            return { success: true, ...result };

        } catch (error) {
            logger.error(`Failed to send custom email: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new MailerService();
