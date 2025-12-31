# Reviewer CRUD API - Complete Documentation

## Overview
Complete set of admin-only APIs for managing reviewers in the system. All endpoints require admin authentication.

---

## Authentication

All endpoints require:
- **Authorization Header:** `Bearer <admin_jwt_token>`
- **Role:** `admin`

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reviewer` | Get all reviewers (paginated, filterable) |
| POST | `/api/v1/reviewer` | Create new reviewer |
| GET | `/api/v1/reviewer/:id` | Get reviewer by ID |
| PATCH | `/api/v1/reviewer/:id` | Update reviewer |
| PATCH | `/api/v1/reviewer/:id/status` | Update reviewer status |
| DELETE | `/api/v1/reviewer/:id` | Soft delete reviewer |
| DELETE | `/api/v1/reviewer/:id/permanent` | Permanently delete reviewer |

---

## 1. Get All Reviewers

### **GET** `/api/v1/reviewer`

Retrieve a paginated, searchable, and filterable list of reviewers.

#### Query Parameters
```
page=1
limit=10
search=john
sortBy=createdAt
sortOrder=desc
isActive=true
minExperience=5
maxExperience=10
currentCompany=google
teachingProgram=<program_id>
```

#### Example Request
```bash
GET /api/v1/reviewer?page=1&limit=10&isActive=true
Authorization: Bearer <admin_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Reviewers retrieved successfully",
  "data": {
    "reviewers": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 2. Create Reviewer

### **POST** `/api/v1/reviewer`

Create a new reviewer with auto-generated password sent via email.

#### Request Body
```json
{
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "mobileNo": "9876543210",
  "address": "123 Main Street",
  "teachingProgramIds": ["65812...345", "65812...346"],
  "totalExperience": 5,
  "currentCompany": "Tech Solutions Inc."
}
```

#### Required Fields
- `fullName` (string)
- `username` (string)
- At least one of: `email` or `mobileNo`

#### Example Request
```bash
POST /api/v1/reviewer
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fullName": "Jane Smith",
  "username": "janesmith",
  "email": "jane@example.com",
  "totalExperience": 3
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Reviewer created successfully",
  "data": {
    "reviewer": {
      "_id": "6581234567890abcdef99999",
      "fullName": "Jane Smith",
      "username": "janesmith",
      "email": "jane@example.com",
      "teachingPrograms": [],
      "totalExperience": 3,
      "isActive": true,
      "createdAt": "2025-12-28T11:18:42.000Z"
    },
    "generatedPassword": "aB3xY9mK2pQ5",
    "emailSent": true,
    "message": "Credentials have been sent to jane@example.com"
  }
}
```

---

## 3. Get Reviewer by ID

### **GET** `/api/v1/reviewer/:id`

Get detailed information about a specific reviewer.

#### URL Parameters
- `id` (string) - Reviewer's MongoDB ObjectId

#### Example Request
```bash
GET /api/v1/reviewer/6581234567890abcdef99999
Authorization: Bearer <admin_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Reviewer retrieved successfully",
  "data": {
    "reviewer": {
      "_id": "6581234567890abcdef99999",
      "fullName": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "mobileNo": "9876543210",
      "address": "123 Main Street",
      "teachingPrograms": [
        {
          "_id": "6581234567890abcdef12345",
          "name": "React.js",
          "totalWeeks": 12,
          "topics": ["Components", "Hooks", "State Management"]
        }
      ],
      "totalExperience": 5,
      "currentCompany": "Tech Solutions Inc.",
      "isActive": true,
      "createdAt": "2025-12-28T08:59:59.000Z",
      "updatedAt": "2025-12-28T09:15:30.000Z"
    }
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Reviewer not found"
}
```

---

## 4. Update Reviewer

### **PATCH** `/api/v1/reviewer/:id`

Update reviewer information. Password cannot be updated through this endpoint.

#### URL Parameters
- `id` (string) - Reviewer's MongoDB ObjectId

#### Request Body
```json
{
  "fullName": "John Updated Doe",
  "email": "john.updated@example.com",
  "mobileNo": "9876543211",
  "address": "456 New Street",
  "teachingProgramIds": ["65812...345"],
  "totalExperience": 7,
  "currentCompany": "New Company Ltd."
}
```

**Note:** All fields are optional. Only include fields you want to update.

#### Example Request
```bash
PATCH /api/v1/reviewer/6581234567890abcdef99999
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "totalExperience": 7,
  "currentCompany": "Google LLC"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Reviewer updated successfully",
  "data": {
    "reviewer": {
      "_id": "6581234567890abcdef99999",
      "fullName": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "totalExperience": 7,
      "currentCompany": "Google LLC",
      "teachingPrograms": [...],
      "isActive": true,
      "updatedAt": "2025-12-28T11:20:00.000Z"
    }
  }
}
```

#### Validation Errors (400 Bad Request)
```json
{
  "success": false,
  "message": "Username already exists"
}
```

```json
{
  "success": false,
  "message": "Email already exists"
}
```

```json
{
  "success": false,
  "message": "One or more program IDs are invalid"
}
```

---

## 5. Update Reviewer Status

### **PATCH** `/api/v1/reviewer/:id/status`

Activate or deactivate a reviewer account.

#### URL Parameters
- `id` (string) - Reviewer's MongoDB ObjectId

#### Request Body
```json
{
  "isActive": true
}
```

or

```json
{
  "isActive": false
}
```

#### Example Request - Deactivate
```bash
PATCH /api/v1/reviewer/6581234567890abcdef99999/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": false
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Reviewer deactivated successfully",
  "data": {
    "reviewer": {
      "_id": "6581234567890abcdef99999",
      "fullName": "John Doe",
      "username": "johndoe",
      "isActive": false,
      "teachingPrograms": [...],
      "updatedAt": "2025-12-28T11:22:00.000Z"
    }
  }
}
```

#### Example Request - Activate
```bash
PATCH /api/v1/reviewer/6581234567890abcdef99999/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": true
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Reviewer activated successfully",
  "data": {
    "reviewer": { ... }
  }
}
```

---

## 6. Delete Reviewer (Soft Delete)

### **DELETE** `/api/v1/reviewer/:id`

Soft delete a reviewer by setting `isActive` to `false`. The reviewer data remains in the database.

#### URL Parameters
- `id` (string) - Reviewer's MongoDB ObjectId

#### Example Request
```bash
DELETE /api/v1/reviewer/6581234567890abcdef99999
Authorization: Bearer <admin_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Reviewer deleted successfully",
  "data": null
}
```

**Note:** This is a soft delete. The reviewer can be reactivated using the status update endpoint.

---

## 7. Permanently Delete Reviewer

### **DELETE** `/api/v1/reviewer/:id/permanent`

Permanently delete a reviewer from the database. **This action cannot be undone.**

#### URL Parameters
- `id` (string) - Reviewer's MongoDB ObjectId

#### Example Request
```bash
DELETE /api/v1/reviewer/6581234567890abcdef99999/permanent
Authorization: Bearer <admin_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Reviewer permanently deleted",
  "data": null
}
```

**⚠️ Warning:** This permanently removes all reviewer data from the database.

---

## JavaScript Examples

### Using Fetch API

```javascript
const API_BASE = 'http://localhost:5000/api/v1/reviewer';
const adminToken = 'your-admin-jwt-token';

// 1. Get all reviewers
const getAllReviewers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}?${queryString}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return await response.json();
};

// 2. Create reviewer
const createReviewer = async (data) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
};

// 3. Get reviewer by ID
const getReviewer = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return await response.json();
};

// 4. Update reviewer
const updateReviewer = async (id, data) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
};

// 5. Update reviewer status
const updateStatus = async (id, isActive) => {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isActive })
  });
  return await response.json();
};

// 6. Delete reviewer (soft)
const deleteReviewer = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return await response.json();
};

// 7. Permanently delete reviewer
const permanentlyDeleteReviewer = async (id) => {
  const response = await fetch(`${API_BASE}/${id}/permanent`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return await response.json();
};

// Usage Examples
const examples = async () => {
  // Get active reviewers
  const activeReviewers = await getAllReviewers({ isActive: true });
  
  // Create new reviewer
  const newReviewer = await createReviewer({
    fullName: 'Alice Johnson',
    username: 'alicej',
    email: 'alice@example.com',
    totalExperience: 4
  });
  
  // Get specific reviewer
  const reviewer = await getReviewer(newReviewer.data.reviewer._id);
  
  // Update reviewer
  const updated = await updateReviewer(reviewer.data.reviewer._id, {
    totalExperience: 5,
    currentCompany: 'Amazon'
  });
  
  // Deactivate reviewer
  await updateStatus(reviewer.data.reviewer._id, false);
  
  // Reactivate reviewer
  await updateStatus(reviewer.data.reviewer._id, true);
  
  // Soft delete
  await deleteReviewer(reviewer.data.reviewer._id);
};
```

### Using Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1/reviewer',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// CRUD Operations
const reviewerAPI = {
  // Get all
  getAll: (params) => api.get('/', { params }),
  
  // Create
  create: (data) => api.post('/', data),
  
  // Get by ID
  getById: (id) => api.get(`/${id}`),
  
  // Update
  update: (id, data) => api.patch(`/${id}`, data),
  
  // Update status
  updateStatus: (id, isActive) => api.patch(`/${id}/status`, { isActive }),
  
  // Delete (soft)
  delete: (id) => api.delete(`/${id}`),
  
  // Delete (permanent)
  deletePermanent: (id) => api.delete(`/${id}/permanent`)
};

// Usage
const manageReviewers = async () => {
  try {
    // Get senior reviewers
    const { data } = await reviewerAPI.getAll({ minExperience: 5 });
    console.log('Senior reviewers:', data.data.reviewers);
    
    // Create reviewer
    const created = await reviewerAPI.create({
      fullName: 'Bob Wilson',
      username: 'bobw',
      email: 'bob@example.com'
    });
    console.log('Generated password:', created.data.data.generatedPassword);
    
    // Update reviewer
    await reviewerAPI.update(created.data.data.reviewer._id, {
      totalExperience: 6
    });
    
    // Deactivate
    await reviewerAPI.updateStatus(created.data.data.reviewer._id, false);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};
```

---

## cURL Examples

```bash
# 1. Get all reviewers
curl -X GET 'http://localhost:5000/api/v1/reviewer?page=1&limit=10' \
  -H 'Authorization: Bearer <admin_token>'

# 2. Create reviewer
curl -X POST 'http://localhost:5000/api/v1/reviewer' \
  -H 'Authorization: Bearer <admin_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "fullName": "Test User",
    "username": "testuser",
    "email": "test@example.com",
    "totalExperience": 3
  }'

# 3. Get reviewer by ID
curl -X GET 'http://localhost:5000/api/v1/reviewer/6581234567890abcdef99999' \
  -H 'Authorization: Bearer <admin_token>'

# 4. Update reviewer
curl -X PATCH 'http://localhost:5000/api/v1/reviewer/6581234567890abcdef99999' \
  -H 'Authorization: Bearer <admin_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "totalExperience": 5,
    "currentCompany": "Google"
  }'

# 5. Update status (deactivate)
curl -X PATCH 'http://localhost:5000/api/v1/reviewer/6581234567890abcdef99999/status' \
  -H 'Authorization: Bearer <admin_token>' \
  -H 'Content-Type: application/json' \
  -d '{"isActive": false}'

# 6. Delete reviewer (soft)
curl -X DELETE 'http://localhost:5000/api/v1/reviewer/6581234567890abcdef99999' \
  -H 'Authorization: Bearer <admin_token>'

# 7. Permanently delete
curl -X DELETE 'http://localhost:5000/api/v1/reviewer/6581234567890abcdef99999/permanent' \
  -H 'Authorization: Bearer <admin_token>'
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Username already exists"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "You are not logged in! Please log in to get access."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Reviewer not found"
}
```

---

## Best Practices

### 1. **Status Management**
- Use soft delete (DELETE /:id) for temporary deactivation
- Use status update for toggling active/inactive state
- Use permanent delete only when absolutely necessary

### 2. **Update Operations**
- Only send fields that need to be updated
- Validate data on the frontend before sending
- Handle duplicate username/email errors gracefully

### 3. **Pagination**
- Always use pagination for list endpoints
- Recommended page size: 10-50 items
- Cache frequently accessed pages

### 4. **Security**
- Always verify admin token validity
- Use HTTPS in production
- Log all delete operations for audit trail

---

## Complete Workflow Example

```javascript
// Complete reviewer management workflow
const reviewerWorkflow = async () => {
  // 1. Create a reviewer
  const created = await createReviewer({
    fullName: 'Sarah Williams',
    username: 'sarahw',
    email: 'sarah@example.com',
    teachingProgramIds: ['65812...345'],
    totalExperience: 5,
    currentCompany: 'Tech Corp'
  });
  
  const reviewerId = created.data.reviewer._id;
  console.log('Password:', created.data.generatedPassword);
  
  // 2. Get reviewer details
  const details = await getReviewer(reviewerId);
  console.log('Reviewer:', details.data.reviewer);
  
  // 3. Update reviewer information
  await updateReviewer(reviewerId, {
    totalExperience: 6,
    currentCompany: 'New Tech Corp'
  });
  
  // 4. Temporarily deactivate
  await updateStatus(reviewerId, false);
  
  // 5. Reactivate
  await updateStatus(reviewerId, true);
  
  // 6. Get all active reviewers
  const active = await getAllReviewers({ isActive: true });
  console.log(`Total active: ${active.data.pagination.totalItems}`);
  
  // 7. Soft delete (if needed)
  await deleteReviewer(reviewerId);
  
  // Can still retrieve and reactivate soft-deleted reviewers
};
```

---

## Related Files

- **Service:** `src/services/reviewer.service.js`
- **Controller:** `src/controllers/reviewer/reviewer.controller.js`
- **Routes:** `src/routes/reviewer/reviewer.routes.js`
- **Model:** `src/models/reviewer.model.js`
- **Middleware:** `src/middleware/auth.middleware.js`

---

## Testing Checklist

- [ ] Create reviewer with valid data
- [ ] Create reviewer with invalid data (validation errors)
- [ ] Get all reviewers with pagination
- [ ] Search and filter reviewers
- [ ] Get reviewer by valid ID
- [ ] Get reviewer by invalid ID (404)
- [ ] Update reviewer with valid data
- [ ] Update with duplicate username/email (400)
- [ ] Update status (activate/deactivate)
- [ ] Soft delete reviewer
- [ ] Verify soft-deleted reviewer not in list
- [ ] Permanent delete reviewer
- [ ] All endpoints require admin authentication
- [ ] Non-admin users get 403 error
