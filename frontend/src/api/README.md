# Frontend API Structure

This directory contains all API-related code for the frontend application, organized in a clean and maintainable structure.

## 🏗️ Directory Structure

```
src/api/
├── client/           # HTTP client and request handling
│   ├── http-client.ts
│   └── index.ts
├── services/         # API service classes
│   ├── auth.service.ts
│   └── index.ts
├── types/           # TypeScript type definitions
│   ├── auth.ts
│   ├── common.ts
│   └── index.ts
└── index.ts         # Main API exports
```

## 🔧 Configuration

### Backend URL

The frontend is configured to connect to the backend running on port **8080**.

- **Development**: `http://localhost:8080`
- **Environment Variable**: `NEXT_PUBLIC_API_URL`

### Environment Setup

Create a `.env.local` file in the frontend root with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🔐 Authentication

### Login Implementation

The login page (`/auth/login`) is fully connected to the backend authentication API:

- **Endpoint**: `POST /api/auth/login`
- **Service**: `authService.login()`
- **Hook**: `useAuth()`
- **Types**: `LoginRequest`, `LoginResponse`

### Authentication Flow

1. User enters credentials on login page
2. Frontend calls `POST /api/auth/login` with credentials
3. Backend validates and returns JWT tokens
4. Tokens are stored in localStorage
5. User is redirected to dashboard

### Token Management

- **Access Token**: Short-lived JWT for API requests
- **Refresh Token**: Long-lived token for refreshing access
- **Auto-refresh**: Implemented in `useAuth` hook
- **Storage**: localStorage (client-side)

## 🛠️ Usage Examples

### Using Authentication Service

```typescript
import { authService } from '@/api/services/auth.service';

// Login
const response = await authService.login({
  identifier: 'user@example.com',
  password: 'password123',
});

// Get current user
const user = await authService.getCurrentUser();
```

### Using Auth Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, user, login, logout, isLoading, error } = useAuth();

  // Component logic...
}
```

### Making API Requests

```typescript
import { httpClient } from '@/api/client';

// Authenticated request
const response = await httpClient.get(
  '/protected-endpoint',
  {},
  {
    requiresAuth: true,
  },
);

// Public request
const publicData = await httpClient.get(
  '/public-endpoint',
  {},
  {
    requiresAuth: false,
  },
);
```

## 📝 Type Safety

All API interactions are fully typed using TypeScript interfaces that match the backend API contract:

- **Auth Types**: `LoginRequest`, `LoginResponse`, `MeResponse`, etc.
- **Common Types**: `ApiResponse`, `ApiError`, `PaginatedResponse`
- **Error Handling**: Structured error responses with proper typing

## 🚀 Next Steps

### For Additional Features

1. Create new service files in `services/` directory
2. Add corresponding types in `types/` directory
3. Export from respective `index.ts` files
4. Use the existing `httpClient` for consistent request handling

### For Additional Auth Features

The auth service includes methods for:

- Password reset (not yet connected to UI)
- User registration (not yet connected to UI)
- Password change (not yet connected to UI)

These can be connected to UI components as needed.

## 🔒 Security Notes

- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Access tokens are automatically included in authenticated requests
- Failed authentication automatically redirects to login
- Refresh token rotation is implemented for security

## 🧪 Testing

The API structure is designed to be easily testable:

- Services can be mocked for unit tests
- HTTP client can be swapped for testing
- Types ensure request/response consistency
