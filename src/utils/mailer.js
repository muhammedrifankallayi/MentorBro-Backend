const SibApiV3Sdk = require('sib-api-v3-sdk');
const logger = require('./logger');
const SystemConfig = require('../models/systemConfig.model');

/**
 * Configure Brevo SDK and get current configuration
 * @returns {Promise<Object>} Brevo configuration
 */
const getBrevoConfig = async () => {
  try {
    const dbConfig = await SystemConfig.findOne({ isActive: true });

    const config = {
      apiKey: dbConfig?.brevo?.apiKey || process.env.BREVO_API_KEY,
      senderEmail: dbConfig?.brevo?.senderEmail || process.env.EMAIL_FROM_ADDRESS || 'noreply@yourmentorbro.com',
      senderName: dbConfig?.brevo?.senderName || process.env.EMAIL_FROM_NAME || 'MentorBro'
    };

    if (!config.apiKey) {
      logger.error('Brevo API key is missing (check .env or System Config)');
      throw new Error('Email service not configured. Please set BREVO_API_KEY.');
    }

    // Configure the global SDK instance
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = config.apiKey;

    return config;
  } catch (error) {
    logger.error('Error configuring Brevo:', error.message);
    throw error;
  }
};

/**
 * Send an email using Brevo Transactional Email API (SDK)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.toName - Recipient name (optional)
 * @returns {Promise<Object>} Result with success status
 */
const sendEmail = async (options) => {
  try {
    const brevoConfig = await getBrevoConfig();

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;

    if (options.text) {
      sendSmtpEmail.textContent = options.text;
    }

    sendSmtpEmail.sender = {
      name: brevoConfig.senderName,
      email: brevoConfig.senderEmail
    };

    sendSmtpEmail.to = [{
      email: options.to,
      name: options.toName || options.to.split('@')[0]
    }];

    logger.info(`Sending email to ${options.to} from ${brevoConfig.senderEmail}...`);

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    logger.info(`Email sent successfully to ${options.to}. Message ID: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    // Log the detailed error from Brevo API if available
    const errorDetail = error.response ? error.response.text : error.message;
    logger.error(`Failed to send email via Brevo: ${errorDetail}`);
    throw new Error(`Email sending failed: ${errorDetail}`);
  }
};

/**
 * Send a welcome email to new users
 */
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to MentorBro!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #4a90e2;">Welcome to MentorBro, ${name}!</h1>
      <p style="line-height: 1.6;">
        We're excited to have you on board. Your account has been successfully created.
      </p>
      <p style="line-height: 1.6;">
        If you have any questions, feel free to reach out to our support team.
      </p>
      <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        <p style="color: #999; font-size: 12px;">
          Best regards,<br>
          <strong>The MentorBro Team</strong>
        </p>
      </div>
    </div>
  `;
  const text = `Welcome to MentorBro, ${name}! We're excited to have you on board.`;

  return sendEmail({ to: email, toName: name, subject, html, text });
};

/**
 * Send a password reset email
 */
const sendPasswordResetEmail = async (email, resetToken, resetURL) => {
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p style="line-height: 1.6;">
        You requested a password reset for your MentorBro account. Click the button below to set a new password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetURL}" 
           style="background-color: #4a90e2; color: white; padding: 14px 28px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Reset My Password
        </a>
      </div>
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        Or copy and paste this link into your browser:
      </p>
      <p style="font-size: 13px; color: #4a90e2; word-break: break-all; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        ${resetURL}
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        This link will expire in 10 minutes. If you didn't request a password reset, 
        please ignore this email.
      </p>
    </div>
  `;
  const text = `You requested a password reset. Visit this URL to reset your password: ${resetURL}\n\nThis link will expire in 10 minutes.`;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send a verification email
 */
const sendVerificationEmail = async (email, verificationToken, verificationURL) => {
  const subject = 'Verify Your Email Address';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1>Verify Your Email Address</h1>
      <p style="line-height: 1.6;">
        Thank you for signing up! Please verify your email address by clicking the button below:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationURL}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="word-break: break-all; font-size: 12px; color: #999;">
        ${verificationURL}
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This link will expire in 24 hours.
      </p>
    </div>
  `;
  const text = `Thank you for signing up! Verify your email by visiting: ${verificationURL}`;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send a notification email
 */
const sendNotificationEmail = async (email, subject, message) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #333;">${subject}</h2>
      <p style="line-height: 1.6;">${message}</p>
      <p style="margin-top: 30px; color: #999; font-size: 12px;">
        Best regards,<br>The MentorBro Team
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text: message });
};

/**
 * Send reviewer credentials email
 */
const sendReviewerCredentialsEmail = async (email, credentials) => {
  const { fullName, username, password, loginUrl } = credentials;
  const subject = 'Your MentorBro Reviewer Account Credentials';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2>Welcome to MentorBro, ${fullName}!</h2>
      <p>An administrator has created a reviewer account for you. Here are your login credentials:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
      </div>

      ${loginUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Login to Your Account
        </a>
      </div>` : ''}

      <p style="color: #d9534f; font-weight: bold;">Important: Please change your password after your first login.</p>
    </div>
  `;

  return sendEmail({ to: email, toName: fullName, subject, html, text: `Welcome! Username: ${username}, Password: ${password}` });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendNotificationEmail,
  sendReviewerCredentialsEmail,
};
