# Reviewer Verification Status API

## Summary
Created a new API endpoint to check if the current logged-in reviewer is verified. This is useful for frontend routing logic to determine which page to show based on authentication and verification status.

## API Endpoint

### Check Verification Status
```
GET /api/v1/reviewer/verification-status
```

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "status": "success",
  "message": "Verification status retrieved successfully",
  "data": {
    "isVerified": false,
    "isActive": true,
    "username": "john_doe",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

## Frontend Routing Logic

### Recommended Flow

```
User visits app
    ↓
Check if JWT token exists in localStorage
    ↓
    ├─→ No Token → Redirect to Login Page
    │
    └─→ Has Token → Call /api/v1/reviewer/verification-status
            ↓
            ├─→ isVerified: true → Go to Dashboard/Home
            │
            ├─→ isVerified: false → Go to Pending/Verification Page
            │
            └─→ Error (401/403) → Clear token, Go to Login
```

## Implementation Examples

### Angular Route Guard

```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Check if user has token
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.router.navigate(['/login']);
      return of(false);
    }

    // Check verification status
    return this.authService.getVerificationStatus().pipe(
      map(response => {
        const { isVerified, isActive } = response.data;
        
        if (!isActive) {
          // Account is deactivated
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
          return false;
        }
        
        if (!isVerified) {
          // User is logged in but not verified
          this.router.navigate(['/pending-verification']);
          return false;
        }
        
        // User is verified and active
        return true;
      }),
      catchError(error => {
        // Token is invalid or expired
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
```

### Angular Service

```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/v1';

  constructor(private http: HttpClient) {}

  getVerificationStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviewer/verification-status`);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}
```

### App Routing Module

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginModule)
  },
  {
    path: 'pending-verification',
    loadChildren: () => import('./pending/pending.module').then(m => m.PendingModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard] // Protected route
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### App Component (Initial Check)

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  loading = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      this.loading = false;
      return;
    }

    // Check verification status
    this.authService.getVerificationStatus().subscribe({
      next: (response) => {
        const { isVerified, isActive } = response.data;

        if (!isActive) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        } else if (!isVerified) {
          this.router.navigate(['/pending-verification']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        
        this.loading = false;
      },
      error: (error) => {
        // Token invalid or expired
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
        this.loading = false;
      }
    });
  }
}
```

### React Example

```javascript
// useAuth.js (Custom Hook)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        'http://localhost:5000/api/v1/reviewer/verification-status',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { isVerified, isActive } = response.data.data;

      if (!isActive) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (!isVerified) {
        setIsAuthenticated(true);
        setIsVerified(false);
        navigate('/pending-verification');
      } else {
        setIsAuthenticated(true);
        setIsVerified(true);
      }
    } catch (error) {
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return { loading, isAuthenticated, isVerified };
};
```

## Testing with cURL

### Check Verification Status (Authenticated)
```bash
curl -X GET http://localhost:5000/api/v1/reviewer/verification-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Responses

**Verified User:**
```json
{
  "status": "success",
  "message": "Verification status retrieved successfully",
  "data": {
    "isVerified": true,
    "isActive": true,
    "username": "john_doe",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Unverified User:**
```json
{
  "status": "success",
  "message": "Verification status retrieved successfully",
  "data": {
    "isVerified": false,
    "isActive": true,
    "username": "jane_smith",
    "fullName": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

**No Token:**
```json
{
  "status": "error",
  "message": "You are not logged in. Please log in to get access"
}
```

**Invalid Token:**
```json
{
  "status": "error",
  "message": "Invalid token or token expired"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `isVerified` | boolean | Whether the reviewer account is verified by admin |
| `isActive` | boolean | Whether the reviewer account is active |
| `username` | string | Reviewer's username |
| `fullName` | string | Reviewer's full name |
| `email` | string | Reviewer's email address (null if not provided) |

## Complete Flow Diagram

```
┌─────────────────────────────────────────┐
│        User Opens Application           │
└───────────────┬─────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ Has JWT Token?│
        └───────┬───────┘
                │
        ┌───────┴────────┐
        │                │
       NO               YES
        │                │
        ▼                ▼
  ┌──────────┐   ┌──────────────────┐
  │  Login   │   │ Call /verification│
  │   Page   │   │  -status API     │
  └──────────┘   └────────┬──────────┘
                          │
                  ┌───────┴────────┐
                  │  API Response  │
                  └────────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    isActive           isActive            Error
    = false           = true &             (401)
        │             isVerified            │
        ▼                 │                 ▼
  ┌──────────┐           │           ┌──────────┐
  │  Clear   │           │           │  Clear   │
  │  Token   │           │           │  Token   │
  │  → Login │           │           │  → Login │
  └──────────┘           │           └──────────┘
                         │
            ┌────────────┴───────────┐
            │                        │
       isVerified              isVerified
       = true                  = false
            │                        │
            ▼                        ▼
      ┌──────────┐            ┌──────────┐
      │Dashboard │            │ Pending  │
      │   Page   │            │   Page   │
      └──────────┘            └──────────┘
```

## Benefits

✅ **Lightweight** - Only returns essential fields  
✅ **Secure** - Requires authentication  
✅ **Fast** - Single DB query with select fields  
✅ **Purpose-specific** - Designed for routing logic  
✅ **Complete** - Returns all needed status information
