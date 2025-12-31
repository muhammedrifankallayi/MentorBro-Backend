# JWT Expiration Error Handling

## Overview
The authentication middleware now sends a specific error code when JWT tokens expire or are invalid.

## Error Codes

### JWT_EXPIRED
- **HTTP Status**: 401 Unauthorized
- **Message**: "Your token has expired! Please log in again."
- **When**: The JWT token has expired
- **Example Response**:
```json
{
  "success": false,
  "status": "fail",
  "message": "Your token has expired! Please log in again.",
  "errorCode": "JWT_EXPIRED"
}
```

### JWT_INVALID
- **HTTP Status**: 401 Unauthorized
- **Message**: "Invalid token! Please log in again."
- **When**: The JWT token is malformed or invalid
- **Example Response**:
```json
{
  "success": false,
  "status": "fail",
  "message": "Invalid token! Please log in again.",
  "errorCode": "JWT_INVALID"
}
```

## Frontend Handling

You can now check for the `errorCode` in your frontend to handle different authentication errors:

```javascript
// Example axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.errorCode === 'JWT_EXPIRED') {
      // Handle expired token - redirect to login
      console.log('Token expired, redirecting to login...');
      window.location.href = '/login';
    } else if (error.response?.data?.errorCode === 'JWT_INVALID') {
      // Handle invalid token
      console.log('Invalid token, clearing auth and redirecting...');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Implementation Details

### Files Modified:
1. **src/utils/appError.js**: Added optional `errorCode` parameter
2. **src/middleware/auth.middleware.js**: Added try-catch around JWT verification
3. **src/middleware/error.middleware.js**: Updated error response handlers to include `errorCode`

### Changes:
- `AppError` constructor now accepts a third optional parameter for error codes
- JWT verification wrapped in try-catch to handle `TokenExpiredError` and `JsonWebTokenError`
- Error responses now include `errorCode` field when present
