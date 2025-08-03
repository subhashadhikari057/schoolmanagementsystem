# 📚 **Student Module - Complete Documentation**

## 📋 **Table of Contents**
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [DTOs & Schemas](#dtos--schemas)
5. [Database Relationships](#database-relationships)
6. [Authentication & Authorization](#authentication--authorization)
7. [Parent Management System](#parent-management-system)
8. [Error Handling](#error-handling)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)

---

## 🎯 **Overview**

The Student Module is a comprehensive system for managing students, their profiles, and parent relationships in a school management system. It supports:

- **Student Creation** with new or existing parents
- **Flexible Parent Management** (user accounts + contact records)
- **Primary Parent Switching** with automatic account management
- **Student Profiles** with detailed information
- **Role-Based Access Control** for different user types

---

## 🏗️ **Architecture**

```
src/modules/student/
├── application/
│   └── student.service.ts          # Business logic
├── dto/
│   ├── student.dto.ts              # Data transfer objects
│   ├── parent-link.dto.ts          # Parent linking DTOs
│   ├── student-profile.dto.ts      # Profile DTOs
│   └── get-all.dto.ts             # Query DTOs
├── infrastructure/
│   └── student.controller.ts       # API endpoints
└── student.module.ts               # Module definition
```

---

## 🔗 **API Endpoints**

### **1. Student Creation APIs**

#### **Create Student with New Parents**
Creates a completely new student with new parent accounts.

```http
POST /api/v1/students/create-with-new-parents
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  user: {
    fullName: string;           // Required
    email: string;              // Required, valid email
    phone?: string;             // Optional
    password?: string;          // Optional, auto-generated if missing
  };
  classId: string;              // Required, UUID
  sectionId: string;            // Required, UUID  
  rollNumber: string;           // Required
  dob: string;                  // Required, YYYY-MM-DD format
  gender: 'male' | 'female' | 'other';  // Required
  additionalMetadata?: Record<string, any>;  // Optional
  profile?: {                   // Optional
    bio?: string;
    profilePhotoUrl?: string;
    emergencyContact?: Record<string, any>;
    interests?: Record<string, any>;
    additionalData?: Record<string, any>;
  };
  parents: Array<{              // Required, min 1 parent
    fullName: string;           // Required for new parents
    email: string;              // Required, valid email
    phone?: string;             // Optional
    password?: string;          // Optional, auto-generated if missing
    relationship: string;       // Required
    isPrimary: boolean;         // Required, exactly one must be true
    createUserAccount?: boolean; // Optional, default false
  }>;
}
```

**Response:**
```typescript
{
  message: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  studentTemporaryPassword?: string;  // If password was auto-generated
  parents: Array<{
    id?: string;                      // Present if hasUserAccount=true
    fullName: string;
    email: string;
    phone?: string;
    temporaryPassword?: string;       // If password was auto-generated
    hasUserAccount: boolean;
  }>;
}
```

#### **Create Student with Existing Parents**
Creates a student and links to existing parents (for siblings).

```http
POST /api/v1/students/create-with-existing-parents
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  user: {
    fullName: string;           // Required
    email: string;              // Required, valid email
    phone?: string;             // Optional
    password?: string;          // Optional, auto-generated if missing
  };
  classId: string;              // Required, UUID
  sectionId: string;            // Required, UUID
  rollNumber: string;           // Required
  dob: string;                  // Required, YYYY-MM-DD format
  gender: 'male' | 'female' | 'other';  // Required
  additionalMetadata?: Record<string, any>;  // Optional
  profile?: {                   // Optional
    bio?: string;
    profilePhotoUrl?: string;
    emergencyContact?: Record<string, any>;
    interests?: Record<string, any>;
    additionalData?: Record<string, any>;
  };
  parents: Array<{              // Required, min 1 parent
    email: string;              // Required, must exist for primary
    relationship: string;       // Required
    isPrimary: boolean;         // Required, exactly one must be true
    fullName?: string;          // Optional, for new contacts
  }>;
}
```

**Response:**
```typescript
{
  message: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  studentTemporaryPassword?: string;  // If password was auto-generated
  primaryParent?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}
```

### **2. Student Retrieval APIs**

#### **Get All Students**
Retrieves paginated list of students with filtering.

```http
GET /api/v1/students?page=1&limit=20&classId=uuid&sectionId=uuid&search=term
Authorization: Bearer <admin-jwt-token>
```

**Query Parameters:**
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, max: 100
  classId?: string;     // Filter by class UUID
  sectionId?: string;   // Filter by section UUID
  search?: string;      // Search in name, email, phone
}
```

**Response:**
```typescript
{
  total: number;
  page: number;
  limit: number;
  students: Array<{
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    rollNumber: string;
    class: {
      id: string;
      name: string;
    };
    section: {
      id: string;
      name: string;
    };
  }>;
}
```

#### **Get Student by ID**
Retrieves detailed student information.

```http
GET /api/v1/students/:id
Authorization: Bearer <jwt-token>
```

**Response:**
```typescript
{
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  rollNumber: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  class: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  profile?: {
    bio?: string;
    profilePhotoUrl?: string;
    emergencyContact?: Record<string, any>;
    interests?: Record<string, any>;
    additionalData?: Record<string, any>;
  };
  additionalMetadata?: Record<string, any>;
  parents: Array<{
    id?: string;
    fullName: string;
    email: string;
    phone?: string;
    relationship: string;
    isPrimary: boolean;
  }>;
}
```

### **3. Student Update APIs**

#### **Admin Update Student**
Updates student information (admin only).

```http
PATCH /api/v1/students/:id
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  fullName?: string;
  phone?: string;
  email?: string;              // Valid email
  classId?: string;            // UUID
  sectionId?: string;          // UUID
  rollNumber?: string;
  dob?: string;                // YYYY-MM-DD format
  gender?: 'male' | 'female' | 'other';
  additionalMetadata?: Record<string, any>;
}
```

#### **Student Self Update**
Students can update their own basic information.

```http
PATCH /api/v1/students/me
Authorization: Bearer <student-jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  fullName?: string;
  phone?: string;
  dob?: string;                // YYYY-MM-DD format
  gender?: 'male' | 'female' | 'other';
  additionalMetadata?: Record<string, any>;
  // Profile fields
  bio?: string;
  profilePhotoUrl?: string;
  emergencyContact?: Record<string, any>;
  interests?: Record<string, any>;
  additionalData?: Record<string, any>;
}
```

### **4. Parent Management APIs**

#### **Get Student Parents**
Retrieves all parents linked to a student.

```http
GET /api/v1/students/:id/parents
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```typescript
Array<{
  id?: string;               // null for contact-only parents
  fullName: string;
  email: string;
  phone?: string;
  relationship: string;
  isPrimary: boolean;
}>
```

#### **Set Primary Parent**
Sets any parent (user or contact) as primary. Handles all scenarios.

```http
PATCH /api/v1/students/:id/parents/:linkId/set-primary
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  password?: string;          // Optional, auto-generated if missing for contacts
}
```

**Response:**
```typescript
{
  message: string;
  primaryParent: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  temporaryPassword?: string;   // If new account was created
  previousPrimaryDisabled?: boolean;  // Always true when switching
}
```

### **5. Profile Management APIs**

#### **Update Student Profile**
Updates detailed student profile (admin only).

```http
PATCH /api/v1/students/:id/profile
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  bio?: string;
  profilePhotoUrl?: string;    // Valid URL
  emergencyContact?: Record<string, any>;
  interests?: Record<string, any>;
  additionalData?: Record<string, any>;
}
```

### **6. Parent-Specific APIs**

#### **Get Children (Parent View)**
Parents can view their linked children.

```http
GET /api/v1/students/me/children
Authorization: Bearer <parent-jwt-token>
```

**Response:**
```typescript
Array<{
  relationship: string;
  isPrimary: boolean;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    rollNumber: string;
    class: {
      id: string;
      name: string;
    };
    section: {
      id: string;
      name: string;
    };
    profile?: Record<string, any>;
  };
}>
```

#### **Get All Parents**
Admin can view all parent users with pagination.

```http
GET /api/v1/students/parents?page=1&limit=20&search=term
Authorization: Bearer <admin-jwt-token>
```

### **7. Administrative APIs**

#### **Soft Delete Student**
Soft deletes a student and deactivates their account.

```http
DELETE /api/v1/students/:id
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```typescript
{
  message: string;
  id: string;
}
```

---

## 📝 **DTOs & Schemas**

### **Student DTOs**

```typescript
// Create Student with New Parents DTO
export const CreateStudentWithNewParentsDto = z.object({
  user: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    password: z.string().optional(),
  }),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  additionalMetadata: z.record(z.any()).optional(),
  profile: z.object({
    bio: z.string().optional(),
    profilePhotoUrl: z.string().url().optional(),
    emergencyContact: z.record(z.any()).optional(),
    interests: z.record(z.any()).optional(),
    additionalData: z.record(z.any()).optional(),
  }).optional(),
  parents: z.array(
    z.object({
      fullName: z.string().min(1, 'Parent full name is required'),
      email: z.string().email('Invalid parent email'),
      phone: z.string().optional(),
      password: z.string().optional(),
      relationship: z.string().min(1, 'Relationship is required'),
      isPrimary: z.boolean(),
      createUserAccount: z.boolean().optional().default(false),
    })
  ).min(1, 'At least one parent is required')
  .refine(
    (parents) => parents.filter(p => p.isPrimary).length === 1,
    { message: 'Exactly one parent must be marked as primary' }
  ),
});

// Create Student with Existing Parents DTO  
export const CreateStudentWithExistingParentsDto = z.object({
  user: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    password: z.string().optional(),
  }),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  additionalMetadata: z.record(z.any()).optional(),
  profile: z.object({
    bio: z.string().optional(),
    profilePhotoUrl: z.string().url().optional(),
    emergencyContact: z.record(z.any()).optional(),
    interests: z.record(z.any()).optional(),
    additionalData: z.record(z.any()).optional(),
  }).optional(),
  parents: z.array(
    z.object({
      email: z.string().email('Parent email is required'),
      relationship: z.string().min(1, 'Relationship is required'),
      isPrimary: z.boolean(),
      fullName: z.string().optional(),
    })
  ).min(1, 'At least one parent is required'),
});

// Update Student DTO
export const UpdateStudentDto = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  rollNumber: z.string().optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  additionalMetadata: z.record(z.any()).optional(),
});

// Set Primary Parent DTO
export const SetPrimaryParentDto = z.object({
  password: z.string().optional(),
});
```

### **Query DTOs**

```typescript
// Get All Students Query DTO
export const GetAllStudentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  search: z.string().optional(),
});
```

---

## 🗄️ **Database Relationships**

### **Core Tables**

```sql
-- Users table (shared across modules)
User {
  id: String (UUID, Primary Key)
  email: String (Unique)
  fullName: String
  phone: String?
  passwordHash: String
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime?
  deletedAt: DateTime?
  createdById: String?
  updatedById: String?
  deletedById: String?
}

-- Students table
Student {
  id: String (UUID, Primary Key)
  userId: String (Foreign Key -> User.id)
  classId: String (Foreign Key -> Class.id)
  sectionId: String (Foreign Key -> Section.id)
  rollNumber: String
  dob: DateTime
  gender: Enum (male, female, other)
  additionalMetadata: Json
  createdAt: DateTime
  updatedAt: DateTime?
  deletedAt: DateTime?
  createdById: String?
  updatedById: String?
  deletedById: String?
}

-- Student Profiles table
StudentProfile {
  id: String (UUID, Primary Key)
  studentId: String (Foreign Key -> Student.id, Unique)
  bio: String?
  profilePhotoUrl: String?
  emergencyContact: Json
  interests: Json
  additionalData: Json
  createdAt: DateTime
  updatedAt: DateTime?
  createdById: String?
  updatedById: String?
}

-- Parent-Student Links table
ParentStudentLink {
  id: String (UUID, Primary Key)
  parentId: String? (Foreign Key -> User.id, nullable for contacts)
  studentId: String (Foreign Key -> Student.id)
  relationship: String
  isPrimary: Boolean
  contactName: String? (for contact-only parents)
  contactEmail: String? (for contact-only parents)
  contactPhone: String? (for contact-only parents)
  createdAt: DateTime
  updatedAt: DateTime?
  deletedAt: DateTime?
  createdById: String?
  updatedById: String?
  deletedById: String?
}
```

### **Relationships**

```typescript
// User Relations
User {
  roles: UserRole[]
  createdStudents: Student[] @relation("CreatedStudents")
  updatedStudents: Student[] @relation("UpdatedStudents")
  deletedStudents: Student[] @relation("DeletedStudents")
  parentLinks: ParentStudentLink[] @relation("ParentLinks")
  studentProfile: Student? @relation("StudentUser")
}

// Student Relations  
Student {
  user: User @relation("StudentUser")
  class: Class
  section: Section
  profile: StudentProfile?
  parents: ParentStudentLink[]
  createdBy: User? @relation("CreatedStudents")
  updatedBy: User? @relation("UpdatedStudents")
  deletedBy: User? @relation("DeletedStudents")
}

// ParentStudentLink Relations
ParentStudentLink {
  parent: User? @relation("ParentLinks")
  student: Student
  createdBy: User?
  updatedBy: User?
  deletedBy: User?
}
```

---

## 🔐 **Authentication & Authorization**

### **Roles & Permissions**

| Role | Endpoint Access | Description |
|------|----------------|-------------|
| **SUPERADMIN** | All endpoints | Full system access |
| **ADMIN** | All student endpoints except self-update | School administration |
| **TEACHER** | Read student data | View students in their classes |
| **PARENT** | View own children, limited student data | Parent portal access |
| **STUDENT** | Self-update, view own profile | Student portal access |

### **Authorization Rules**

```typescript
// Student Access Control
async findById(studentId: string, currentUser: any) {
  const { id: userId, roleNames } = currentUser;
  
  // Admin/Teacher: Full access
  const isAdminOrTeacher = roleNames.some(r => 
    ['SUPERADMIN', 'ADMIN', 'TEACHER'].includes(r)
  );
  
  // Student: Own record only
  const isSelf = student.userId === userId;
  
  // Parent: Linked children only
  const isLinkedParent = await this.prisma.parentStudentLink.findFirst({
    where: { parentId: userId, studentId }
  });
  
  if (!isAdminOrTeacher && !isSelf && !isLinkedParent) {
    throw new NotFoundException('Access denied');
  }
}
```

### **JWT Token Structure**

```typescript
// JWT Payload
{
  sub: string;              // User ID
  email: string;            // User email
  fullName: string;         // User full name
  roles: Array<{            // User roles
    role: {
      name: string;         // Role name (ADMIN, TEACHER, etc.)
    }
  }>;
  iat: number;              // Issued at
  exp: number;              // Expires at
}
```

---

## 👥 **Parent Management System**

### **Parent Types**

1. **Primary Parent User**
   - Full user account with login credentials
   - Can access parent portal
   - Receives primary communications
   - Handles billing and permissions

2. **Secondary Parent User**
   - Full user account with login credentials
   - Limited portal access
   - Receives notifications

3. **Contact-Only Parent**
   - No user account (contact information only)
   - Cannot login to system
   - Can be promoted to user account

### **Primary Parent Rules**

```typescript
// Business Rules
1. Every student MUST have exactly one primary parent
2. Primary parent MUST have a user account
3. When switching primary:
   - Previous primary gets DISABLED
   - New primary gets ENABLED
   - Contact parents get auto-promoted to users
4. Only primary parents handle:
   - Fee payments
   - Permission forms
   - Major communications
```

### **Parent Switching Logic**

```typescript
// Automatic Parent Account Management
async setPrimaryParent(studentId: string, parentLinkId: string) {
  // 1. Get target parent (user or contact)
  const targetParent = await getParentLink(parentLinkId);
  
  // 2. If contact, create user account
  if (!targetParent.parentId) {
    const newUser = await createParentUser(targetParent.contactData);
    targetParent.parentId = newUser.id;
  }
  
  // 3. Disable current primary
  await disableCurrentPrimary(studentId);
  
  // 4. Enable new primary
  await enableNewPrimary(targetParent.parentId);
  
  // 5. Update primary status
  await updatePrimaryStatus(parentLinkId, true);
}
```

---

## ⚠️ **Error Handling**

### **Common Error Codes**

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| **400** | BadRequestException | Invalid input data |
| **401** | UnauthorizedException | Authentication required |
| **403** | ForbiddenException | Insufficient permissions |
| **404** | NotFoundException | Resource not found |
| **409** | ConflictException | Duplicate resource |
| **500** | InternalServerErrorException | Server error |

### **Validation Errors**

```typescript
// Zod Validation Errors
{
  "statusCode": 400,
  "message": [
    {
      "field": "user.email",
      "message": "Invalid email"
    },
    {
      "field": "parents",
      "message": "Exactly one parent must be marked as primary"
    }
  ],
  "error": "Bad Request"
}
```

### **Business Logic Errors**

```typescript
// Custom Business Errors
{
  "statusCode": 400,
  "message": "Primary parent with email john@example.com not found. Please create parent first or use the new parents creation API.",
  "error": "Bad Request"
}

{
  "statusCode": 409,
  "message": "Student email already exists",
  "error": "Conflict"
}

{
  "statusCode": 401,
  "message": "Account is disabled", 
  "error": "Unauthorized"
}
```

---

## 💡 **Usage Examples**

### **Complete Family Creation Workflow**

```typescript
// 1. Create first child with new parents
const firstChild = await fetch('/api/v1/students/create-with-new-parents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user: {
      fullName: "John Doe",
      email: "john@school.com"
    },
    classId: "class-uuid",
    sectionId: "section-uuid",
    rollNumber: "001",
    dob: "2010-05-15",
    gender: "male",
    parents: [
      {
        fullName: "Robert Doe",
        email: "robert@example.com",
        relationship: "father",
        isPrimary: true,
        createUserAccount: true
      },
      {
        fullName: "Sarah Doe", 
        email: "sarah@example.com",
        relationship: "mother",
        isPrimary: false,
        createUserAccount: false
      }
    ]
  })
});

// 2. Create sibling with existing parents
const sibling = await fetch('/api/v1/students/create-with-existing-parents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user: {
      fullName: "Jane Doe",
      email: "jane@school.com"
    },
    classId: "class-uuid",
    sectionId: "section-uuid", 
    rollNumber: "002",
    dob: "2012-08-20",
    gender: "female",
    parents: [
      {
        email: "robert@example.com",
        relationship: "father", 
        isPrimary: true
      },
      {
        email: "sarah@example.com",
        relationship: "mother",
        fullName: "Sarah Doe",
        isPrimary: false
      }
    ]
  })
});

// 3. Switch primary parent (promote contact to user)
const switchPrimary = await fetch(`/api/v1/students/${sibling.student.id}/parents/${sarahLinkId}/set-primary`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer <admin-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    password: "SarahSecure2024!"
  })
});
```

### **Parent Portal Access**

```typescript
// Parent login
const parentLogin = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "robert@example.com",
    password: "RobertSecure2024!"
  })
});

// Get children
const children = await fetch('/api/v1/students/me/children', {
  headers: { 'Authorization': `Bearer ${parentLogin.accessToken}` }
});
```

### **Student Self-Update**

```typescript
// Student updating own profile
const updateProfile = await fetch('/api/v1/students/me', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer <student-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: "+1-555-9999",
    bio: "Updated bio information",
    interests: {
      sports: ["basketball", "swimming"],
      hobbies: ["reading", "gaming"]
    }
  })
});
```

---

## ✅ **Best Practices**

### **1. Parent Management**

```typescript
// ✅ DO: Always have exactly one primary parent
parents: [
  { isPrimary: true, relationship: "father" },   // One primary
  { isPrimary: false, relationship: "mother" }   // Others non-primary
]

// ❌ DON'T: Multiple or zero primary parents
parents: [
  { isPrimary: true, relationship: "father" },   // ❌ Multiple primary
  { isPrimary: true, relationship: "mother" }    // ❌ Multiple primary
]
```

### **2. Email Validation**

```typescript
// ✅ DO: Use proper email validation
email: "user@example.com"

// ❌ DON'T: Invalid email formats
email: "invalid-email"        // ❌ No @ symbol
email: "user@"               // ❌ Incomplete domain
```

### **3. Password Management**

```typescript
// ✅ DO: Let system generate secure passwords when not provided
{
  email: "user@example.com",
  // password: undefined     // System generates secure password
}

// ✅ DO: Provide strong passwords when specified
{
  email: "user@example.com",
  password: "SecurePass123!" // Strong password
}
```

### **4. Role-Based Access**

```typescript
// ✅ DO: Check permissions before operations
@UseGuards(hasRole('SUPERADMIN', 'ADMIN'))
async createStudent() { /* ... */ }

// ✅ DO: Validate user access to specific students  
async findById(studentId: string, currentUser: any) {
  // Check if user has access to this specific student
  await this.validateAccess(studentId, currentUser);
}
```

### **5. Error Handling**

```typescript
// ✅ DO: Provide clear, actionable error messages
throw new BadRequestException(
  'Primary parent with email john@example.com not found. Please create parent first or use the new parents creation API.'
);

// ❌ DON'T: Generic error messages
throw new BadRequestException('Invalid request');
```

### **6. Data Validation**

```typescript
// ✅ DO: Validate all input data
export const CreateStudentDto = z.object({
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  // ... other validations
});

// ✅ DO: Sanitize and validate file uploads
profilePhotoUrl: z.string().url().optional()
```

### **7. Performance Optimization**

```typescript
// ✅ DO: Use pagination for large datasets
GET /api/v1/students?page=1&limit=20

// ✅ DO: Include necessary relations only
include: {
  user: { select: { fullName: true, email: true } },
  class: true,
  section: true,
  // Don't include heavy relations unless needed
}

// ✅ DO: Use database transactions for related operations
await this.prisma.$transaction(async (tx) => {
  await tx.user.create({ /* ... */ });
  await tx.student.create({ /* ... */ });
  await tx.parentStudentLink.create({ /* ... */ });
});
```

### **8. Security Considerations**

```typescript
// ✅ DO: Always validate ownership/access
const student = await this.findById(studentId, currentUser);

// ✅ DO: Use soft deletes for data retention
deletedAt: new Date(),
deletedById: actorId

// ✅ DO: Audit all important operations
await this.audit.record({
  userId: actorId,
  action: 'CREATE_STUDENT',
  module: 'student',
  status: 'SUCCESS',
  details: { studentId, userId },
  ipAddress: ip,
  userAgent,
});
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

1. **"Parent not found" error when creating sibling**
   - **Cause:** Primary parent email doesn't exist as user
   - **Solution:** Ensure primary parent was created with `createUserAccount: true`

2. **"Account is disabled" on login**
   - **Cause:** Parent account was disabled during primary switching
   - **Solution:** Use set-primary API to re-enable the account

3. **"Exactly one parent must be marked as primary"**
   - **Cause:** Multiple or zero parents marked as primary
   - **Solution:** Ensure exactly one parent has `isPrimary: true`

4. **Permission denied accessing student**
   - **Cause:** User doesn't have access to specific student
   - **Solution:** Check role permissions and parent-student links

---

This documentation covers the complete Student Module functionality. For specific implementation details or advanced use cases, refer to the source code or contact the development team.