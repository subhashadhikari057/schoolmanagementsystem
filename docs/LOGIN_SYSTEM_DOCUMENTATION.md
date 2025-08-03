# 🔐 Login System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [Components](#components)
5. [API Endpoints](#api-endpoints)
6. [Security Features](#security-features)
7. [Usage Guide](#usage-guide)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The School Management System (SMS) implements a professional-grade authentication system with industry-standard security practices, role-based access control (RBAC), and seamless user experience.

### Key Features
- ✅ **JWT-based Authentication** with access/refresh token rotation
- ✅ **Role-Based Access Control (RBAC)** with hierarchical permissions
- ✅ **Session Management** with automatic token refresh
- ✅ **Security Headers** and CORS protection
- ✅ **Audit Logging** for all authentication events
- ✅ **Multi-factor Authentication** ready architecture
- ✅ **Password Security** with Argon2 hashing
- ✅ **Rate Limiting** and brute force protection

---

## Architecture

### Frontend Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  Components Layer                                               │
│  ├── LoginForm.tsx (React Hook Form + Zod validation)          │
│  ├── AuthGuard.tsx (Route protection)                          │
│  └── Dropdown.tsx (User profile & logout)                      │
├─────────────────────────────────────────────────────────────────┤
│  State Management                                               │
│  ├── auth.store.ts (Zustand - Global auth state)              │
│  ├── use-auth.ts (Custom hook)                                 │
│  └── use-auth-redirect.ts (Role-based redirects)              │
├─────────────────────────────────────────────────────────────────┤
│  API Layer                                                      │
│  ├── api-client.ts (Axios with interceptors)                   │
│  ├── auth.ts (Token management utilities)                      │
│  └── api.ts (Error handling utilities)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (NestJS)                          │
├─────────────────────────────────────────────────────────────────┤
│  Controllers Layer                                              │
│  └── auth.controller.ts (HTTP endpoints)                       │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                  │
│  ├── auth.service.ts (Business logic)                          │
│  ├── password-reset.service.ts (Password management)           │
│  └── audit.service.ts (Security logging)                       │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                           │
│  ├── prisma.service.ts (Database access)                       │
│  ├── jwt.strategy.ts (JWT validation)                          │
│  └── guards/ (Authentication & authorization)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### 1. Login Process
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant A as Audit

    U->>F: Enter credentials
    F->>F: Client-side validation
    F->>B: POST /auth/login
    B->>DB: Validate user & password
    DB-->>B: User data
    B->>B: Generate JWT tokens
    B->>A: Log successful login
    B-->>F: Access & refresh tokens
    F->>F: Store tokens & user data
    F->>F: Redirect to role dashboard
```

### 2. Token Refresh Process
```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    F->>F: Detect token expiry
    F->>B: POST /auth/refresh
    B->>B: Validate refresh token
    B->>DB: Check token validity
    DB-->>B: Token status
    B->>B: Generate new tokens
    B-->>F: New access & refresh tokens
    F->>F: Update stored tokens
```

### 3. Logout Process
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant A as Audit

    U->>F: Click logout
    F->>F: Clear local storage immediately
    F->>F: Redirect to login page
    F->>B: POST /auth/logout (background)
    B->>A: Log logout event
    B->>B: Invalidate tokens
```

---

## Components

### Frontend Components

#### 1. LoginForm Component
**Location**: `frontend/src/components/organisms/auth/LoginForm.tsx`

**Purpose**: Main login form with validation and error handling

**Features**:
- React Hook Form integration
- Zod schema validation
- Real-time error feedback
- Loading states
- Remember me functionality

**Props**:
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}
```

**Usage**:
```tsx
<LoginForm 
  onSuccess={() => console.log('Login successful')}
  redirectTo="/dashboard"
/>
```

#### 2. AuthGuard Component
**Location**: `frontend/src/components/layout/auth-guard.tsx`

**Purpose**: Protect routes and enforce role-based access

**Features**:
- Route protection
- Role-based access control
- Automatic redirects
- Loading states

**Props**:
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}
```

**Usage**:
```tsx
<AuthGuard requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
  <AdminDashboard />
</AuthGuard>
```

### Backend Components

#### 1. Auth Controller
**Location**: `backend/src/modules/auth/infrastructure/auth.controller.ts`

**Purpose**: Handle HTTP authentication requests

**Endpoints**:
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get user profile
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset confirmation

#### 2. Auth Service
**Location**: `backend/src/modules/auth/application/auth.service.ts`

**Purpose**: Business logic for authentication

**Methods**:
- `login(credentials)` - Authenticate user
- `refreshToken(token)` - Generate new tokens
- `logout(userId)` - Invalidate user session
- `validateUser(token)` - Validate JWT token

---

## API Endpoints

### 1. Login Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "identifier": "user@example.com",
  "password": "password123",
  "remember_me": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900,
    "token_type": "Bearer",
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT",
      "status": "ACTIVE"
    }
  },
  "message": "Login successful"
}
```

### 2. Token Refresh Endpoint
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 3. User Profile Endpoint
```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Security Features

### 1. Token Security
- **JWT Tokens**: Stateless authentication
- **Token Rotation**: Refresh tokens are rotated on each use
- **Short Expiry**: Access tokens expire in 15 minutes
- **Secure Storage**: HTTP-only cookies for sensitive tokens

### 2. Password Security
- **Argon2 Hashing**: Industry-standard password hashing
- **Salt**: Unique salt for each password
- **Complexity Requirements**: Enforced password policies
- **Breach Detection**: Password breach checking

### 3. Session Security
- **Session Tracking**: Track active user sessions
- **Concurrent Limits**: Limit concurrent sessions per user
- **Session Invalidation**: Automatic cleanup of expired sessions
- **Device Tracking**: Track login devices and locations

### 4. Request Security
- **Rate Limiting**: Prevent brute force attacks
- **CORS Protection**: Cross-origin request filtering
- **CSRF Protection**: Cross-site request forgery prevention
- **Input Validation**: Comprehensive input sanitization

---

## Usage Guide

### For Developers

#### 1. Adding Authentication to a Component
```tsx
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  if (!hasRole(UserRole.ADMIN)) {
    return <div>Access denied</div>;
  }

  return <div>Welcome, {user?.firstName}!</div>;
}
```

#### 2. Making Authenticated API Calls
```typescript
import { apiClient } from '@/lib/api-client';

// API client automatically handles authentication
const response = await apiClient.get('/protected-endpoint');
```

#### 3. Protecting Routes
```tsx
import { AuthGuard } from '@/components/layout/auth-guard';

function AdminPage() {
  return (
    <AuthGuard requiredRole={UserRole.ADMIN}>
      <AdminDashboard />
    </AuthGuard>
  );
}
```

### For Users

#### 1. Logging In
1. Navigate to `/auth/login`
2. Enter your email and password
3. Optionally check "Remember me"
4. Click "Sign In"
5. You'll be redirected to your role-specific dashboard

#### 2. Password Reset
1. Click "Forgot Password?" on login page
2. Enter your email address
3. Check your email for reset instructions
4. Follow the link to set a new password

#### 3. Logging Out
1. Click your profile picture in the top-right corner
2. Select "Logout" from the dropdown
3. You'll be immediately logged out and redirected

---

## Testing

### Test Credentials
```
Super Admin:
Email: superadmin@school.com
Password: SuperAdmin@123

Admin:
Email: admin@school.com
Password: Admin@123

Teacher:
Email: teacher@school.com
Password: Teacher@123

Student:
Email: student@school.com
Password: Student@123
```

### Running Tests
```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test

# E2E tests
npm run test:e2e
```

### Test Scenarios
1. **Valid Login**: Test with correct credentials
2. **Invalid Login**: Test with wrong credentials
3. **Token Refresh**: Test automatic token renewal
4. **Role Access**: Test role-based route protection
5. **Logout**: Test complete session cleanup
6. **Password Reset**: Test password reset flow

---

## Troubleshooting

### Common Issues

#### 1. "Invalid credentials" Error
**Cause**: Wrong email or password
**Solution**: 
- Verify credentials are correct
- Check if account is active
- Try password reset if needed

#### 2. Token Expired Errors
**Cause**: Session expired or invalid tokens
**Solution**:
- Automatic refresh should handle this
- If persistent, clear browser storage and login again

#### 3. Redirect Loops
**Cause**: Misconfigured route protection
**Solution**:
- Check AuthGuard configuration
- Verify role permissions
- Clear browser cache/storage

#### 4. CORS Errors
**Cause**: Cross-origin request blocked
**Solution**:
- Verify backend CORS configuration
- Check frontend API base URL
- Ensure proper headers are sent

### Debug Mode
Enable debug logging:
```typescript
// In your component
console.log('Auth state:', useAuth());
```

### Performance Issues
If login is slow:
1. Check network requests in DevTools
2. Verify database query performance
3. Check for unnecessary re-renders
4. Monitor API response times

---

## Maintenance

### Regular Tasks
1. **Token Cleanup**: Remove expired tokens from database
2. **Audit Review**: Review authentication logs
3. **Security Updates**: Keep dependencies updated
4. **Performance Monitoring**: Monitor login times

### Security Checklist
- [ ] Regular password policy reviews
- [ ] Token expiry optimization
- [ ] Audit log analysis
- [ ] Dependency vulnerability scans
- [ ] Rate limiting effectiveness
- [ ] Session management review

---

## Conclusion

The SMS login system provides enterprise-grade security with excellent user experience. It follows industry best practices and is designed for scalability and maintainability.

For questions or issues, please refer to the troubleshooting section or contact the development team.

---

*Last updated: [Current Date]*
*Version: 1.0.0*