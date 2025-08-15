# JWT Token Expiration Handling

This document describes the implementation of JWT token expiration handling in the School Management System frontend application.

## Overview

The token expiration handling system automatically detects when a user's authentication token has expired and redirects them to the login page with an appropriate message. This ensures a smooth user experience and prevents users from encountering cryptic error messages or broken functionality due to expired authentication.

## Components

The token expiration handling system consists of the following components:

1. **Token Expiry Handler** - Core utility for detecting and handling token expiration
2. **API Interceptor** - Middleware for intercepting API responses and detecting authentication errors
3. **JWT Helper** - Utility for parsing and validating JWT tokens
4. **Token Expiry Hook** - React hook for using token expiration handling in components
5. **Session Guard** - React component for protecting routes that require authentication
6. **API Error Boundary** - React component for catching and handling API errors
7. **Auth Provider** - React context provider for authentication state

## Implementation Details

### Token Expiry Detection

Token expiration is detected through multiple mechanisms:

1. **HTTP 401 Responses** - When an API request returns a 401 Unauthorized status code
2. **JWT Token Parsing** - By decoding and checking the expiration time in the JWT token
3. **Error Message Analysis** - By analyzing error messages for common token expiration phrases

### Token Expiry Handling

When a token expiration is detected, the following actions are taken:

1. The user's authentication state is cleared
2. The current URL path is stored for potential redirect after login
3. A user-friendly message is stored for display on the login page
4. The user is redirected to the login page

### Session Verification

The system periodically verifies the user's session to proactively detect token expiration:

1. A background check runs at configurable intervals (default: 5 minutes)
2. The check verifies the token expiration time without making unnecessary API calls
3. If the token is about to expire, the user is redirected to the login page

## Usage

### In Protected Routes

Protected routes should use the `SessionGuard` component to ensure authentication:

```tsx
import SessionGuard from '@/components/molecules/auth/SessionGuard';

export default function ProtectedPage() {
  return (
    <SessionGuard>
      <YourComponent />
    </SessionGuard>
  );
}
```

### In Components

Components can use the `useTokenExpiryHandler` hook to handle token expiration:

```tsx
import { useTokenExpiryHandler } from '@/hooks/useTokenExpiryHandler';

export default function YourComponent() {
  // Initialize token expiry handler
  useTokenExpiryHandler();

  // Rest of your component
  return <div>Your component content</div>;
}
```

### API Error Handling

Components can use the `ApiErrorBoundary` component to catch and handle API errors:

```tsx
import ApiErrorBoundary from '@/components/molecules/error/ApiErrorBoundary';

export default function YourComponent() {
  return (
    <ApiErrorBoundary>
      <YourComponentContent />
    </ApiErrorBoundary>
  );
}
```

## Testing

A test utility is provided for testing token expiration handling:

```typescript
// In browser console
window.testTokenExpiry.simulateTokenExpiration();
window.testTokenExpiry.simulateSessionExpiry('Custom message');
window.testTokenExpiry.simulateApiError(401, 'Unauthorized');
```

## Files

- `frontend/src/utils/token-expiry-handler.ts` - Core token expiry handling utility
- `frontend/src/api/client/api-interceptor.ts` - API interceptor for error handling
- `frontend/src/utils/jwt-helper.ts` - JWT token parsing and validation
- `frontend/src/hooks/useTokenExpiryHandler.ts` - React hook for token expiry handling
- `frontend/src/components/molecules/auth/SessionGuard.tsx` - Authentication guard component
- `frontend/src/components/molecules/error/ApiErrorBoundary.tsx` - API error boundary component
- `frontend/src/context/AuthProvider.tsx` - Authentication context provider
- `frontend/src/utils/test-token-expiry.ts` - Test utility for token expiration
