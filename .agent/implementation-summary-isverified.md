# Reviewer Verification Status Implementation

## Summary
Added `isVerified` field to the Reviewer model and created an API endpoint to update its status.

## Changes Made

### 1. Model Changes
**File**: `src/models/reviewer.model.js`
- Added `isVerified` field to the reviewer schema
  - Type: Boolean
  - Default: false
  - Location: After `isActive` field

### 2. Service Layer
**File**: `src/services/reviewer.service.js`
- Created new function: `updateReviewerVerificationStatus(reviewerId, isVerified)`
  - Updates the verification status of a reviewer
  - Returns the updated reviewer with populated teaching programs
  - Validates that the reviewer exists
  - Exported in module.exports

### 3. Controller Layer
**File**: `src/controllers/reviewer/reviewer.controller.js`
- Created new controller: `updateReviewerVerificationStatus`
  - Validates that `isVerified` field is provided in request body
  - Calls the service method
  - Returns appropriate success message
  - Route documentation: `PATCH /api/v1/reviewer/:id/verify`
  - Access: Private/Admin only
  - Exported in module.exports

### 4. Routes
**File**: `src/routes/reviewer/reviewer.routes.js`
- Added new route: `PATCH /:id/verify`
  - Protected route (requires authentication)
  - Restricted to admin role only
  - Calls `updateReviewerVerificationStatus` controller

## API Usage

### Endpoint
```
PATCH /api/v1/reviewer/:id/verify
```

### Authentication
- Requires valid JWT token
- Requires admin role

### Request Body
```json
{
  "isVerified": true  // or false
}
```

### Success Response
```json
{
  "status": "success",
  "message": "Reviewer verified successfully",
  "data": {
    "reviewer": {
      "_id": "...",
      "fullName": "...",
      "username": "...",
      "isVerified": true,
      // ... other reviewer fields
    }
  }
}
```

### Error Responses
- **400 Bad Request**: If `isVerified` field is not provided
- **401 Unauthorized**: If not authenticated
- **403 Forbidden**: If user is not an admin
- **404 Not Found**: If reviewer with given ID doesn't exist

## Testing Examples

### Verify a Reviewer
```bash
curl -X PATCH http://localhost:3000/api/v1/reviewer/REVIEWER_ID/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'
```

### Unverify a Reviewer
```bash
curl -X PATCH http://localhost:3000/api/v1/reviewer/REVIEWER_ID/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isVerified": false}'
```

## Database Impact
- The `isVerified` field is now part of the Reviewer collection
- Default value is `false` for new reviewers
- Existing reviewers will not have this field until the first GET operation (will be added automatically by Mongoose with default value)
