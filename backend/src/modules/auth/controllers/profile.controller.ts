/**
 * =============================================================================
 * Profile Controller
 * =============================================================================
 * Example controller demonstrating usage of authentication middleware,
 * role-based access control, and user decorators.
 * =============================================================================
 */

import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  User,
  UserId,
  UserEmail,
} from '../../../shared/decorators/user.decorator';
import {
  Roles,
  MinRole,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { Public } from '../../../shared/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../../shared/guards/jwt-auth.guard';
import { UserRole } from 'shared-types';

// @ApiTags('Profile')
// @ApiBearerAuth()
@Controller('api/v1/profile')
export class ProfileController {
  /**
   * Get current user profile
   * Available to all authenticated users
   */
  @Get()
  // @ApiOperation({ summary: 'Get current user profile' })
  // @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  getProfile(@User() user: AuthenticatedUser) {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Update user profile
   * Available to all authenticated users (users can update their own profile)
   */
  @Put()
  // @ApiOperation({ summary: 'Update current user profile' })
  // @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @UserId() userId: string,
    @Body() updateData: { fullName?: string; phone?: string },
  ) {
    // Implementation would update user profile
    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId,
        ...updateData,
      },
    };
  }

  /**
   * Get user permissions
   * Available to all authenticated users
   */
  @Get('permissions')
  // @ApiOperation({ summary: 'Get current user permissions' })
  // @ApiResponse({ status: 200, description: 'User permissions retrieved' })
  getUserPermissions(@User() user: AuthenticatedUser) {
    // This would typically fetch from database
    const rolePermissions = {
      [UserRole.SUPER_ADMIN]: ['*'], // All permissions
      [UserRole.ADMIN]: [
        'user:read',
        'user:write',
        'academic:read',
        'academic:write',
      ],
      [UserRole.ACCOUNTANT]: ['finance:read', 'finance:write', 'user:read'],
      [UserRole.TEACHER]: ['academic:read', 'academic:write', 'student:read'],
      [UserRole.PARENT]: ['student:read', 'communication:read'],
      [UserRole.STUDENT]: ['profile:read', 'academic:read'],
    };

    return {
      success: true,
      data: {
        role: user.role,
        permissions: rolePermissions[user.role] || [],
      },
    };
  }

  /**
   * Admin-only endpoint example
   * Only accessible by Admin and Super Admin
   */
  @Get('admin/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  // @ApiOperation({ summary: 'Get admin statistics' })
  // @ApiResponse({ status: 200, description: 'Admin stats retrieved' })
  getAdminStats(@User() user: AuthenticatedUser) {
    return {
      success: true,
      data: {
        message: 'Admin statistics',
        requestedBy: user.email,
        role: user.role,
        // Would include actual statistics
      },
    };
  }

  /**
   * Teacher-level endpoint example
   * Accessible by Teacher, Admin, and Super Admin
   */
  @Get('academic/summary')
  @MinRole(UserRole.TEACHER)
  // @ApiOperation({ summary: 'Get academic summary' })
  // @ApiResponse({ status: 200, description: 'Academic summary retrieved' })
  getAcademicSummary(@User() user: AuthenticatedUser) {
    return {
      success: true,
      data: {
        message: 'Academic summary data',
        accessLevel: user.role,
        // Would include actual academic data
      },
    };
  }

  /**
   * Financial data endpoint
   * Accessible by Super Admin, Admin, and Accountant only
   */
  @Get('financial/overview')
  @RoleAccess.Financial()
  // @ApiOperation({ summary: 'Get financial overview' })
  // @ApiResponse({ status: 200, description: 'Financial overview retrieved' })
  getFinancialOverview(@UserEmail() email: string) {
    return {
      success: true,
      data: {
        message: 'Financial overview data',
        accessedBy: email,
        // Would include actual financial data
      },
    };
  }

  /**
   * Super Admin only endpoint
   * Demonstrates highest level access control
   */
  @Get('system/health')
  @RoleAccess.SuperAdminOnly()
  // @ApiOperation({ summary: 'Get system health status' })
  // @ApiResponse({ status: 200, description: 'System health retrieved' })
  getSystemHealth() {
    return {
      success: true,
      data: {
        message: 'System health check',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        // Would include actual system metrics
      },
    };
  }

  /**
   * Public endpoint example
   * Accessible without authentication
   */
  @Public()
  @Get('public/info')
  // @ApiOperation({ summary: 'Get public profile information' })
  // @ApiResponse({ status: 200, description: 'Public info retrieved' })
  getPublicInfo() {
    return {
      success: true,
      data: {
        message: 'Public profile information',
        availableFeatures: [
          'User registration',
          'Password reset',
          'Contact information',
        ],
      },
    };
  }
}
