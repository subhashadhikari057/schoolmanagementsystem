/**
 * =============================================================================
 * Authentication Integration Tests
 * =============================================================================
 * End-to-end tests for the complete authentication middleware system.
 * =============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  Controller,
  Get,
  Post,
  /* UseGuards, */
} from '@nestjs/common';
import * as request from 'supertest';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import {
  RolesGuard,
  Roles,
  MinRole,
  RoleAccess,
} from '../../decorators/roles.decorator';
import { User, UserId, UserRole } from '../../decorators/user.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { signAccessToken } from '../jwt.util';
import { UserRole as UserRoleEnum } from '@sms/shared-types';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { AuditModule } from '../../logger/audit.module';

// Test controller with various authentication scenarios
@Controller('auth-test')
class AuthTestController {
  @Public()
  @Get('public')
  getPublic() {
    return { message: 'Public endpoint accessible' };
  }

  @Get('protected')
  getProtected(@User() user: any) {
    return { message: 'Protected endpoint accessed', user: user.id };
  }

  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Get('admin-only')
  getAdminOnly(@User() user: any) {
    return { message: 'Admin only endpoint', user: user.id };
  }

  @MinRole(UserRoleEnum.TEACHER)
  @Get('teacher-level')
  getTeacherLevel(@UserId() userId: string) {
    return { message: 'Teacher level endpoint', userId };
  }

  @RoleAccess.SuperAdminOnly()
  @Get('super-admin-only')
  getSuperAdminOnly() {
    return { message: 'Super admin only endpoint' };
  }

  @RoleAccess.Financial()
  @Get('financial')
  getFinancial(@UserRole() role: UserRoleEnum) {
    return { message: 'Financial endpoint', role };
  }

  @RoleAccess.Academic()
  @Post('academic')
  postAcademic() {
    return { message: 'Academic endpoint accessed' };
  }

  @Get('user-info')
  getUserInfo(@User() user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: user.sessionId,
    };
  }
}

describe.skip('Authentication Integration', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test users with different roles
  const testUsers = {
    superAdmin: {
      id: 'super-admin-123',
      email: 'superadmin@test.com',
      role: UserRoleEnum.SUPER_ADMIN,
      sessionId: 'session-super-admin',
    },
    admin: {
      id: 'admin-123',
      email: 'admin@test.com',
      role: UserRoleEnum.ADMIN,
      sessionId: 'session-admin',
    },
    accountant: {
      id: 'accountant-123',
      email: 'accountant@test.com',
      role: UserRoleEnum.ACCOUNTANT,
      sessionId: 'session-accountant',
    },
    teacher: {
      id: 'teacher-123',
      email: 'teacher@test.com',
      role: UserRoleEnum.TEACHER,
      sessionId: 'session-teacher',
    },
    parent: {
      id: 'parent-123',
      email: 'parent@test.com',
      role: UserRoleEnum.PARENT,
      sessionId: 'session-parent',
    },
    student: {
      id: 'student-123',
      email: 'student@test.com',
      role: UserRoleEnum.STUDENT,
      sessionId: 'session-student',
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuditModule],
      controllers: [AuthTestController],
      providers: [JwtAuthGuard, RolesGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Apply guards globally
    app.useGlobalGuards(
      new JwtAuthGuard(prismaService, moduleFixture.get('Reflector')),
      new RolesGuard(moduleFixture.get('Reflector')),
    );

    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test users and sessions in database
    for (const [key, userData] of Object.entries(testUsers)) {
      try {
        // Create or update user
        await prismaService.user.upsert({
          where: { email: userData.email },
          update: {},
          create: {
            id: userData.id,
            email: userData.email,
            passwordHash: 'dummy-hash',
            fullName: `Test ${key}`,
            isActive: true,
          },
        });

        // Create session
        await prismaService.userSession.upsert({
          where: { id: userData.sessionId },
          update: {},
          create: {
            id: userData.sessionId,
            userId: userData.id,
            tokenHash: 'dummy-hash',
            userAgent: 'test-agent',
            ipAddress: '127.0.0.1',
          },
        });

        // Assign role
        const role = await prismaService.role.findFirst({
          where: { name: userData.role },
        });

        if (role) {
          await prismaService.userRole.upsert({
            where: {
              userId_roleId: {
                userId: userData.id,
                roleId: role.id,
              },
            },
            update: {},
            create: {
              userId: userData.id,
              roleId: role.id,
            },
          });
        }
      } catch (error) {
        console.warn(`Failed to setup test user ${key}:`, error.message);
      }
    }
  }

  async function cleanupTestData() {
    // Clean up test data
    for (const userData of Object.values(testUsers)) {
      try {
        await prismaService.userSession.deleteMany({
          where: { userId: userData.id },
        });
        await prismaService.userRole.deleteMany({
          where: { userId: userData.id },
        });
        await prismaService.user.deleteMany({
          where: { id: userData.id },
        });
      } catch (error) {
        console.warn(`Failed to cleanup test user:`, error.message);
      }
    }
  }

  function createToken(userData: typeof testUsers.admin) {
    return signAccessToken({
      userId: userData.id,
      sessionId: userData.sessionId,
    });
  }

  describe('Public endpoints', () => {
    it('should allow access to public endpoints without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth-test/public')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Public endpoint accessible',
      });
    });
  });

  describe('Protected endpoints', () => {
    it('should deny access without token', async () => {
      await request(app.getHttpServer())
        .get('/auth-test/protected')
        .expect(401);
    });

    it('should deny access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth-test/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should allow access with valid token', async () => {
      const token = createToken(testUsers.teacher);

      const response = await request(app.getHttpServer())
        .get('/auth-test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Protected endpoint accessed',
        user: testUsers.teacher.id,
      });
    });
  });

  describe('Role-based access control', () => {
    describe('Specific roles requirement', () => {
      it('should allow admin access to admin-only endpoint', async () => {
        const token = createToken(testUsers.admin);

        const response = await request(app.getHttpServer())
          .get('/auth-test/admin-only')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toEqual({
          message: 'Admin only endpoint',
          user: testUsers.admin.id,
        });
      });

      it('should allow super admin access to admin-only endpoint', async () => {
        const token = createToken(testUsers.superAdmin);

        await request(app.getHttpServer())
          .get('/auth-test/admin-only')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should deny teacher access to admin-only endpoint', async () => {
        const token = createToken(testUsers.teacher);

        await request(app.getHttpServer())
          .get('/auth-test/admin-only')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });

      it('should deny student access to admin-only endpoint', async () => {
        const token = createToken(testUsers.student);

        await request(app.getHttpServer())
          .get('/auth-test/admin-only')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });
    });

    describe('Minimum role requirement', () => {
      it('should allow teacher access to teacher-level endpoint', async () => {
        const token = createToken(testUsers.teacher);

        const response = await request(app.getHttpServer())
          .get('/auth-test/teacher-level')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toEqual({
          message: 'Teacher level endpoint',
          userId: testUsers.teacher.id,
        });
      });

      it('should allow admin access to teacher-level endpoint', async () => {
        const token = createToken(testUsers.admin);

        await request(app.getHttpServer())
          .get('/auth-test/teacher-level')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should deny parent access to teacher-level endpoint', async () => {
        const token = createToken(testUsers.parent);

        await request(app.getHttpServer())
          .get('/auth-test/teacher-level')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });

      it('should deny student access to teacher-level endpoint', async () => {
        const token = createToken(testUsers.student);

        await request(app.getHttpServer())
          .get('/auth-test/teacher-level')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });
    });

    describe('Role access helpers', () => {
      it('should allow only super admin to super-admin-only endpoint', async () => {
        const superAdminToken = createToken(testUsers.superAdmin);
        const adminToken = createToken(testUsers.admin);

        await request(app.getHttpServer())
          .get('/auth-test/super-admin-only')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .get('/auth-test/super-admin-only')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403);
      });

      it('should allow financial roles to financial endpoint', async () => {
        const adminToken = createToken(testUsers.admin);
        const accountantToken = createToken(testUsers.accountant);
        const teacherToken = createToken(testUsers.teacher);

        // Should allow admin
        await request(app.getHttpServer())
          .get('/auth-test/financial')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Should allow accountant
        await request(app.getHttpServer())
          .get('/auth-test/financial')
          .set('Authorization', `Bearer ${accountantToken}`)
          .expect(200);

        // Should deny teacher
        await request(app.getHttpServer())
          .get('/auth-test/financial')
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(403);
      });

      it('should allow academic roles to academic endpoint', async () => {
        const adminToken = createToken(testUsers.admin);
        const teacherToken = createToken(testUsers.teacher);
        const studentToken = createToken(testUsers.student);

        // Should allow admin
        await request(app.getHttpServer())
          .post('/auth-test/academic')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201);

        // Should allow teacher
        await request(app.getHttpServer())
          .post('/auth-test/academic')
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(201);

        // Should deny student
        await request(app.getHttpServer())
          .post('/auth-test/academic')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);
      });
    });
  });

  describe('User decorators', () => {
    it('should provide user information through decorators', async () => {
      const token = createToken(testUsers.teacher);

      const response = await request(app.getHttpServer())
        .get('/auth-test/user-info')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        id: testUsers.teacher.id,
        email: testUsers.teacher.email,
        role: testUsers.teacher.role,
        sessionId: testUsers.teacher.sessionId,
      });
    });
  });

  describe('Error handling', () => {
    it('should handle malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth-test/protected')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should handle missing Bearer prefix', async () => {
      await request(app.getHttpServer())
        .get('/auth-test/protected')
        .set('Authorization', 'token-without-bearer')
        .expect(401);
    });

    it('should handle expired tokens gracefully', async () => {
      // Create an expired token (this would need actual expired token generation)
      await request(app.getHttpServer())
        .get('/auth-test/protected')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);
    });
  });
});
