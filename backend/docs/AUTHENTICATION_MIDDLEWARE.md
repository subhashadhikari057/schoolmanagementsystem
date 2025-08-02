# 🔐 Authentication Middleware Documentation

## Overview

This document provides comprehensive documentation for the authentication middleware system implemented in the School Management System. The system includes JWT-based authentication, role-based access control (RBAC), session validation, and comprehensive security features.

## 🏗️ Architecture

The authentication system consists of several key components:

1. **JWT Authentication Guard** - Validates JWT tokens and attaches user data to requests
2. **Roles Guard** - Enforces role-based access control
3. **Session Validation Middleware** - Validates user sessions and handles security
4. **User Decorators** - Provides easy access to authenticated user data
5. **Role Decorators** - Simplifies role-based access control implementation

## 🔑 JWT Authentication Guard

### Purpose

The `JwtAuthGuard` validates JWT access tokens and ensures only authenticated users can access protected routes.

### Features

- JWT token validation using RS256 algorithm
- Session validation against database
- User data attachment to request object
- Public route support via `@Public()` decorator
- Comprehensive error handling and logging

### Usage

```typescript
import { JwtAuthGuard, Public } from '../shared/guards/jwt-auth.guard';

@Controller('api/users')
export class UsersController {
  // Protected by default (requires JWT token)
  @Get()
  getUsers() {
    return this.usersService.findAll();
  }

  // Public route (no authentication required)
  @Public()
  @Get('public-info')
  getPublicInfo() {
    return { message: 'Public information' };
  }
}
```

### Configuration

The guard automatically applies to all routes when configured as a global guard. Use `@Public()` decorator to bypass authentication for specific routes.

## 🛡️ Role-Based Access Control

### Roles Hierarchy

The system implements a hierarchical role system:

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin', // Level 100
  ADMIN = 'admin', // Level 80
  ACCOUNTANT = 'accountant', // Level 60
  TEACHER = 'teacher', // Level 40
  PARENT = 'parent', // Level 20
  STUDENT = 'student', // Level 10
}
```

### Role Decorators

#### @Roles(...roles)

Specifies exact roles that can access a route:

```typescript
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from 'shared-types';

@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Get('admin-only')
getAdminData() {
  return this.service.getAdminData();
}
```

#### @MinRole(role)

Specifies minimum role level required (allows higher roles):

```typescript
import { MinRole } from '../shared/decorators/roles.decorator';

@MinRole(UserRole.TEACHER)
@Get('academic-data')
getAcademicData() {
  // Accessible by TEACHER, ADMIN, SUPER_ADMIN
  return this.service.getAcademicData();
}
```

#### Role Access Helper Classes

Pre-defined role combinations for common scenarios:

```typescript
import { RoleAccess } from '../shared/decorators/roles.decorator';

// Super Admin only
@RoleAccess.SuperAdminOnly()
@Get('system-config')
getSystemConfig() { }

// Admin level (Admin + Super Admin)
@RoleAccess.AdminLevel()
@Get('admin-dashboard')
getAdminDashboard() { }

// Financial operations (Super Admin + Admin + Accountant)
@RoleAccess.Financial()
@Get('financial-reports')
getFinancialReports() { }

// Academic operations (Super Admin + Admin + Teacher)
@RoleAccess.Academic()
@Get('academic-reports')
getAcademicReports() { }

// Teacher level and above
@RoleAccess.TeacherLevel()
@Get('class-management')
getClassManagement() { }

// Parent level and above (excludes Student)
@RoleAccess.ParentLevel()
@Get('communication')
getCommunication() { }
```

## 👤 User Decorators

Extract authenticated user data from requests:

```typescript
import {
  User,
  UserId,
  UserEmail,
  UserRole,
  SessionId,
} from '../shared/decorators/user.decorator';

@Controller('profile')
export class ProfileController {
  // Get complete user object
  @Get()
  getProfile(@User() user: AuthenticatedUser) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: user.sessionId,
    };
  }

  // Get specific user properties
  @Get('info')
  getUserInfo(
    @UserId() userId: string,
    @UserEmail() email: string,
    @UserRole() role: UserRole,
    @SessionId() sessionId: string,
  ) {
    return { userId, email, role, sessionId };
  }
}
```

## 🔒 Session Validation Middleware

### Purpose

Provides additional security layer beyond JWT validation by managing session state and security policies.

### Features

- Session expiration based on inactivity
- IP address validation (optional)
- User agent consistency checking
- Automatic session revocation
- Security event logging

### Configuration

```typescript
import { SessionValidationMiddleware } from '../shared/middlewares/session-validation.middleware';

// Default configuration
const middleware = new SessionValidationMiddleware(prisma, auditService);

// Custom configuration
const customMiddleware = new SessionValidationMiddleware(prisma, auditService, {
  maxIdleTime: 60, // 60 minutes
  updateLastActivity: true, // Update activity on each request
  validateIpAddress: false, // Don't validate IP (default)
  validateUserAgent: true, // Validate user agent (default)
});
```

### Security Features

1. **Idle Timeout**: Sessions expire after configured inactivity period
2. **IP Validation**: Optional IP address consistency checking
3. **User Agent Monitoring**: Logs suspicious user agent changes
4. **Automatic Revocation**: Invalid sessions are automatically revoked
5. **Audit Trail**: All security events are logged for monitoring

## 🚀 Implementation Examples

### Basic Protected Controller

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { User, UserId } from '../shared/decorators/user.decorator';
import { Roles, MinRole } from '../shared/decorators/roles.decorator';
import { UserRole } from 'shared-types';

@Controller('api/students')
export class StudentsController {
  // All authenticated users can view students
  @Get()
  getStudents(@User() user: AuthenticatedUser) {
    return this.studentsService.findAll(user.role);
  }

  // Only admins can create students
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  // Teachers and above can view student details
  @MinRole(UserRole.TEACHER)
  @Get(':id')
  getStudent(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }
}
```

### Advanced Role-Based Controller

```typescript
@Controller('api/finance')
export class FinanceController {
  // Financial staff only
  @RoleAccess.Financial()
  @Get('reports')
  getFinancialReports(@UserRole() role: UserRole) {
    return this.financeService.getReports(role);
  }

  // Super admin only for sensitive operations
  @RoleAccess.SuperAdminOnly()
  @Post('salary/process')
  processSalaries() {
    return this.financeService.processSalaries();
  }

  // Students and parents can view their own fee information
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @Get('fees/my')
  getMyFees(@UserId() userId: string) {
    return this.financeService.getUserFees(userId);
  }
}
```

## 🧪 Testing

### Unit Tests

Each component includes comprehensive unit tests:

- `jwt-auth.guard.spec.ts` - JWT authentication guard tests
- `roles.decorator.spec.ts` - Role-based access control tests
- `session-validation.middleware.spec.ts` - Session validation tests

### Integration Tests

End-to-end authentication flow testing:

- `auth-integration.spec.ts` - Complete authentication system tests

### Running Tests

```bash
# Run all authentication tests
npm test -- --testPathPattern="auth|guards|decorators"

# Run specific test files
npm test jwt-auth.guard.spec.ts
npm test roles.decorator.spec.ts
npm test session-validation.middleware.spec.ts
```

## 🔧 Configuration

### Environment Variables

Required environment variables for JWT authentication:

```env
# JWT Configuration
JWT_PRIVATE_KEY_BASE64=<base64-encoded-private-key>
JWT_PUBLIC_KEY_BASE64=<base64-encoded-public-key>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
```

### Module Setup

Add the authentication module to your app:

```typescript
import { AuthGuardModule } from './shared/auth/auth.module';

@Module({
  imports: [
    // ... other modules
    AuthGuardModule, // Provides global guards
  ],
})
export class AppModule {}
```

## 🛠️ Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if JWT token is properly formatted: `Bearer <token>`
   - Verify token hasn't expired
   - Ensure user session is still active

2. **403 Forbidden**
   - User doesn't have required role
   - Check role hierarchy and permissions
   - Verify role assignments in database

3. **Session Validation Errors**
   - Session may have expired due to inactivity
   - IP address mismatch (if validation enabled)
   - Session manually revoked

### Debugging

Enable debug logging for authentication issues:

```typescript
// In your controller or service
private readonly logger = new Logger(YourController.name);

@Get('protected')
getProtected(@User() user: AuthenticatedUser) {
  this.logger.debug(`User ${user.id} accessed protected route`, {
    userId: user.id,
    role: user.role,
    sessionId: user.sessionId,
  });

  return this.service.getData();
}
```

## 🔄 Migration Guide

### From Basic Authentication

If migrating from a basic authentication system:

1. Install the new authentication modules
2. Update controllers to use new decorators
3. Configure role-based access control
4. Test all protected routes
5. Update frontend to handle new token format

### Database Updates

Ensure your database has the required tables:

- `User` - User accounts
- `Role` - Available roles
- `UserRole` - User-role assignments
- `UserSession` - Active sessions
- `Permission` - Granular permissions (optional)

## 📚 API Reference

### Guards

- `JwtAuthGuard` - JWT token validation
- `RolesGuard` - Role-based access control

### Decorators

- `@Public()` - Mark routes as public
- `@Roles(...roles)` - Specify required roles
- `@MinRole(role)` - Specify minimum role level
- `@User()` - Extract user data
- `@UserId()` - Extract user ID
- `@UserEmail()` - Extract user email
- `@UserRole()` - Extract user role
- `@SessionId()` - Extract session ID

### Middleware

- `SessionValidationMiddleware` - Session security validation

### Types

- `AuthenticatedUser` - User data interface
- `JwtPayload` - JWT token payload structure
- `SessionValidationConfig` - Session middleware configuration

## 🔐 Security Best Practices

1. **Token Management**
   - Use short-lived access tokens (15 minutes)
   - Implement token refresh mechanism
   - Store refresh tokens securely

2. **Session Security**
   - Enable session validation middleware
   - Configure appropriate idle timeouts
   - Monitor for suspicious activity

3. **Role Management**
   - Follow principle of least privilege
   - Regularly audit role assignments
   - Use hierarchical roles appropriately

4. **Monitoring**
   - Enable audit logging
   - Monitor authentication failures
   - Track session security violations

## 📈 Performance Considerations

1. **Database Queries**
   - Session validation queries are optimized
   - Consider caching user role data
   - Use database indexes on session lookups

2. **JWT Verification**
   - JWT verification is performed in-memory
   - Public key is cached after first load
   - Consider JWT caching for high-traffic scenarios

3. **Middleware Order**
   - Apply middlewares in correct order:
     1. TraceIdMiddleware
     2. SessionValidationMiddleware
     3. AuditMiddleware

This completes the comprehensive authentication middleware system for the School Management System. The implementation provides enterprise-level security with role-based access control, session management, and comprehensive audit trails.
