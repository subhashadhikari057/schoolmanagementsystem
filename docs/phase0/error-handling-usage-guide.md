# 🛠️ Error Handling Usage Guide & Best Practices

## 🎯 **Overview**
This guide provides practical examples and best practices for using the standardized error handling system in the School Management System. All components work together automatically to provide consistent, secure, and debuggable error responses.

## 🏗️ **How It Works**

### **Automatic Error Processing Flow**
```
1. Request comes in → TraceID Middleware adds UUID
2. Controller/Service throws exception → Any type of error
3. Global Exception Filter catches → Standardizes response format
4. Error logged and audited → For monitoring
5. Client receives standardized response → With trace ID for debugging
```

## 📋 **Common Usage Patterns**

### **1. Resource Not Found Errors**

**❌ Don't do this:**
```typescript
@Get(':id')
async getStudent(@Param('id') id: string) {
  const student = await this.studentService.findById(id);
  if (!student) {
    throw new NotFoundException('Student not found'); // Generic, no context
  }
  return student;
}
```

**✅ Do this:**
```typescript
@Get(':id')
async getStudent(@Param('id') id: string) {
  const student = await this.studentService.findById(id);
  if (!student) {
    // Will be automatically formatted by GlobalExceptionFilter
    this.errorService.throwNotFoundError('Student', id);
  }
  return student;
}
```

**Result:**
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Student with ID 'abc-123' not found",
  "code": "STUDENT_NOT_FOUND",
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "details": {
    "business": {
      "context": { "studentId": "abc-123" }
    }
  }
}
```

### **2. Permission/Authorization Errors**

**✅ Permission Denied:**
```typescript
@Delete(':id')
async deleteStudent(@Param('id') id: string, @Request() req) {
  const user = req.user;
  
  if (!this.hasPermission(user, 'DELETE_STUDENT')) {
    this.errorService.throwForbiddenError(
      'delete', 
      'student records',
      req.traceId
    );
  }
  
  return this.studentService.delete(id);
}
```

**Result:**
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized", 
  "message": "Insufficient permissions to delete student records",
  "code": "INSUFFICIENT_PERMISSIONS",
  "details": {
    "auth": {
      "reason": "INSUFFICIENT_PERMISSIONS",
      "requiredPermission": "delete student records"
    }
  }
}
```

### **3. Business Logic Errors**

**✅ Custom Business Rules:**
```typescript
async enrollStudent(studentId: string, courseId: string) {
  const student = await this.findById(studentId);
  const course = await this.courseService.findById(courseId);
  
  // Check business rule
  if (student.status === 'SUSPENDED') {
    this.errorService.throwBusinessError({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Cannot enroll suspended student in courses',
      code: 'STUDENT_SUSPENDED',
      rule: 'ENROLLMENT_ACTIVE_STUDENTS_ONLY',
      context: { 
        studentId, 
        courseId, 
        studentStatus: student.status 
      },
      suggestion: 'Remove suspension status before enrollment'
    });
  }
  
  // Check capacity
  if (course.enrolledCount >= course.maxCapacity) {
    this.errorService.throwBusinessError({
      statusCode: HttpStatus.CONFLICT,
      message: 'Course has reached maximum capacity',
      code: 'COURSE_FULL',
      rule: 'COURSE_CAPACITY_LIMIT',
      context: { 
        courseId, 
        currentEnrollment: course.enrolledCount,
        maxCapacity: course.maxCapacity
      },
      suggestion: 'Try enrolling in a different section or wait for available spots'
    });
  }
  
  return this.performEnrollment(student, course);
}
```

### **4. Validation Errors (Automatic)**

**✅ Using Zod DTOs (Automatic handling):**
```typescript
// DTO with Zod validation
export const CreateStudentSchema = z.object({
  email: z.string().email('Invalid email format'),
  age: z.number().min(16, 'Student must be at least 16 years old'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export class CreateStudentDto extends createZodDto(CreateStudentSchema) {}

// Controller - validation happens automatically
@Post()
async createStudent(@Body() dto: CreateStudentDto) {
  // If validation fails, GlobalExceptionFilter automatically
  // formats the Zod errors into standardized response
  return this.studentService.create(dto);
}
```

**Automatic Result for Invalid Data:**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "validation": [
      {
        "field": "email",
        "value": "invalid-email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      },
      {
        "field": "age", 
        "value": 15,
        "message": "Student must be at least 16 years old",
        "code": "INVALID_RANGE"
      }
    ]
  }
}
```

### **5. Database Errors (Automatic)**

**✅ Prisma Errors (Handled Automatically):**
```typescript
@Post()
async createStudent(@Body() dto: CreateStudentDto) {
  try {
    return await this.prisma.student.create({
      data: dto
    });
  } catch (error) {
    // GlobalExceptionFilter automatically handles Prisma errors
    // P2002 → Unique constraint violation
    // P2025 → Record not found  
    // P2003 → Foreign key constraint violation
    throw error; // Let the filter handle it
  }
}
```

**Automatic Result for Duplicate Email:**
```json
{
  "success": false,
  "statusCode": 409,
  "error": "Conflict",
  "message": "A record with this information already exists", 
  "code": "DUPLICATE_VALUE",
  "details": {
    "database": {
      "constraint": "unique_email"
    }
  }
}
```

## 🔍 **Debugging with Trace IDs**

### **Client-Side Debugging**
```typescript
// Frontend error handling
try {
  const response = await fetch('/api/students', {
    method: 'POST',
    body: JSON.stringify(studentData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    // Log trace ID for debugging
    console.error('API Error:', {
      traceId: error.traceId,
      message: error.message,
      code: error.code
    });
    
    // Show user-friendly message
    showError(`Error: ${error.message} (Trace ID: ${error.traceId})`);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### **Server-Side Request Correlation**
```typescript
@Post()
async createStudent(@Body() dto: CreateStudentDto, @Request() req) {
  const traceId = req.traceId;
  
  this.logger.log(`Creating student - Trace ID: ${traceId}`, {
    traceId,
    email: dto.email
  });
  
  try {
    const student = await this.studentService.create(dto);
    
    this.logger.log(`Student created successfully - Trace ID: ${traceId}`, {
      traceId,
      studentId: student.id
    });
    
    return student;
  } catch (error) {
    this.logger.error(`Student creation failed - Trace ID: ${traceId}`, error);
    throw error; // GlobalExceptionFilter will handle
  }
}
```

## 🛡️ **Security Best Practices**

### **✅ Safe Error Information**
```typescript
// Good - Generic message, no sensitive data
this.errorService.throwNotFoundError('Resource', id);

// Good - Business context without sensitive details  
this.errorService.throwBusinessError({
  message: 'Operation not allowed for current user role',
  code: 'INSUFFICIENT_PERMISSIONS',
  context: { requiredRole: 'ADMIN' } // Safe to expose
});
```

### **❌ Avoid Exposing Sensitive Data**
```typescript
// Bad - Exposes internal system details
throw new Error(`Database connection failed: ${dbPassword}`);

// Bad - Reveals user existence
throw new Error(`User john.doe@example.com not found`);

// Bad - Internal implementation details
throw new Error(`JWT secret validation failed: ${secret}`);
```

## 📊 **Monitoring & Alerting**

### **Log Analysis**
```typescript
// Logs are automatically structured for monitoring
// Error logs include:
{
  "level": "error",
  "message": "Student creation failed",
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "statusCode": 409,
  "code": "DUPLICATE_VALUE", 
  "endpoint": "/api/students",
  "method": "POST",
  "userId": "user-123",
  "timestamp": "2025-01-31T10:30:00.000Z"
}
```

### **Alerting Rules**
```yaml
# Example monitoring alerts
- name: "High Error Rate"
  condition: "error_rate > 5% for 5 minutes"
  
- name: "Database Errors"
  condition: "errors.code contains 'DATABASE_' for 2 minutes"
  
- name: "Critical Errors" 
  condition: "errors.severity = 'critical' for 1 minute"
```

## ⚡ **Performance Considerations**

### **✅ Efficient Error Handling**
```typescript
// Good - Fail fast with clear errors
@Get(':id')
async getStudent(@Param('id') id: string) {
  // Validate ID format before database query
  if (!isValidUUID(id)) {
    throw new BadRequestException('Invalid student ID format');
  }
  
  const student = await this.studentService.findById(id);
  if (!student) {
    this.errorService.throwNotFoundError('Student', id);
  }
  
  return student;
}
```

### **✅ Avoid Expensive Error Operations**
```typescript
// Good - Simple error creation
this.errorService.throwNotFoundError('Student', id);

// Avoid - Don't do expensive operations in error paths
// this.auditService.logDetailedError(await this.buildComplexContext());
```

## 🧪 **Testing Error Scenarios**

### **Unit Testing**
```typescript
describe('StudentController', () => {
  it('should throw not found error for invalid student ID', async () => {
    // Arrange
    const invalidId = 'non-existent-id';
    jest.spyOn(studentService, 'findById').mockResolvedValue(null);
    
    // Act & Assert
    await expect(controller.getStudent(invalidId))
      .rejects
      .toThrow('Student with ID \'non-existent-id\' not found');
  });
  
  it('should throw business error for suspended student enrollment', async () => {
    // Arrange
    const suspendedStudent = { id: '123', status: 'SUSPENDED' };
    jest.spyOn(studentService, 'findById').mockResolvedValue(suspendedStudent);
    
    // Act & Assert
    await expect(controller.enrollStudent('123', 'course-456'))
      .rejects
      .toThrow('Cannot enroll suspended student in courses');
  });
});
```

### **Integration Testing**
```typescript
describe('Error Handling Integration', () => {
  it('should return standardized error response', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/students/invalid-id')
      .expect(404);
      
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 404,
      error: 'Not Found',
      message: expect.stringContaining('Student'),
      code: 'STUDENT_NOT_FOUND',
      traceId: expect.any(String),
      timestamp: expect.any(String)
    });
    
    expect(response.headers['x-trace-id']).toBeDefined();
  });
});
```

## 📋 **Error Code Reference**

### **Common Error Codes**
```typescript
// Authentication & Authorization
'AUTHENTICATION_REQUIRED'     // 401 - No auth token
'INVALID_CREDENTIALS'          // 401 - Wrong login
'INSUFFICIENT_PERMISSIONS'     // 403 - No permission
'TOKEN_EXPIRED'               // 401 - Expired JWT

// Validation  
'VALIDATION_ERROR'            // 400 - Schema validation failed
'INVALID_FORMAT'              // 400 - Wrong data format
'REQUIRED_FIELD_MISSING'      // 400 - Missing required field

// Business Logic
'STUDENT_NOT_FOUND'           // 404 - Student doesn't exist
'COURSE_FULL'                 // 409 - Course at capacity
'ENROLLMENT_CLOSED'           // 403 - Past enrollment deadline

// Database
'DUPLICATE_VALUE'             // 409 - Unique constraint violation
'DATABASE_CONNECTION_FAILED'   // 500 - DB connection issue
'DATABASE_CONSTRAINT_VIOLATION' // 400 - FK constraint

// System
'INTERNAL_SERVER_ERROR'       // 500 - Unknown server error
'RATE_LIMIT_EXCEEDED'         // 429 - Too many requests
'SERVICE_UNAVAILABLE'         // 503 - External service down
```

## 🎯 **Quick Reference**

### **When to Use Each Method**

| Scenario | Method | Example |
|----------|--------|---------|
| Resource not found | `throwNotFoundError()` | Student, Course, Assignment |
| Permission denied | `throwForbiddenError()` | Delete, Update, Admin actions |
| Business rule violation | `throwBusinessError()` | Enrollment rules, Status checks |
| Invalid input format | Let Zod handle | Automatic via DTOs |
| Database constraint | Let Prisma handle | Automatic via GlobalExceptionFilter |

### **Response Headers**
- `X-Trace-ID` - Always present for debugging
- `Content-Type: application/json` - Always JSON responses
- `Cache-Control: no-cache` - Error responses not cached

### **HTTP Status Codes Used**
- `400` - Bad Request (validation, malformed data)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate data, business rule violation)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error (unexpected errors)

## ✅ **Checklist for Developers**

### **Before Implementing Error Handling**
- [ ] Check if existing error methods cover your use case
- [ ] Determine appropriate HTTP status code
- [ ] Identify what context information is safe to expose
- [ ] Consider if error should be logged/audited

### **When Adding New Error Types**
- [ ] Use existing `ErrorHandlingService` methods when possible
- [ ] Add new error codes to `shared-types` if needed
- [ ] Include relevant context without sensitive data
- [ ] Write tests for error scenarios
- [ ] Update documentation if adding new patterns

### **Testing Your Error Handling**
- [ ] Unit tests for error conditions
- [ ] Integration tests for full error response format
- [ ] Verify trace IDs are included
- [ ] Check that sensitive data is not exposed
- [ ] Confirm appropriate HTTP status codes

---

**🎉 With this standardized error handling system, you get consistent, secure, and debuggable error responses across your entire application!**