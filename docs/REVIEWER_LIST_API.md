# Reviewer List API - Documentation

## Overview
This API endpoint allows administrators to retrieve a paginated, searchable, and filterable list of all reviewers in the system.

---

## API Endpoint

### **GET** `/api/v1/reviewer/list`

**Access:** Admin only (requires authentication and admin role)

**Authentication:** 
- Requires valid JWT token in Authorization header or cookie
- User must have role: `admin`

---

## Query Parameters

All query parameters are optional and can be combined for advanced filtering.

### Pagination
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number to retrieve |
| `limit` | number | `10` | Number of items per page |

### Search
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | `''` | Search across fullName, username, email, and mobileNo |

### Sorting
| Parameter | Type | Default | Options | Description |
|-----------|------|---------|---------|-------------|
| `sortBy` | string | `createdAt` | `createdAt`, `fullName`, `username`, `totalExperience`, `updatedAt` | Field to sort by |
| `sortOrder` | string | `desc` | `asc`, `desc` | Sort order (ascending/descending) |

### Filtering
| Parameter | Type | Description |
|-----------|------|-------------|
| `isActive` | boolean | Filter by active status (`true` or `false`) |
| `minExperience` | number | Minimum years of experience |
| `maxExperience` | number | Maximum years of experience |
| `currentCompany` | string | Filter by company name (case-insensitive, partial match) |
| `teachingProgram` | string | Filter by teaching program ID (ObjectId) |

---

## Request Examples

### Example 1: Basic Request (Default Pagination)
```bash
GET /api/v1/reviewer/list
Authorization: Bearer <admin_jwt_token>
```

### Example 2: With Pagination
```bash
GET /api/v1/reviewer/list?page=2&limit=20
Authorization: Bearer <admin_jwt_token>
```

### Example 3: Search for Reviewers
```bash
GET /api/v1/reviewer/list?search=john
Authorization: Bearer <admin_jwt_token>
```

### Example 4: Filter by Experience Range
```bash
GET /api/v1/reviewer/list?minExperience=3&maxExperience=10
Authorization: Bearer <admin_jwt_token>
```

### Example 5: Filter by Company
```bash
GET /api/v1/reviewer/list?currentCompany=google
Authorization: Bearer <admin_jwt_token>
```

### Example 6: Filter by Teaching Program
```bash
GET /api/v1/reviewer/list?teachingProgram=6581234567890abcdef12345
Authorization: Bearer <admin_jwt_token>
```

### Example 7: Combined Filters with Sorting
```bash
GET /api/v1/reviewer/list?page=1&limit=15&search=john&isActive=true&minExperience=5&sortBy=fullName&sortOrder=asc
Authorization: Bearer <admin_jwt_token>
```

### Example 8: Get Only Active Reviewers
```bash
GET /api/v1/reviewer/list?isActive=true
Authorization: Bearer <admin_jwt_token>
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Reviewers retrieved successfully",
  "data": {
    "reviewers": [
      {
        "_id": "6581234567890abcdef99999",
        "fullName": "John Doe",
        "username": "johndoe",
        "email": "john@example.com",
        "mobileNo": "9876543210",
        "address": "123 Main Street, City",
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
        "updatedAt": "2025-12-28T09:15:30.000Z",
        "id": "6581234567890abcdef99999"
      },
      {
        "_id": "6581234567890abcdef99998",
        "fullName": "Jane Smith",
        "username": "janesmith",
        "email": "jane@example.com",
        "mobileNo": "9876543211",
        "address": "456 Oak Avenue, Town",
        "teachingPrograms": [
          {
            "_id": "6581234567890abcdef12347",
            "name": "MongoDB",
            "totalWeeks": 8
          }
        ],
        "totalExperience": 3,
        "currentCompany": "Startup Inc.",
        "isActive": true,
        "createdAt": "2025-12-27T10:30:00.000Z",
        "updatedAt": "2025-12-27T10:30:00.000Z",
        "id": "6581234567890abcdef99998"
      }
    ],
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

### Empty Result Response (200 OK)
```json
{
  "success": true,
  "message": "Reviewers retrieved successfully",
  "data": {
    "reviewers": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalItems": 0,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### Error Responses

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

## Response Fields

### Reviewer Object Fields
| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique reviewer ID |
| `fullName` | string | Reviewer's full name |
| `username` | string | Unique username |
| `email` | string | Email address |
| `mobileNo` | string | 10-digit mobile number |
| `address` | string | Physical address |
| `teachingPrograms` | array | Array of populated program objects |
| `totalExperience` | number | Years of experience |
| `currentCompany` | string | Current employer |
| `isActive` | boolean | Active status |
| `createdAt` | datetime | Account creation timestamp |
| `updatedAt` | datetime | Last update timestamp |
| `id` | string | Virtual ID field |

### Pagination Object Fields
| Field | Type | Description |
|-------|------|-------------|
| `currentPage` | number | Current page number |
| `totalPages` | number | Total number of pages |
| `totalItems` | number | Total count of reviewers matching filters |
| `itemsPerPage` | number | Items per page (limit) |
| `hasNextPage` | boolean | Whether there is a next page |
| `hasPrevPage` | boolean | Whether there is a previous page |

---

## Usage Examples

### JavaScript/Fetch Example
```javascript
const getReviewers = async (queryParams = {}, adminToken) => {
  // Build query string
  const params = new URLSearchParams(queryParams);
  const url = `http://localhost:5000/api/v1/reviewer/list?${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};

// Usage Examples

// 1. Get all reviewers (default pagination)
const allReviewers = await getReviewers({}, adminToken);

// 2. Search for reviewers
const searchResults = await getReviewers({ search: 'john' }, adminToken);

// 3. Get active reviewers with experience >= 5 years
const seniorReviewers = await getReviewers({
  isActive: true,
  minExperience: 5,
  sortBy: 'totalExperience',
  sortOrder: 'desc'
}, adminToken);

// 4. Paginated results
const page2 = await getReviewers({
  page: 2,
  limit: 20
}, adminToken);

// 5. Filter by company
const googleReviewers = await getReviewers({
  currentCompany: 'google'
}, adminToken);
```

### Axios Example
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// Get reviewers with filters
const getReviewers = async (params) => {
  try {
    const response = await api.get('/reviewer/list', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching reviewers:', error.response.data);
    throw error;
  }
};

// Usage
const reviewers = await getReviewers({
  page: 1,
  limit: 10,
  search: 'john',
  isActive: true
});

console.log(`Found ${reviewers.data.pagination.totalItems} reviewers`);
console.log('Reviewers:', reviewers.data.reviewers);
```

### cURL Examples
```bash
# Basic request
curl -X GET \
  'http://localhost:5000/api/v1/reviewer/list' \
  -H 'Authorization: Bearer <admin_token>'

# With search
curl -X GET \
  'http://localhost:5000/api/v1/reviewer/list?search=john' \
  -H 'Authorization: Bearer <admin_token>'

# With multiple filters
curl -X GET \
  'http://localhost:5000/api/v1/reviewer/list?page=1&limit=20&isActive=true&minExperience=5&sortBy=fullName&sortOrder=asc' \
  -H 'Authorization: Bearer <admin_token>'

# Filter by company
curl -X GET \
  'http://localhost:5000/api/v1/reviewer/list?currentCompany=google' \
  -H 'Authorization: Bearer <admin_token>'
```

---

## Search Functionality

The `search` parameter performs a case-insensitive search across the following fields:
- `fullName`
- `username`
- `email`
- `mobileNo`

**Example:**
```
?search=john
```
Will match:
- fullName: "John Doe", "Johnny Smith"
- username: "johndoe", "john123"
- email: "john@example.com"
- mobileNo: "9876543210" (if it contains "john" - unlikely)

---

## Sorting Options

Available `sortBy` fields:
- `createdAt` (default) - Creation date
- `updatedAt` - Last update date
- `fullName` - Alphabetical by name
- `username` - Alphabetical by username
- `totalExperience` - By experience years

**Examples:**
```
?sortBy=fullName&sortOrder=asc    # A to Z
?sortBy=totalExperience&sortOrder=desc  # Most experienced first
?sortBy=createdAt&sortOrder=asc   # Oldest first
```

---

## Filter Combinations

### Example Use Cases

#### 1. Find Senior React Developers
```
?teachingProgram=<react_program_id>&minExperience=5&sortBy=totalExperience&sortOrder=desc
```

#### 2. Find New Reviewers (Last 30 days)
```javascript
// Need to implement date filtering for this
// Current implementation doesn't support date range filtering
```

#### 3. Find Reviewers from Specific Companies
```
?currentCompany=google&isActive=true&page=1&limit=50
```

#### 4. Search and Filter Combined
```
?search=john&isActive=true&minExperience=3&currentCompany=tech
```

---

## Best Practices

### 1. **Pagination**
- Always use pagination for large datasets
- Recommended `limit`: 10-50 (depending on UI)
- Max `limit`: Consider adding validation (e.g., max 100)

### 2. **Performance**
- Use specific filters instead of large searches
- Index frequently queried fields (already indexed: username, email, mobileNo)
- Avoid very large `limit` values

### 3. **Caching**
- Consider caching results for frequently accessed pages
- Cache key should include all query parameters

### 4. **Error Handling**
```javascript
try {
  const result = await getReviewers(params, token);
  if (result.success) {
    // Handle data
  }
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
  } else if (error.response?.status === 403) {
    // Show permission denied message
  } else {
    // Show generic error
  }
}
```

---

## Related Endpoints

- **GET** `/api/v1/reviewer/me` - Get current reviewer info
- **POST** `/api/v1/reviewer/add` - Add new reviewer (admin)
- **POST** `/api/v1/reviewer/login` - Reviewer login
- **POST** `/api/v1/reviewer/register` - Reviewer registration

---

## Future Enhancements

Potential additions to consider:
1. ✅ Date range filtering (createdAt, updatedAt)
2. ✅ Export to CSV/Excel
3. ✅ Bulk operations (activate/deactivate multiple)
4. ✅ Advanced program filtering (AND/OR logic)
5. ✅ Statistics endpoint (count by company, experience distribution)
6. ✅ Field selection (`?fields=fullName,email,totalExperience`)

---

## Testing

### Manual Testing Checklist
- [ ] Default pagination works
- [ ] Search returns correct results
- [ ] Filters work individually
- [ ] Combined filters work
- [ ] Sorting works (asc/desc)
- [ ] Pagination info is correct
- [ ] Empty results handled
- [ ] Authentication required
- [ ] Admin role required
- [ ] Teaching programs populated

### Automated Testing Example
```javascript
describe('GET /reviewer/list', () => {
  it('should return paginated reviewers', async () => {
    const res = await request(app)
      .get('/api/v1/reviewer/list?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reviewers).toBeInstanceOf(Array);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });

  it('should filter by experience', async () => {
    const res = await request(app)
      .get('/api/v1/reviewer/list?minExperience=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.reviewers.forEach(reviewer => {
      expect(reviewer.totalExperience).toBeGreaterThanOrEqual(5);
    });
  });

  it('should require admin role', async () => {
    const res = await request(app)
      .get('/api/v1/reviewer/list')
      .set('Authorization', `Bearer ${nonAdminToken}`);

    expect(res.status).toBe(403);
  });
});
```

---

## Related Files

- **Service:** `src/services/reviewer.service.js` - `getAllReviewers()`
- **Controller:** `src/controllers/reviewer/reviewer.controller.js` - `getAllReviewers()`
- **Routes:** `src/routes/reviewer/reviewer.routes.js` - GET `/list`
- **Model:** `src/models/reviewer.model.js`
