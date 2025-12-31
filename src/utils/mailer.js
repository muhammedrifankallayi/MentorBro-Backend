const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Create and configure nodemailer transporter
 * @returns {nodemailer.Transporter} Configured transporter instance
 */
const createTransporter = () => {
  // Validate required environment variables
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT) {
    logger.error('Email configuration is missing required environment variables');
    throw new Error('Email configuration is incomplete');
  }

  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  // Optional: Add additional SMTP options
  if (process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'false') {
    config.tls = {
      rejectUnauthorized: false,
    };
  }

  const transporter = nodemailer.createTransport(config);

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Email transporter verification failed:', error);
    } else {
      logger.info('Email server is ready to send messages');
    }
  });

  return transporter;
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @param {string} options.from - Sender email (optional, uses default from env)
 * @param {Array} options.attachments - Array of attachment objects (optional)
 * @returns {Promise} Promise that resolves with email info
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: options.from || `${process.env.EMAIL_FROM_NAME || 'MentorBro'} <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send a welcome email to new users
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise}
 */
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to MentorBro!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Welcome to MentorBro, ${name}!</h1>
      <p style="color: #666; line-height: 1.6;">
        We're excited to have you on board. Your account has been successfully created.
      </p>
      <p style="color: #666; line-height: 1.6;">
        If you have any questions, feel free to reach out to our support team.
      </p>
      <p style="color: #666;">
        Best regards,<br>
        The MentorBro Team
      </p>
    </div>
  `;
  const text = `Welcome to MentorBro, ${name}! We're excited to have you on board.`;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send a password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} resetURL - Password reset URL
 * @returns {Promise}
 */
const sendPasswordResetEmail = async (email, resetToken, resetURL) => {
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Password Reset Request</h1>
      <p style="color: #666; line-height: 1.6;">
        You requested a password reset. Click the button below to reset your password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetURL}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; line-height: 1.6;">
        Or copy and paste this link into your browser:
      </p>
      <p style="color: #007bff; word-break: break-all;">
        ${resetURL}
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
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
 * @param {string} email - Recipient email
 * @param {string} verificationToken - Email verification token
 * @param {string} verificationURL - Email verification URL
 * @returns {Promise}
 */
const sendVerificationEmail = async (email, verificationToken, verificationURL) => {
  const subject = 'Verify Your Email Address';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Verify Your Email Address</h1>
      <p style="color: #666; line-height: 1.6;">
        Thank you for signing up! Please verify your email address by clicking the button below:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationURL}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="color: #666; line-height: 1.6;">
        Or copy and paste this link into your browser:
      </p>
      <p style="color: #007bff; word-break: break-all;">
        ${verificationURL}
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This link will expire in 24 hours. If you didn't create an account, 
        please ignore this email.
      </p>
    </div>
  `;
  const text = `Thank you for signing up! Verify your email by visiting: ${verificationURL}\n\nThis link will expire in 24 hours.`;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send a notification email
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise}
 */
const sendNotificationEmail = async (email, subject, message) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">${subject}</h1>
      <p style="color: #666; line-height: 1.6;">
        ${message}
      </p>
      <p style="color: #666;">
        Best regards,<br>
        The MentorBro Team
      </p>
    </div>
  `;
  const text = message;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send reviewer credentials email
 * @param {string} email - Recipient email
 * @param {Object} credentials - Reviewer credentials
 * @param {string} credentials.fullName - Reviewer's full name
 * @param {string} credentials.username - Reviewer's username
 * @param {string} credentials.password - Auto-generated password
 * @param {string} credentials.loginUrl - Login URL (optional)
 * @returns {Promise}
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
          <p style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">
            <strong>Hello ${fullName},</strong>
          </p>
          <p style="color: #555; line-height: 1.6; margin: 0;">
            An administrator has created a reviewer account for you on the MentorBro platform. 
            Below are your login credentials:
          </p>
        </div>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0;">
          <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
            📧 Your Login Credentials
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #555; font-weight: bold; width: 120px;">Username:</td>
              <td style="padding: 10px 0; color: #2c3e50; font-family: 'Courier New', monospace; font-size: 16px; background-color: #f8f9fa; padding: 8px 12px; border-radius: 4px;">
                ${username}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #555; font-weight: bold;">Password:</td>
              <td style="padding: 10px 0; color: #2c3e50; font-family: 'Courier New', monospace; font-size: 16px; background-color: #f8f9fa; padding: 8px 12px; border-radius: 4px;">
                ${password}
              </td>
            </tr>
          </table>
        </div>

        <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 25px 0;">
          <p style="color: #0c5460; margin: 0; font-size: 14px;">
            <strong>⚠️ Important Security Notice:</strong><br>
            Please change your password after your first login for security purposes.
          </p>
        </div>

        ${loginUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background-color: #007bff; color: white; padding: 14px 32px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;
                    font-weight: bold; font-size: 16px;">
            🔐 Login to Your Account
          </a>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center;">
          Or copy and paste this link: <span style="color: #007bff; word-break: break-all;">${loginUrl}</span>
        </p>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1;">
          <h3 style="color: #2c3e50; font-size: 16px; margin-bottom: 10px;">What's Next?</h3>
          <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
            <li>Login using the credentials provided above</li>
            <li>Complete your profile information</li>
            <li>Change your password in settings</li>
            <li>Start reviewing and managing tasks</li>
          </ul>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 25px;">
          <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
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
Welcome to MentorBro!

Hello ${fullName},

An administrator has created a reviewer account for you. Below are your login credentials:

Username: ${username}
Password: ${password}

${loginUrl ? `Login URL: ${loginUrl}\n` : ''}
IMPORTANT: Please change your password after your first login for security purposes.

What's Next?
- Login using the credentials provided above
- Complete your profile information
- Change your password in settings
- Start reviewing and managing tasks

If you have any questions, please contact our support team.

Best regards,
The MentorBro Team
  `.trim();

  return sendEmail({ to: email, subject, html, text });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendNotificationEmail,
  sendReviewerCredentialsEmail,
  createTransporter,
};
