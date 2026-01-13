const SibApiV3Sdk = require('sib-api-v3-sdk');
const logger = require('./logger');

// Configure API Client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_PASSWORD; // Verify this maps to your API key in .env

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Send an email via Brevo API
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Text content
 */
const sendEmail = async (options) => {
    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.to = [{ email: options.to }];
        sendSmtpEmail.subject = options.subject;
        sendSmtpEmail.htmlContent = options.html;
        sendSmtpEmail.textContent = options.text;

        // Sender details
        sendSmtpEmail.sender = {
            name: process.env.EMAIL_FROM_NAME || 'MentorBro',
            email: process.env.EMAIL_FROM_ADDRESS || process.env.BREVO_USER // Fallback to user email if from address not set
        };

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        logger.info(`[Brevo API] Email sent to ${options.to}. Message ID: ${data.messageId}`);
        return data;
    } catch (error) {
        logger.error('[Brevo API] Failed to send email:', error);
        throw error;
    }
};

/**
 * Send reviewer credentials email
 */
const sendReviewerCredentialsEmail = async (email, credentials) => {
    const { fullName, username, password, loginUrl } = credentials;
    const subject = 'Your MentorBro Reviewer Account - Login Credentials';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">Welcome to MentorBro!</h1>
          <p style="color: #7f8c8d; font-size: 16px;">Your Reviewer Account Has Been Created</p>
        </div>
        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;"><strong>Hello ${fullName},</strong></p>
          <p style="color: #555; line-height: 1.6; margin: 0;">
            An administrator has created a reviewer account for you on the MentorBro platform. Below are your login credentials:
          </p>
        </div>
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0;">
          <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📧 Your Login Credentials</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #555; font-weight: bold; width: 120px;">Username:</td>
              <td style="padding: 10px 0; color: #2c3e50; font-family: 'Courier New', monospace; font-size: 16px; background-color: #f8f9fa; padding: 8px 12px; border-radius: 4px;">${username}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #555; font-weight: bold;">Password:</td>
              <td style="padding: 10px 0; color: #2c3e50; font-family: 'Courier New', monospace; font-size: 16px; background-color: #f8f9fa; padding: 8px 12px; border-radius: 4px;">${password}</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 25px 0;">
          <p style="color: #0c5460; margin: 0; font-size: 14px;"><strong>⚠️ Important Security Notice:</strong><br>Please change your password after your first login.</p>
        </div>
        ${loginUrl ? `<div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">🔐 Login to Your Account</a>
        </div>` : ''}
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #7f8c8d; margin: 0; font-size: 14px;">Best regards,<br><strong style="color: #2c3e50;">The MentorBro Team</strong></p>
        </div>
      </div>
    </div>
  `;

    const text = `Welcome to MentorBro!\n\nHello ${fullName},\n\nAn administrator has created a reviewer account for you.\nUsername: ${username}\nPassword: ${password}\n\n${loginUrl ? `Login URL: ${loginUrl}\n` : ''}Please change your password after logging in.`;

    return sendEmail({ to: email, subject, html, text });
};

module.exports = {
    sendReviewerCredentialsEmail,
    sendEmail
};
