# 🧩 Component Development Guide

## 📋 Overview

This guide provides comprehensive instructions for developing React components within the School Management System frontend, following established patterns and best practices.

## 🏗️ Component Architecture

### 🎯 Design Principles

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composability**: Components should work well together
3. **Reusability**: Build components that can be used across different contexts
4. **Accessibility**: All components should be accessible by default
5. **Type Safety**: Comprehensive TypeScript typing
6. **Testability**: Components should be easy to test

### 📁 Component Organization

```
src/components/
├── ui/                     # Base UI components
│   ├── button.tsx         # Button component
│   ├── input.tsx          # Input component
│   ├── card.tsx           # Card components
│   └── index.ts           # Export all UI components
├── layout/                # Layout components
│   ├── auth-guard.tsx     # Authentication protection
│   ├── providers.tsx      # Global providers
│   └── index.ts           # Export layout components
└── index.ts               # Export all components
```

## 🛠️ Component Development Patterns

### 🎨 Base UI Component Pattern

**Template Structure**:

```typescript
/**
 * =============================================================================
 * ComponentName Component
 * =============================================================================
 * Brief description of what this component does
 * =============================================================================
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

// Define variants using CVA
const componentVariants = cva(
  'base-classes-here',
  {
    variants: {
      variant: {
        default: 'default-variant-classes',
        secondary: 'secondary-variant-classes',
      },
      size: {
        sm: 'small-size-classes',
        md: 'medium-size-classes',
        lg: 'large-size-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Props interface
export interface ComponentNameProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {
  // Custom props here
  customProp?: string;
  onCustomEvent?: (value: string) => void;
}

// Component implementation
const ComponentName = React.forwardRef<HTMLElement, ComponentNameProps>(
  ({ className, variant, size, customProp, onCustomEvent, ...props }, ref) => {
    return (
      <element
        className={cn(componentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Component content */}
      </element>
    );
  }
);

ComponentName.displayName = 'ComponentName';

export { ComponentName, componentVariants };
```

### 🎪 Complex Component Pattern

**For components with internal state and logic**:

```typescript
import React, { useState, useCallback } from 'react';
import { cn } from '@/utils';

interface ComplexComponentProps {
  data: DataType[];
  onItemSelect?: (item: DataType) => void;
  className?: string;
}

export function ComplexComponent({
  data,
  onItemSelect,
  className
}: ComplexComponentProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleItemClick = useCallback((item: DataType) => {
    setSelectedId(item.id);
    onItemSelect?.(item);
  }, [onItemSelect]);

  const handleAsyncAction = useCallback(async () => {
    setIsLoading(true);
    try {
      // Async operation
      await someAsyncOperation();
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className={cn('complex-component-base-classes', className)}>
      {data.map(item => (
        <div
          key={item.id}
          className={cn(
            'item-classes',
            selectedId === item.id && 'selected-classes'
          )}
          onClick={() => handleItemClick(item)}
        >
          {item.name}
        </div>
      ))}

      {isLoading && <LoadingSpinner />}
    </div>
  );
}
```

## 🎨 Styling Guidelines

### 🎯 Tailwind CSS Patterns

**Responsive Design**:

```typescript
<div className="flex flex-col md:flex-row gap-4 p-4 md:p-6">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">Content</div>
</div>
```

**State-based Styling**:

```typescript
<button
  className={cn(
    'px-4 py-2 rounded transition-colors',
    'hover:bg-primary/90 focus:ring-2 focus:ring-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    isActive && 'bg-primary text-primary-foreground',
    hasError && 'border-destructive text-destructive'
  )}
>
  Button Text
</button>
```

### 🎨 Component Variants

**Using Class Variance Authority**:

```typescript
const alertVariants = cva('rounded-lg border p-4', {
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      destructive:
        'border-destructive/50 text-destructive dark:border-destructive',
      success: 'border-green-500/50 text-green-700 dark:border-green-500',
      warning: 'border-yellow-500/50 text-yellow-700 dark:border-yellow-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
```

## 🔒 Authentication Integration

### 🛡️ Permission-based Rendering

```typescript
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@sms/shared-types';

function ProtectedComponent() {
  const { hasRole, hasPermission } = useAuth();

  return (
    <div>
      {hasRole(UserRole.TEACHER) && (
        <TeacherOnlyContent />
      )}

      {hasPermission('write:assignments') && (
        <Button onClick={createAssignment}>
          Create Assignment
        </Button>
      )}

      {hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) && (
        <AdminPanel />
      )}
    </div>
  );
}
```

### 🔐 Route Protection

```typescript
import { ProtectedRoute, AuthGuard } from '@/components/layout';

// Protect entire component
<ProtectedRoute requiredRole={UserRole.TEACHER}>
  <TeacherDashboard />
</ProtectedRoute>

// Custom protection logic
<AuthGuard
  requiredRole={[UserRole.ADMIN, UserRole.TEACHER]}
  fallback={<UnauthorizedMessage />}
>
  <SensitiveContent />
</AuthGuard>
```

## 🌐 API Integration

### 📡 Data Fetching Components

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

function StudentsList() {
  const {
    data: students,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiClient.get<Student[]>(API_ENDPOINTS.STUDENTS.LIST),
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load students"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="grid gap-4">
      {students?.data.map(student => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
```

### 🔄 Mutation Components

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateStudentForm() {
  const queryClient = useQueryClient();

  const createStudent = useMutation({
    mutationFn: (data: CreateStudentDto) =>
      apiClient.post<Student>(API_ENDPOINTS.STUDENTS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
    },
    onError: (error) => {
      if (isApiError(error)) {
        toast.error(error.message);
      }
    },
  });

  const handleSubmit = (data: CreateStudentDto) => {
    createStudent.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button
        type="submit"
        loading={createStudent.isPending}
        disabled={createStudent.isPending}
      >
        Create Student
      </Button>
    </form>
  );
}
```

## 📝 Form Components

### 🎯 Form Pattern with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

function StudentForm({ onSubmit, initialData }: StudentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        {...register('firstName')}
        label="First Name"
        error={errors.firstName?.message}
        required
      />

      <Input
        {...register('lastName')}
        label="Last Name"
        error={errors.lastName?.message}
        required
      />

      <Input
        {...register('email')}
        type="email"
        label="Email"
        error={errors.email?.message}
        required
      />

      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Student'}
      </Button>
    </form>
  );
}
```

## 🧪 Component Testing

### 🔬 Testing Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentName } from '../component-name';

// Test wrapper with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />, { wrapper: TestWrapper });

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const onAction = vi.fn();
    render(<ComponentName onAction={onAction} />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  it('handles loading states', () => {
    render(<ComponentName loading />, { wrapper: TestWrapper });

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error states', () => {
    render(<ComponentName error="Something went wrong" />, { wrapper: TestWrapper });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

### 🎭 Testing with Authentication

```typescript
import { useAuthStore } from '@/stores/auth.store';

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('ProtectedComponent', () => {
  it('shows content for authorized users', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      hasRole: vi.fn().mockReturnValue(true),
      hasPermission: vi.fn().mockReturnValue(true),
      // ... other auth properties
    });

    render(<ProtectedComponent />);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('hides content for unauthorized users', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      hasRole: vi.fn().mockReturnValue(false),
      hasPermission: vi.fn().mockReturnValue(false),
      // ... other auth properties
    });

    render(<ProtectedComponent />);

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
```

## ♿ Accessibility Guidelines

### 🎯 Accessibility Checklist

1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Labels**: Provide descriptive labels
3. **Keyboard Navigation**: Support tab navigation
4. **Focus Management**: Proper focus indicators
5. **Screen Reader Support**: Meaningful content for screen readers

### 🔍 Accessibility Examples

```typescript
// Proper button with ARIA
<button
  aria-label="Delete student John Doe"
  aria-describedby="delete-help-text"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</button>
<div id="delete-help-text" className="sr-only">
  This action cannot be undone
</div>

// Form with proper labels
<div>
  <label htmlFor="student-email" className="block text-sm font-medium">
    Email Address
    <span className="text-red-500" aria-label="required">*</span>
  </label>
  <input
    id="student-email"
    type="email"
    required
    aria-describedby="email-error"
    aria-invalid={hasError ? 'true' : 'false'}
  />
  {hasError && (
    <div id="email-error" role="alert" className="text-red-500">
      Please enter a valid email address
    </div>
  )}
</div>
```

## 🚀 Performance Optimization

### ⚡ Performance Best Practices

1. **React.memo**: Memoize components that receive stable props
2. **useMemo/useCallback**: Memoize expensive calculations
3. **Code Splitting**: Use dynamic imports for large components
4. **Virtual Scrolling**: For large lists
5. **Image Optimization**: Use Next.js Image component

### 🔧 Performance Examples

```typescript
// Memoized component
const ExpensiveComponent = React.memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item));
  }, [data]);

  const handleAction = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} item={item} onAction={handleAction} />
      ))}
    </div>
  );
});

// Code splitting
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## 📚 Documentation Standards

### 📝 Component Documentation

````typescript
/**
 * StudentCard component displays student information in a card format
 *
 * @example
 * ```tsx
 * <StudentCard
 *   student={student}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
interface StudentCardProps {
  /** Student data to display */
  student: Student;
  /** Callback when edit button is clicked */
  onEdit?: (student: Student) => void;
  /** Callback when delete button is clicked */
  onDelete?: (studentId: string) => void;
  /** Additional CSS classes */
  className?: string;
}
````

## 🎯 Best Practices Summary

### ✅ Do's

1. Use TypeScript for all components
2. Follow established naming conventions
3. Include comprehensive prop documentation
4. Write tests for all components
5. Use provided UI components as building blocks
6. Follow accessibility guidelines
7. Handle loading and error states
8. Use proper error boundaries

### ❌ Don'ts

1. Don't use `any` types
2. Don't bypass authentication checks
3. Don't hardcode API endpoints
4. Don't ignore error handling
5. Don't skip accessibility features
6. Don't create components without tests
7. Don't ignore performance implications

## 🔧 Development Tools

### 🛠️ Recommended VS Code Extensions

- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer
- Prettier - Code formatter
- ESLint
- TypeScript Importer

### 📋 Code Snippets

**React Component Snippet**:

```json
{
  "React Component": {
    "prefix": "rfc",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  ${2:prop}: ${3:string};",
      "}",
      "",
      "export function ${1:ComponentName}({ ${2:prop} }: ${1:ComponentName}Props) {",
      "  return (",
      "    <div>",
      "      ${4:// Component content}",
      "    </div>",
      "  );",
      "}"
    ]
  }
}
```

This guide provides a comprehensive foundation for developing components within the School Management System. Follow these patterns to ensure consistency, maintainability, and a great developer experience.
