# NodeMailer Configuration - Usage Guide

## Setup

### 1. Environment Variables
Add the following to your `.env` file:

```env
# Email Configuration (NodeMailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM_NAME=MentorBro
EMAIL_FROM_ADDRESS=noreply@mentorbro.com
```

### 2. Gmail App Password (if using Gmail)
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification
4. Generate an App Password
5. Use the generated password in `EMAIL_PASSWORD`

### 3. Other Email Providers
- **Outlook/Office365**: `smtp.office365.com` (Port: 587)
- **Yahoo**: `smtp.mail.yahoo.com` (Port: 587)
- **SendGrid**: `smtp.sendgrid.net` (Port: 587)
- **Mailgun**: `smtp.mailgun.org` (Port: 587)

## Available Functions

### 1. Send Generic Email
```javascript
const { mailer } = require('../utils');

await mailer.sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  text: 'Plain text content',
  html: '<h1>HTML content</h1>',
  // Optional fields:
  from: 'custom@example.com',
  attachments: [
    {
      filename: 'document.pdf',
      path: '/path/to/document.pdf'
    }
  ]
});
```

### 2. Send Welcome Email
```javascript
const { mailer } = require('../utils');

await mailer.sendWelcomeEmail('newuser@example.com', 'John Doe');
```

### 3. Send Password Reset Email
```javascript
const { mailer } = require('../utils');

const resetToken = 'generated-reset-token';
const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

await mailer.sendPasswordResetEmail('user@example.com', resetToken, resetURL);
```

### 4. Send Email Verification
```javascript
const { mailer } = require('../utils');

const verificationToken = 'generated-verification-token';
const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

await mailer.sendVerificationEmail('user@example.com', verificationToken, verificationURL);
```

### 5. Send Notification Email
```javascript
const { mailer } = require('../utils');

await mailer.sendNotificationEmail(
  'user@example.com',
  'Task Assigned',
  'You have been assigned a new task. Please check your dashboard.'
);
```

## Example: Using in a Service/Controller

### In Authentication Service:
```javascript
const { mailer, catchAsync, AppError } = require('../utils');
const User = require('../models/user.model');

// Registration
const register = catchAsync(async (req, res) => {
  const { email, username, password } = req.body;

  // Create user
  const user = await User.create({ email, username, password });

  // Send welcome email (non-blocking)
  mailer.sendWelcomeEmail(email, username).catch(err => {
    console.error('Failed to send welcome email:', err);
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user }
  });
});

// Forgot Password
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No user found with this email', 404);
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await mailer.sendPasswordResetEmail(email, resetToken, resetURL);
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError('Failed to send email. Please try again later.', 500);
  }
});
```

## Email Templates

You can customize HTML email templates in `src/utils/mailer.js`:

```javascript
const sendCustomEmail = async (email, data) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">${data.title}</h1>
      <p style="color: #666; line-height: 1.6;">
        ${data.message}
      </p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: data.subject,
    html,
    text: data.message
  });
};
```

## Error Handling

The mailer functions throw errors if sending fails. Always wrap in try-catch or use catchAsync:

```javascript
// Option 1: Try-catch
try {
  await mailer.sendEmail({ to, subject, html, text });
} catch (error) {
  console.error('Email sending failed:', error);
  // Handle error appropriately
}

// Option 2: Non-blocking (fire and forget)
mailer.sendEmail({ to, subject, html, text })
  .catch(err => console.error('Email failed:', err));

// Option 3: Using catchAsync utility
const sendWelcome = catchAsync(async (req, res) => {
  await mailer.sendWelcomeEmail(email, name);
  res.status(200).json({ success: true });
});
```

## Testing

To test your email configuration:

```javascript
const { mailer } = require('./utils');

// Test email
mailer.sendEmail({
  to: 'your-test-email@example.com',
  subject: 'Test Email',
  text: 'This is a test email',
  html: '<h1>This is a test email</h1>'
})
  .then(() => console.log('Test email sent successfully'))
  .catch(err => console.error('Test email failed:', err));
```

## Security Best Practices

1. **Never commit `.env`** - Keep your credentials secure
2. **Use App-Specific Passwords** - Don't use your actual email password
3. **Rate Limiting** - Limit the number of emails per user/IP
4. **Validate Email Addresses** - Always validate before sending
5. **Use HTTPS** - For any links in emails
6. **Sanitize User Input** - Prevent injection in email content

## Troubleshooting

### Common Issues:

1. **"Invalid login" error**
   - Make sure you're using an app-specific password (not your regular password)
   - Check if 2FA is enabled (required for Gmail)

2. **Connection timeout**
   - Check firewall settings
   - Verify EMAIL_HOST and EMAIL_PORT
   - Try EMAIL_SECURE=true with port 465

3. **Email not received**
   - Check spam folder
   - Verify recipient email
   - Check email service logs

4. **Self-signed certificate errors**
   - Set EMAIL_TLS_REJECT_UNAUTHORIZED=false (development only)
