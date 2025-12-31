# Add Reviewer by Admin - Feature Documentation

## Overview
This feature allows administrators to create reviewer accounts without requiring a password. The system automatically generates a secure password and sends the credentials to the reviewer via email.

---

## API Endpoint

### **POST** `/api/v1/reviewer/add`

**Access:** Admin only (requires authentication and admin role)

**Authentication:** 
- Requires valid JWT token in Authorization header or cookie
- User must have role: `admin`

---

## Request

### Headers
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

### Body
```json
{
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "mobileNo": "9876543210",
  "address": "123 Main Street, City, State, 12345",
  "teachingPrograms": [
    "6581234567890abcdef12345",
    "6581234567890abcdef12346"
  ],
  "totalExperience": 5,
  "currentCompany": "Tech Solutions Inc."
}
```

### Required Fields
- `fullName` (string) - Reviewer's full name
- `username` (string) - Unique username for login
- **At least one of:**
  - `email` (string) - For sending credentials
  - `mobileNo` (string) - 10-digit mobile number

### Optional Fields
- `address` (string) - Physical address
- `teachingPrograms` (array of ObjectIds) - Program IDs from Program model
- `totalExperience` (number) - Years of experience (0-50)
- `currentCompany` (string) - Current employer name

---

## Response

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Reviewer created successfully",
  "data": {
    "reviewer": {
      "_id": "6581234567890abcdef99999",
      "fullName": "John Doe",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "mobileNo": "9876543210",
      "address": "123 Main Street, City, State, 12345",
      "teachingPrograms": [
        {
          "_id": "6581234567890abcdef12345",
          "name": "React.js",
          "totalWeeks": 12
        },
        {
          "_id": "6581234567890abcdef12346",
          "name": "Node.js",
          "totalWeeks": 10
        }
      ],
      "totalExperience": 5,
      "currentCompany": "Tech Solutions Inc.",
      "isActive": true,
      "createdAt": "2025-12-28T08:59:59.000Z",
      "updatedAt": "2025-12-28T08:59:59.000Z"
    },
    "generatedPassword": "aB3xY9mK2pQ5",
    "emailSent": true,
    "message": "Credentials have been sent to john.doe@example.com"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Required Fields
```json
{
  "success": false,
  "message": "Please provide fullName and username"
}
```

#### 400 Bad Request - Username Already Exists
```json
{
  "success": false,
  "message": "Username already exists"
}
```

#### 400 Bad Request - Email Already Exists
```json
{
  "success": false,
  "message": "Email already exists"
}
```

#### 401 Unauthorized - Not Logged In
```json
{
  "success": false,
  "message": "You are not logged in! Please log in to get access."
}
```

#### 403 Forbidden - Not Admin
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

---

## How It Works

### 1. **Password Generation**
- System automatically generates a secure 12-character alphanumeric password
- Password includes uppercase, lowercase, and numbers (no special symbols for simplicity)
- Example: `aB3xY9mK2pQ5`

### 2. **Reviewer Creation**
- Validates all required fields
- Checks for duplicate username, email, and mobile number
- Creates reviewer account with auto-generated password
- Password is automatically hashed before saving

### 3. **Email Notification**
- **If email is provided:**
  - Sends professional email with credentials
  - Includes username and password
  - Includes login URL (if FRONTEND_URL is configured)
  - Provides security reminder to change password
  
- **If email is NOT provided:**
  - Returns password in API response
  - Admin must manually share credentials with reviewer

### 4. **Response**
- Returns created reviewer details
- Returns generated password (for admin reference)
- Indicates whether email was sent
- Populated teaching programs (if any)

---

## Email Template

The reviewer receives a professional email containing:

- **Welcome Message** - Greeting with reviewer's name
- **Login Credentials** - Username and password in highlighted box
- **Security Notice** - Reminder to change password after first login
- **Login Button** - Direct link to login page (if configured)
- **Getting Started** - Step-by-step guidance
- **Support Information** - Contact details for help

### Email Preview:
```
Subject: Your MentorBro Reviewer Account - Login Credentials

Welcome to MentorBro!
Your Reviewer Account Has Been Created

Hello John Doe,

An administrator has created a reviewer account for you on the MentorBro platform.

📧 Your Login Credentials
Username: johndoe
Password: aB3xY9mK2pQ5

⚠️ Important Security Notice:
Please change your password after your first login for security purposes.

[Login to Your Account Button]

What's Next?
• Login using the credentials provided above
• Complete your profile information
• Change your password in settings
• Start reviewing and managing tasks
```

---

## Configuration

### Required Environment Variables

```env
# Email Configuration (in .env file)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM_NAME=MentorBro
EMAIL_FROM_ADDRESS=noreply@mentorbro.com

# Optional: Frontend URL for login link
FRONTEND_URL=http://localhost:3000
```

---

## Usage Examples

### Example 1: Create Reviewer with Email
```bash
curl -X POST http://localhost:5000/api/v1/reviewer/add \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "username": "janesmith",
    "email": "jane@example.com",
    "totalExperience": 3
  }'
```

### Example 2: Create Reviewer with Programs
```bash
curl -X POST http://localhost:5000/api/v1/reviewer/add \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Mike Johnson",
    "username": "mikej",
    "email": "mike@example.com",
    "teachingPrograms": ["65812...12345", "65812...12346"],
    "totalExperience": 7,
    "currentCompany": "Google"
  }'
```

### Example 3: Using JavaScript/Fetch
```javascript
const createReviewer = async (reviewerData, adminToken) => {
  const response = await fetch('http://localhost:5000/api/v1/reviewer/add', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reviewerData)
  });

  return await response.json();
};

// Usage
const newReviewer = {
  fullName: 'Sarah Williams',
  username: 'sarahw',
  email: 'sarah@example.com',
  totalExperience: 5
};

const result = await createReviewer(newReviewer, adminToken);
console.log('Generated Password:', result.data.generatedPassword);
```

---

## Security Considerations

### 1. **Admin-Only Access**
- Route is protected by `protect` middleware (authentication)
- Route is restricted by `restrictTo('admin')` middleware (authorization)
- Only users with admin role can create reviewers

### 2. **Password Security**
- Passwords are auto-generated with secure random algorithm
- 12-character minimum length
- Mix of uppercase, lowercase, and numbers
- Passwords are hashed before storing in database

### 3. **Email Security**
- Credentials sent only if email is provided
- Email contains reminder to change password
- Password visible to admin in response for manual sharing if needed

### 4. **Validation**
- Prevents duplicate usernames
- Prevents duplicate emails
- Prevents duplicate mobile numbers
- Validates all required fields

---

## Best Practices

### 1. **For Admins**
- ✅ Always use HTTPS in production
- ✅ Save generated password securely if email fails
- ✅ Verify email addresses before creating accounts
- ✅ Inform reviewer to check spam folder if email not received

### 2. **For Reviewers**
- ✅ Change password immediately after first login
- ✅ Use a strong, unique password
- ✅ Keep credentials confidential
- ✅ Report any suspicious activity

### 3. **For Development**
- ✅ Test email sending in development environment
- ✅ Use proper email service (not Gmail for production)
- ✅ Configure FRONTEND_URL for correct login links
- ✅ Monitor email delivery logs

---

## Troubleshooting

### Email Not Sent
**Problem:** Reviewer created but email not received

**Solutions:**
1. Check email configuration in `.env`
2. Verify EMAIL_USER and EMAIL_PASSWORD are correct
3. Check spam/junk folder
4. Review server logs for email errors
5. Use generated password from API response

### Invalid Program IDs
**Problem:** Error when adding teaching programs

**Solutions:**
1. Verify program IDs exist in database
2. Use valid MongoDB ObjectIds
3. Check Program model for available programs

### Permission Denied
**Problem:** 403 Forbidden error

**Solutions:**
1. Verify user is logged in as admin
2. Check JWT token is valid
3. Ensure user role is 'admin' in token

---

## Related Files

- **Service:** `src/services/reviewer.service.js` - `createReviewerByAdmin()`
- **Controller:** `src/controllers/reviewer/reviewer.controller.js` - `addReviewerByAdmin()`
- **Routes:** `src/routes/reviewer/reviewer.routes.js` - POST `/add`
- **Mailer:** `src/utils/mailer.js` - `sendReviewerCredentialsEmail()`
- **Password Generator:** `src/utils/passwordGenerator.js` - `generateSimplePassword()`

---

## Testing

### Manual Testing
1. Login as admin
2. Get admin JWT token
3. Send POST request to `/api/v1/reviewer/add`
4. Verify email is received
5. Try logging in with generated credentials
6. Change password

### Automated Testing Example
```javascript
describe('Add Reviewer by Admin', () => {
  it('should create reviewer and send email', async () => {
    const res = await request(app)
      .post('/api/v1/reviewer/add')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Test Reviewer',
        username: 'testreviewer',
        email: 'test@example.com'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.generatedPassword).toBeDefined();
    expect(res.body.data.emailSent).toBe(true);
  });
});
```
