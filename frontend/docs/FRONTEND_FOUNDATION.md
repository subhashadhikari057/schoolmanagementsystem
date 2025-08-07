# 🎨 Frontend Foundation Documentation

## 📋 Overview

This document outlines the frontend foundation setup for the School Management System, providing a comprehensive guide for developers to build upon the established infrastructure.

## 🏗️ Architecture Overview

### 🔧 Technology Stack

- **Framework**: Next.js 15.4.4 (React 19.1.0)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand 5.x with persistence
- **API Client**: Axios with custom wrapper
- **Data Fetching**: TanStack Query (React Query) 5.x
- **Forms**: React Hook Form 7.x with Zod validation
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React

### 🏛️ Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Input, etc.)
│   │   └── layout/         # Layout components (AuthGuard, Providers)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Core libraries and configurations
│   ├── stores/             # Zustand stores for global state
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── constants/          # Application constants
│   └── __tests__/          # Global test utilities
├── docs/                   # Documentation
└── public/                 # Static assets
```

## 🔐 Authentication System

### 🛡️ Authentication Flow

The authentication system is built with JWT tokens and session management:

1. **Login Process**:
   - User submits credentials
   - Backend validates and returns JWT tokens
   - Tokens stored securely in localStorage
   - User state updated in Zustand store

2. **Token Management**:
   - Access tokens (15 min expiry)
   - Refresh tokens (7 days expiry)
   - Automatic token refresh
   - Secure token storage

3. **Session Validation**:
   - IP address consistency checks
   - User agent validation
   - Inactivity timeout
   - Session revocation support

### 🔑 Authentication Hooks

```typescript
// Basic authentication
const { user, isAuthenticated, login, logout } = useAuth();

// Require authentication for a route
const auth = useRequireAuth(UserRole.TEACHER);

// Guest-only routes (redirect if authenticated)
const auth = useGuestOnly();

// Route protection with role checking
const { checkRouteAccess } = useRouteGuard();
```

### 🛡️ Route Protection

```typescript
// Protect entire page/component
<ProtectedRoute requiredRole={UserRole.ADMIN}>
  <AdminDashboard />
</ProtectedRoute>

// Auth guard with custom fallback
<AuthGuard requiredRole={[UserRole.TEACHER, UserRole.ADMIN]}>
  <TeacherPanel />
</AuthGuard>

// Guest-only pages
<GuestOnly>
  <LoginPage />
</GuestOnly>
```

## 🌐 API Integration

### 📡 API Client

The API client provides:

- Automatic token injection
- Request/response interceptors
- Error handling and transformation
- Retry logic with exponential backoff
- File upload support

```typescript
import { apiClient } from '@/lib/api-client';

// Basic requests
const users = await apiClient.get<User[]>('/users');
const user = await apiClient.post<User>('/users', userData);

// With error handling
try {
  const result = await apiClient.put<User>(`/users/${id}`, updates);
} catch (error) {
  if (isApiError(error)) {
    console.error('API Error:', error.message);
  }
}

// File upload with progress
await apiClient.upload('/files', file, progress => {
  console.log(`Upload progress: ${progress}%`);
});
```

### 🔄 Data Fetching with React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => apiClient.get<User[]>('/users'),
});

// Mutations
const createUser = useMutation({
  mutationFn: (userData: CreateUserDto) =>
    apiClient.post<User>('/users', userData),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

## 🎨 Component Library

### 🧱 Base UI Components

All UI components are built with:

- TypeScript for type safety
- Class Variance Authority for variant management
- Tailwind CSS for styling
- Accessibility features
- Comprehensive testing

#### Available Components:

- **Button**: Multiple variants (default, destructive, outline, ghost, link)
- **Input**: Form inputs with validation states and icons
- **Card**: Content containers with header, content, and footer
- **LoadingSpinner**: Loading indicators with different sizes

### 🎨 Component Usage Examples

```typescript
// Button with loading state
<Button
  variant="destructive"
  size="lg"
  loading={isSubmitting}
  leftIcon={<TrashIcon />}
  onClick={handleDelete}
>
  Delete User
</Button>

// Input with validation
<Input
  label="Email Address"
  type="email"
  error={errors.email?.message}
  leftIcon={<MailIcon />}
  required
  {...register('email')}
/>

// Card layout
<Card>
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
    <CardDescription>Manage your account settings</CardDescription>
  </CardHeader>
  <CardContent>
    <UserForm />
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

## 🗂️ State Management

### 🏪 Zustand Stores

Global state is managed with Zustand stores:

```typescript
// Auth store usage
const { user, isAuthenticated, login, logout, hasRole, hasPermission } =
  useAuthStore();

// Check permissions
if (hasPermission('write:students')) {
  // Show edit button
}

if (hasRole([UserRole.ADMIN, UserRole.TEACHER])) {
  // Show admin features
}
```

## 🧪 Testing Strategy

### 🔬 Testing Stack

- **Unit Tests**: Vitest + React Testing Library
- **Component Tests**: Comprehensive component behavior testing
- **Hook Tests**: Custom hook functionality testing
- **Store Tests**: State management testing
- **API Tests**: API client and integration testing

### 📝 Test Examples

```typescript
// Component testing
test('Button shows loading state', () => {
  render(<Button loading>Submit</Button>);

  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByRole('button')).toContainHTML('animate-spin');
});

// Hook testing
test('useAuth handles login correctly', async () => {
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.login(credentials);
  });

  expect(result.current.isAuthenticated).toBe(true);
});
```

## 🔧 Development Guidelines

### 📏 Code Standards

1. **TypeScript**: Strict mode enabled, no `any` types
2. **Components**: Functional components with proper typing
3. **Hooks**: Custom hooks for reusable logic
4. **Testing**: Comprehensive test coverage required
5. **Documentation**: JSDoc comments for complex functions

### 🎯 Best Practices

1. **Component Design**:
   - Single responsibility principle
   - Proper prop typing
   - Accessibility considerations
   - Error boundary handling

2. **State Management**:
   - Use Zustand for global state
   - React Query for server state
   - Local state for component-specific data

3. **API Integration**:
   - Use provided API client
   - Implement proper error handling
   - Type all API responses
   - Handle loading states

4. **Security**:
   - Validate all user inputs
   - Sanitize data before display
   - Use provided auth utilities
   - Follow RBAC patterns

## 🚀 Getting Started

### 📦 Installation

```bash
cd frontend
npm install
```

### 🏃‍♂️ Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

### 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## 📚 Integration with Backend

### 🔗 API Endpoints

All API endpoints are defined in `@/constants/api.ts` and match the backend contract:

```typescript
// Use predefined endpoints
const users = await apiClient.get(API_ENDPOINTS.STUDENTS.LIST);
const user = await apiClient.get(API_ENDPOINTS.STUDENTS.GET_BY_ID(userId));
```

### 🔄 Shared Types

Frontend uses shared types from `@sms/shared-types` package:

```typescript
import { UserRole, CreateStudentDto } from '@sms/shared-types';

// Types are automatically synced with backend
const createStudent = async (data: CreateStudentDto) => {
  return apiClient.post<Student>(API_ENDPOINTS.STUDENTS.CREATE, data);
};
```

## 🎯 Next Steps for Developers

1. **Create Feature Components**: Build specific UI components for your features
2. **Implement Forms**: Use React Hook Form with Zod validation
3. **Add API Integration**: Use provided API client and React Query
4. **Write Tests**: Comprehensive testing for all new components
5. **Follow Patterns**: Use established patterns for consistency

## 📞 Support

For questions or issues with the frontend foundation:

1. Check this documentation
2. Review existing component examples
3. Check test files for usage patterns
4. Consult the shared types package for API contracts

## Dev Mock Mode for Local Frontend Development

To allow frontend development without a working backend, you can enable a dev mock mode that uses mock data instead of making API calls. This is controlled by environment variables:

- `NODE_ENV=development`
- `NEXT_PUBLIC_DEV_SIDEBAR=true` (in your `.env.local`)

When both are set, you can use the `isDevMockEnabled` utility from `src/utils/index.ts` to conditionally use mock data in your components/pages:

```ts
import { isDevMockEnabled } from '@/utils';
import { mockClasses } from '@/constants/mockData';

if (isDevMockEnabled()) {
  // Use mockClasses or other mock data
} else {
  // Call backend as usual
}
```

This pattern keeps backend integration logic untouched and is easy to reuse across the project. Add your mock data to `src/constants/mockData.ts` or a similar file.
