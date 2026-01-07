# Reviewer fullName Field - Optional Implementation

## Summary
Made the `fullName` field optional in the Reviewer model. If not provided during registration or creation, it will automatically be set to the username value.

## Changes Made

### 1. Reviewer Model (`src/models/reviewer.model.js`)

#### Removed Constraints
- **Removed** `required: true` validation
- **Removed** `unique: true` constraint
- Kept `maxlength` validation (50 characters)

#### Added Pre-Save Hook
```javascript
// Set fullName to username if not provided
reviewerSchema.pre('save', function (next) {
    if (!this.fullName && this.username) {
        this.fullName = this.username;
    }
    next();
});
```

This hook runs before saving and automatically populates `fullName` with `username` if `fullName` is empty.

### 2. Reviewer Service (`src/services/reviewer.service.js`)

#### Updated `createReviewerByAdmin` Function
- Changed validation: Only `username` is required now (removed `fullName` requirement)
- Updated error message: "Please provide username" instead of "Please provide fullName and username"
- Email sending now uses `reviewer.fullName || username` to ensure it always has a value

## Behavior

### Registration (`POST /api/v1/reviewer/register`)

**Before:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```
❌ Would fail - fullName required

**Now:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```
✅ Works! fullName will be set to "john_doe"

### Admin Creation (`POST /api/v1/reviewer`)

**Option 1: With fullName**
```json
{
  "fullName": "John Doe",
  "username": "john_doe",
  "email": "john@example.com"
}
```
✅ fullName = "John Doe"

**Option 2: Without fullName**
```json
{
  "username": "john_doe",
  "email": "john@example.com"
}
```
✅ fullName = "john_doe" (auto-populated)

**Option 3: Empty fullName**
```json
{
  "fullName": "",
  "username": "john_doe",
  "email": "john@example.com"
}
```
✅ fullName = "john_doe" (auto-populated because empty string is falsy)

## Database Impact

### Existing Reviewers
- No migration needed
- Existing reviewers keep their current fullName values
- Pre-save hook only runs on new documents or when documents are updated

### New Reviewers
- Can be created without fullName
- fullName will automatically be set to username value
- No validation errors

## API Examples

### Register Reviewer (No fullName needed)
```bash
curl -X POST http://localhost:5000/api/v1/reviewer/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_reviewer",
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Reviewer registered successfully",
  "data": {
    "reviewer": {
      "_id": "...",
      "fullName": "jane_reviewer",  // ← Auto-populated
      "username": "jane_reviewer",
      "isActive": true,
      "isVerified": false,
      // ...
    },
    "token": "..."
  }
}
```

### Create Reviewer as Admin (Optional fullName)
```bash
curl -X POST http://localhost:5000/api/v1/reviewer \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_reviewer",
    "email": "reviewer@example.com",
    "totalExperience": 5
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Reviewer created successfully",
  "data": {
    "reviewer": {
      "_id": "...",
      "fullName": "new_reviewer",  // ← Auto-populated
      "username": "new_reviewer",
      "email": "reviewer@example.com",
      // ...
    },
    "generatedPassword": "xyz123...",
    "emailSent": true
  }
}
```

## Advantages

✅ **Simpler Registration** - Only username and password required  
✅ **Backward Compatible** - Existing data/APIs still work  
✅ **Auto-Population** - No manual intervention needed  
✅ **Flexible** - Can still provide fullName if desired  
✅ **No Unique Constraint** - Multiple reviewers can have same fullName (e.g., "Admin")

## Updated Field Requirements

| Field | Required | Default Behavior |
|-------|----------|------------------|
| `username` | ✅ Yes | Must be unique |
| `password` | ✅ Yes | - |
| `fullName` | ❌ No | Auto-set to username if not provided |
| `email` | ❌ No* | Must be unique (sparse) |
| `mobileNo` | ❌ No* | Must be unique (sparse) |

\* At least one of `email` or `mobileNo` is required for admin creation
