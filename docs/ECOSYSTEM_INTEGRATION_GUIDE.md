# 🌐 Ecosystem Integration Guide

## 📋 Overview

This guide explains how to integrate and work with the School Management System ecosystem, covering both frontend and backend development patterns, shared resources, and best practices for seamless collaboration.

## 🏗️ Ecosystem Architecture

### 🔧 System Components

```
School Management System
├── Backend (NestJS + Prisma + PostgreSQL)
│   ├── Authentication & Authorization
│   ├── API Endpoints (REST)
│   ├── Database Management
│   ├── Audit Logging
│   └── Error Handling
├── Frontend (Next.js + React + TypeScript)
│   ├── Component Library
│   ├── State Management
│   ├── API Integration
│   └── Authentication Context
├── Shared Types Package
│   ├── DTOs & Interfaces
│   ├── Enums & Constants
│   ├── Validation Schemas
│   └── Error Types
└── Documentation & Guides
    ├── API Contracts
    ├── Database Schemas
    ├── Feature Specifications
    └── Development Guides
```

## 🔗 Shared Resources

### 📦 Shared Types Package (`@sms/shared-types`)

The shared types package ensures type consistency across frontend and backend:

**Location**: `shared-types/`

**Usage in Backend**:

```typescript
import { UserRole, CreateStudentDto, AuditAction } from "@sms/shared-types";

@Controller("students")
export class StudentsController {
  @Post()
  async create(@Body() dto: CreateStudentDto): Promise<Student> {
    return this.studentsService.create(dto);
  }
}
```

**Usage in Frontend**:

```typescript
import { UserRole, CreateStudentDto } from "@sms/shared-types";

const createStudent = async (data: CreateStudentDto) => {
  return apiClient.post<Student>("/students", data);
};
```

### 🔄 API Contract Synchronization

**Backend Implementation**:

- All endpoints must match contracts in `Pre-Documents/Dev docs/5. API Contract Documentation`
- Use exact endpoint paths, HTTP methods, and response formats
- Implement standardized error handling

**Frontend Integration**:

- Use predefined endpoints from `@/constants/api.ts`
- Follow established patterns for API calls
- Handle errors using provided utilities

## 🛡️ Authentication & Authorization

### 🔐 Backend Authentication

**JWT Implementation**:

```typescript
// Use existing JWT utilities
import { signAccessToken, verifyToken } from '@/shared/auth/jwt.util';

// Apply guards to routes
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
@Get('assignments')
async getAssignments(@User() user: AuthenticatedUser) {
  return this.assignmentsService.findByTeacher(user.id);
}
```

**Role-Based Access Control**:

```typescript
// Use role decorators
@MinRole(UserRole.TEACHER)
@Get('dashboard')
async getDashboard(@User() user: AuthenticatedUser) {
  return this.dashboardService.getForRole(user.role);
}
```

### 🔒 Frontend Authentication

**Authentication Context**:

```typescript
// Use authentication hooks
const { user, hasRole, hasPermission } = useAuth();

// Protect routes
<ProtectedRoute requiredRole={UserRole.TEACHER}>
  <TeacherDashboard />
</ProtectedRoute>

// Check permissions in components
{hasPermission('write:assignments') && (
  <Button onClick={createAssignment}>Create Assignment</Button>
)}
```

## 🗄️ Database Integration

### 📊 Database Schema

**Reference**: `Schemas/*.md` files in Pre-Documents

**Backend Usage**:

```typescript
// Use Prisma models as defined in schemas
const student = await this.prisma.student.create({
  data: {
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    // Follow exact schema structure
  },
  include: {
    enrollments: {
      include: {
        class: true,
      },
    },
  },
});
```

### 🔍 Audit Logging

**Automatic Audit Trails**:

```typescript
// Backend - Audit middleware automatically logs actions
@Post('students')
async createStudent(@Body() dto: CreateStudentDto, @User() user: AuthenticatedUser) {
  // Audit trail is automatically created by middleware
  return this.studentsService.create(dto);
}
```

## 🌊 Data Flow Patterns

### 📤 Backend to Frontend Flow

1. **API Endpoint Creation**:

   ```typescript
   // Backend Controller
   @Get('students')
   async getStudents(@Query() query: GetStudentsDto): Promise<PaginatedResponse<Student>> {
     return this.studentsService.findAll(query);
   }
   ```

2. **Frontend API Integration**:

   ```typescript
   // Frontend Service
   const { data, isLoading } = useQuery({
     queryKey: ["students", filters],
     queryFn: () =>
       apiClient.get<PaginatedResponse<Student>>(API_ENDPOINTS.STUDENTS.LIST, {
         params: filters,
       }),
   });
   ```

3. **Component Usage**:

   ```typescript
   // Frontend Component
   function StudentsList() {
     const { data: students, isLoading } = useStudents();

     if (isLoading) return <LoadingSpinner />;

     return (
       <div>
         {students?.data.map(student => (
           <StudentCard key={student.id} student={student} />
         ))}
       </div>
     );
   }
   ```

### 🔄 Error Handling Flow

**Backend Error Handling**:

```typescript
// Global exception filter handles all errors
throw new BadRequestException({
  code: "VALIDATION_ERROR",
  message: "Invalid student data",
  details: validationErrors,
});
```

**Frontend Error Handling**:

```typescript
// API client transforms errors automatically
try {
  await apiClient.post("/students", studentData);
} catch (error) {
  if (isApiError(error)) {
    toast.error(error.message);
    if (error.code === "VALIDATION_ERROR") {
      handleValidationErrors(error.details);
    }
  }
}
```

## 🧪 Testing Integration

### 🔬 Backend Testing

**Use Existing Test Infrastructure**:

```typescript
// Integration tests
describe("Students API", () => {
  it("should create student with valid data", async () => {
    const studentData: CreateStudentDto = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@school.edu",
    };

    const response = await request(app.getHttpServer())
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(studentData)
      .expect(201);

    expect(response.body.data).toMatchObject(studentData);
  });
});
```

### 🧪 Frontend Testing

**Component Testing**:

```typescript
// Test with authentication context
test('StudentsList shows students for authenticated user', async () => {
  const mockStudents = [
    { id: '1', firstName: 'John', lastName: 'Doe' },
  ];

  vi.mocked(apiClient.get).mockResolvedValue({
    data: { data: mockStudents },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <StudentsList />
    </QueryClientProvider>
  );

  expect(await screen.findByText('John Doe')).toBeInTheDocument();
});
```

## 🚀 Development Workflow

### 🔄 Feature Development Process

1. **Backend Development**:
   - Create/update database schema if needed
   - Implement API endpoints following contracts
   - Add proper authentication and authorization
   - Write comprehensive tests
   - Update API documentation

2. **Frontend Development**:
   - Create UI components using the component library
   - Implement API integration using provided client
   - Add proper error handling and loading states
   - Write component and integration tests
   - Follow established authentication patterns

3. **Integration Testing**:
   - Test API endpoints with frontend
   - Verify authentication flows
   - Test error scenarios
   - Validate data consistency

### 🛠️ Development Commands

**Backend**:

```bash
# Development
npm run dev

# Testing
npm test
npm run test:watch
npm run test:e2e

# Database
npx prisma generate
npx prisma db push
npm run seed
```

**Frontend**:

```bash
# Development
npm run dev

# Testing
npm test
npm run test:coverage
npm run test:ui

# Build
npm run build
```

## 📋 Code Standards & Patterns

### 🎯 Backend Patterns

1. **Controller Pattern**:

   ```typescript
   @Controller("api/v1/students")
   @UseGuards(JwtAuthGuard)
   export class StudentsController {
     constructor(private studentsService: StudentsService) {}

     @Get()
     @Roles(UserRole.ADMIN, UserRole.TEACHER)
     async findAll(@Query() query: GetStudentsDto) {
       return this.studentsService.findAll(query);
     }
   }
   ```

2. **Service Pattern**:

   ```typescript
   @Injectable()
   export class StudentsService {
     constructor(private prisma: PrismaService) {}

     async create(dto: CreateStudentDto): Promise<Student> {
       return this.prisma.student.create({
         data: dto,
       });
     }
   }
   ```

### 🎨 Frontend Patterns

1. **Component Pattern**:

   ```typescript
   interface StudentCardProps {
     student: Student;
     onEdit?: (student: Student) => void;
   }

   export function StudentCard({ student, onEdit }: StudentCardProps) {
     const { hasPermission } = useAuth();

     return (
       <Card>
         <CardContent>
           <h3>{student.firstName} {student.lastName}</h3>
           {hasPermission('write:students') && (
             <Button onClick={() => onEdit?.(student)}>Edit</Button>
           )}
         </CardContent>
       </Card>
     );
   }
   ```

2. **Hook Pattern**:
   ```typescript
   export function useStudents(filters?: StudentFilters) {
     return useQuery({
       queryKey: ["students", filters],
       queryFn: () =>
         apiClient.get<PaginatedResponse<Student>>(
           API_ENDPOINTS.STUDENTS.LIST,
           { params: filters },
         ),
     });
   }
   ```

## 📚 Documentation Requirements

### 📝 API Documentation

- Document all endpoints in API contract files
- Include request/response examples
- Specify error scenarios
- Document authentication requirements

### 🧩 Component Documentation

- JSDoc comments for complex components
- Usage examples in component files
- Props documentation with TypeScript
- Accessibility considerations

## 🔧 Environment Configuration

### 🌍 Environment Variables

**Backend** (`.env.example`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/schoolmanagement"
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
```

**Frontend** (`.env.local`):

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_APP_ENV="development"
```

## 🚨 Common Pitfalls & Solutions

### ❌ Common Mistakes

1. **Type Mismatches**: Not using shared types
2. **Authentication Bypass**: Not using provided guards/hooks
3. **Error Handling**: Not following standardized error patterns
4. **API Contracts**: Deviating from documented endpoints

### ✅ Solutions

1. **Always Import from Shared Types**:

   ```typescript
   import { UserRole, CreateStudentDto } from "@sms/shared-types";
   ```

2. **Use Provided Authentication**:

   ```typescript
   // Backend
   @UseGuards(JwtAuthGuard, RolesGuard)

   // Frontend
   const { hasRole } = useAuth();
   ```

3. **Follow Error Patterns**:

   ```typescript
   // Backend
   throw new BadRequestException({ code: "VALIDATION_ERROR", message: "..." });

   // Frontend
   if (isApiError(error)) {
     /* handle */
   }
   ```

## 🎯 Success Metrics

- ✅ Type safety across frontend/backend
- ✅ Consistent authentication patterns
- ✅ Standardized error handling
- ✅ Comprehensive test coverage
- ✅ Clear documentation
- ✅ Seamless developer experience

## 📞 Getting Help

1. **Documentation**: Check relevant documentation files
2. **Examples**: Review existing implementations
3. **Tests**: Look at test files for usage patterns
4. **Shared Types**: Check shared-types package for contracts
5. **API Contracts**: Reference Pre-Documents for specifications
