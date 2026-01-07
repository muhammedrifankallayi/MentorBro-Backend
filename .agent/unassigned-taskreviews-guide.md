# Get Unassigned Task Reviews - API Guide

## Summary
Enhanced the existing `GET /api/v1/task-review` API to support filtering for unassigned task reviews (reviews without a reviewer).

## What Changed?

### Modified Service
**File**: `src/services/taskReview.service.js`
- Enhanced the `getAll()` function to handle special reviewer filter values
- When `reviewer` query parameter is `'null'`, `'unassigned'`, or empty string, it filters for task reviews where reviewer is not assigned

## Usage

### Get All Unassigned Task Reviews

You can now use the **existing API endpoint** with special query parameters:

#### Option 1: Using 'unassigned'
```http
GET /api/v1/task-review?reviewer=unassigned
```

#### Option 2: Using 'null'
```http
GET /api/v1/task-review?reviewer=null
```

#### Option 3: Using empty string
```http
GET /api/v1/task-review?reviewer=
```

### API Response
```json
{
  "status": "success",
  "message": "Task reviews retrieved successfully",
  "data": [
    {
      "_id": "...",
      "student": { ... },
      "program": { ... },
      "programTask": { ... },
      "reviewer": null,  // ← No reviewer assigned
      "scheduledDate": "2026-01-05T10:00:00.000Z",
      "scheduledTime": "10:00 AM",
      "isReviewCompleted": false,
      "isCancelled": false,
      // ... other fields
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

## Additional Filtering

You can combine the unassigned filter with other parameters:

### Unassigned reviews for a specific student
```http
GET /api/v1/task-review?reviewer=unassigned&student=STUDENT_ID
```

### Unassigned reviews for a specific program
```http
GET /api/v1/task-review?reviewer=unassigned&program=PROGRAM_ID
```

### Unassigned and not completed
```http
GET /api/v1/task-review?reviewer=unassigned&isReviewCompleted=false
```

### With Pagination
```http
GET /api/v1/task-review?reviewer=unassigned&page=1&limit=20
```

### With Sorting
```http
GET /api/v1/task-review?reviewer=unassigned&sortBy=scheduledDate&sortOrder=asc
```

## Example Usage in Frontend

### Using Fetch
```javascript
// Get all unassigned task reviews
fetch('/api/v1/task-review?reviewer=unassigned')
  .then(response => response.json())
  .then(data => {
    console.log('Unassigned reviews:', data.data);
  });
```

### Using Axios
```javascript
// Get all unassigned task reviews
const response = await axios.get('/api/v1/task-review', {
  params: {
    reviewer: 'unassigned',
    page: 1,
    limit: 20,
    sortBy: 'scheduledDate',
    sortOrder: 'asc'
  }
});

console.log('Unassigned reviews:', response.data.data);
```

### Angular Service Example
```typescript
export class TaskReviewService {
  
  // Get unassigned task reviews
  getUnassignedReviews(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/task-review`, {
      params: {
        reviewer: 'unassigned',
        ...params
      }
    });
  }

  // Get unassigned reviews for a specific program
  getUnassignedByProgram(programId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/task-review`, {
      params: {
        reviewer: 'unassigned',
        program: programId,
        isReviewCompleted: 'false'
      }
    });
  }
}
```

## Complete Query Parameters Reference

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `reviewer` | string | Filter by reviewer ID, or use 'unassigned'/'null' for unassigned | `unassigned` |
| `student` | string | Filter by student ID | `65abc123...` |
| `program` | string | Filter by program ID | `65def456...` |
| `isReviewCompleted` | string | Filter by completion status | `true` or `false` |
| `reviewStatus` | string | Filter by review status | `very_good`, `good`, `need_improvements`, `failed` |
| `page` | number | Page number for pagination | `1` |
| `limit` | number | Items per page | `10` |
| `sortBy` | string | Field to sort by | `scheduledDate`, `createdAt` |
| `sortOrder` | string | Sort direction | `asc` or `desc` |

## Testing with cURL

### Get unassigned reviews
```bash
curl -X GET "http://localhost:3000/api/v1/task-review?reviewer=unassigned"
```

### Get unassigned reviews for a specific student
```bash
curl -X GET "http://localhost:3000/api/v1/task-review?reviewer=unassigned&student=STUDENT_ID"
```

### Get unassigned, not completed, sorted by date
```bash
curl -X GET "http://localhost:3000/api/v1/task-review?reviewer=unassigned&isReviewCompleted=false&sortBy=scheduledDate&sortOrder=asc"
```

## Advantages of This Approach

✅ **No new endpoint needed** - Uses existing API  
✅ **Backward compatible** - Doesn't break existing functionality  
✅ **Flexible filtering** - Can combine with other filters  
✅ **Consistent API design** - Follows same pattern as other endpoints  
✅ **Efficient** - Single database query with proper indexing
