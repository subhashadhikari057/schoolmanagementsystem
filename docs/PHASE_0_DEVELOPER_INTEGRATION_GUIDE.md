# 🚀 Phase 0 Developer Integration Guide

## 🎯 Quick Start for New Developers

### **What Phase 0 Provides**
Phase 0 creates a **production-ready foundation** with:
- ✅ **Centralized Type System**: Shared DTOs, enums, and validation schemas
- ✅ **Authentication & Authorization**: JWT + Role-based access control
- ✅ **Database Foundation**: Prisma ORM with seeded data
- ✅ **Error Handling**: Standardized error responses with trace IDs
- ✅ **Development Stack**: Docker + PostgreSQL + Redis
- ✅ **Code Quality**: ESLint, Prettier, Husky pre-commit hooks

---

## 🔧 **How to Integrate with Phase 0 Infrastructure**

### **1. Using Shared Types (Frontend & Backend)**

```typescript
// ✅ Import types from centralized package
import { 
  LoginRequestDto, 
  CreateStudentDto, 
  UserRole 
} from '@sms/shared-types';

// ✅ Import validation schemas
import { 
  LoginRequestSchema,
  CreateStudentSchema 
} from '@sms/shared-types/schemas';

// ✅ Validate data consistently
const validateLogin = (data: unknown) => {
  return LoginRequestSchema.safeParse(data);
};
```

### **2. Backend API Development Pattern**

```typescript
// ✅ Controller with automatic validation & auth
@Controller('students')
@UseGuards(JwtAuthGuard) // Automatic JWT validation
export class StudentController {
  
  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER) // Role-based access
  async createStudent(
    @Body() data: CreateStudentDto, // Auto-validated by global pipe
    @User() user: AuthenticatedUser  // Auto-injected authenticated user
  ) {
    // ✅ Business logic with automatic error handling
    return this.studentService.create(data, user);
  }
}

// ✅ Service layer with proper interfaces
@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService // Auto-injected audit logging
  ) {}
  
  async create(data: CreateStudentDto, user: AuthenticatedUser) {
    // ✅ Database operations automatically audited
    const student = await this.prisma.student.create({ data });
    
    // ✅ Automatic audit trail created by middleware
    return student;
  }
}
```

### **3. Frontend Integration Pattern**

```typescript
// ✅ Use centralized auth context
const StudentForm = () => {
  const { user, hasRole } = useAuth();
  
  // ✅ Type-safe form with validation
  const form = useForm<CreateStudentDto>({
    resolver: zodResolver(CreateStudentSchema)
  });
  
  const handleSubmit = async (data: CreateStudentDto) => {
    try {
      // ✅ API client with automatic error handling
      const student = await apiClient.post('/students', data);
      toast.success('Student created successfully');
    } catch (error) {
      // ✅ Standardized error format from backend
      const apiError = error as ApiError;
      toast.error(apiError.message);
    }
  };
  
  // ✅ Role-based UI rendering
  if (!hasRole(UserRole.ADMIN, UserRole.TEACHER)) {
    return <AccessDenied />;
  }
  
  return <form onSubmit={form.handleSubmit(handleSubmit)}>...</form>;
};
```

### **4. Error Handling Integration**

```typescript
// ✅ Backend: Throw standardized exceptions
throw new ValidationException('Invalid email format');
throw new AuthorizationException('Insufficient permissions');
throw new BusinessLogicException('Student already exists');

// ✅ Frontend: Handle standardized error responses
interface ApiError {
  code: string;
  message: string;
  traceId: string;
  details?: Record<string, unknown>;
}

// ✅ Global error handling
const handleApiError = (error: ApiError) => {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      showValidationErrors(error.details);
      break;
    case 'AUTHORIZATION_ERROR':
      redirectToLogin();
      break;
    default:
      showGenericError(error.message);
  }
};
```

---

## 📊 **Database Integration**

### **Using Prisma with Audit Logging**

```typescript
// ✅ All database operations automatically audited
const student = await prisma.student.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});

// ✅ Audit log automatically created:
// - Action: CREATE
// - Module: STUDENT  
// - User: Current authenticated user
// - Timestamp: Automatic
// - Trace ID: Request trace ID
```

### **Database Seeding & Testing**

```bash
# ✅ Reset database with seed data
npm run db:reset
npm run db:seed

# ✅ Test users available:
# - superadmin@school.edu (SUPERADMIN)
# - admin@school.edu (ADMIN)
# - teacher.math@school.edu (TEACHER)
# - student1@school.edu (STUDENT)
# - parent1@school.edu (PARENT)
```

---

## 🛡️ **Security Integration**

### **Authentication Flow**

```typescript
// ✅ Login endpoint automatically validates
POST /api/auth/login
{
  "identifier": "admin@school.edu", // Email or phone
  "password": "SecurePass123!",
  "remember_me": false
}

// ✅ Response with standardized format
{
  "access_token": "jwt-token-here",
  "refresh_token": "refresh-token-here", 
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@school.edu",
    "role": "ADMIN",
    "permissions": ["USER_CREATE", "USER_READ", ...]
  }
}
```

### **Route Protection**

```typescript
// ✅ Backend route protection
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Get('admin/users')
async getUsers() {
  // Only accessible by ADMIN role
}

// ✅ Frontend route protection
const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, hasRole } = useAuth();
  
  if (!user) return <LoginRedirect />;
  if (!hasRole(...requiredRoles)) return <AccessDenied />;
  
  return children;
};
```

---

## 🧪 **Testing Integration**

### **Using Test Infrastructure**

```typescript
// ✅ Backend integration tests
describe('Student API', () => {
  beforeEach(async () => {
    // ✅ Test database automatically seeded
    await testDb.seed();
  });
  
  it('should create student with proper audit', async () => {
    const response = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validStudentData);
      
    expect(response.status).toBe(201);
    // ✅ Audit log automatically verified
  });
});

// ✅ Frontend component tests
test('StudentForm validates input correctly', () => {
  render(<StudentForm />);
  
  // ✅ Validation schemas automatically tested
  fireEvent.submit(screen.getByRole('button'));
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

---

## 📈 **Performance & Monitoring**

### **Built-in Monitoring**

```typescript
// ✅ Automatic request tracing
// Every request gets a unique trace ID
// Logged across all services and database operations

// ✅ Performance monitoring
// Database query times automatically logged
// Slow queries identified and reported

// ✅ Error tracking
// All errors automatically logged with context
// Stack traces preserved with trace IDs
```

---

## 🚀 **Development Workflow**

### **Adding New Features**

1. **Define Types**
   ```bash
   # Add DTOs to shared-types
   cd shared-types/src/dto/
   # Create your-feature.dto.ts
   ```

2. **Create Schemas**
   ```bash
   # Add validation schemas
   cd shared-types/src/schemas/
   # Create your-feature.schemas.ts
   ```

3. **Backend Implementation**
   ```bash
   # Create module structure
   cd backend/src/modules/
   mkdir your-feature
   # Implement controller, service, module
   ```

4. **Frontend Integration**
   ```bash
   # Use shared types and schemas
   import { YourFeatureDto } from '@sms/shared-types';
   import { YourFeatureSchema } from '@sms/shared-types/schemas';
   ```

5. **Testing**
   ```bash
   # Tests automatically use shared infrastructure
   npm test # Backend
   npm test # Frontend  
   npm test # Shared-types
   ```

### **Code Quality Enforcement**

```bash
# ✅ Pre-commit hooks automatically run:
# - ESLint checks
# - Prettier formatting
# - Type checking
# - Test validation

# ✅ Manual quality checks:
npm run lint      # Check code quality
npm run format    # Fix formatting
npm run type-check # Verify types
```

---

## 📋 **Common Integration Patterns**

### **✅ DO: Recommended Patterns**

```typescript
// ✅ Use shared types everywhere
import { UserDto } from '@sms/shared-types';

// ✅ Validate with centralized schemas
const result = UserSchema.safeParse(data);

// ✅ Use proper error exceptions
throw new ValidationException('Invalid data');

// ✅ Leverage automatic audit logging
// (No manual audit calls needed)

// ✅ Use role-based decorators
@Roles(UserRole.ADMIN)

// ✅ Inject authenticated user
async handler(@User() user: AuthenticatedUser) {}
```

### **❌ DON'T: Anti-patterns**

```typescript
// ❌ Don't create duplicate types
interface MyCustomUser {} // Use UserDto instead

// ❌ Don't skip validation
const user = req.body; // Use schema validation

// ❌ Don't use direct database calls in controllers
await prisma.user.create(); // Use service layer

// ❌ Don't handle auth manually
if (req.headers.authorization) {} // Use @UseGuards()

// ❌ Don't create custom error formats
res.status(400).json({ error: 'Bad' }); // Use exceptions
```

---

## 🎯 **Next Steps**

1. **Review the comprehensive audit report** in `docs/PHASE_0_COMPREHENSIVE_AUDIT_REPORT.md`
2. **Fix remaining linting errors** (650 errors to address)
3. **Complete frontend testing verification**
4. **Begin Phase 1 development** using these patterns

**Phase 0 Status**: ✅ **Functionally Complete** - Ready for development with quality cleanup needed.