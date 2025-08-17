/**
 * =============================================================================
 * Profile Controller
 * =============================================================================
 * Comprehensive profile management for all user types
 * =============================================================================
 */

import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { UserId } from '../../../shared/decorators/user.decorator';
import {
  ProfileService,
  UpdateProfileDto,
} from '../application/profile.service';

@Controller('api/v1/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Get current user profile
   * Available to all authenticated users
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getProfile(@UserId() userId: string) {
    const profile = await this.profileService.getUserProfile(userId);
    return {
      success: true,
      data: profile,
      message: 'Profile retrieved successfully',
      timestamp: new Date().toISOString(),
      traceId: `profile-${userId}-${Date.now()}`,
    };
  }

  /**
   * Update user profile
   * Available to all authenticated users (users can update their own profile)
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @UserId() userId: string,
    @Body() updateData: UpdateProfileDto,
  ) {
    const updatedProfile = await this.profileService.updateUserProfile(
      userId,
      updateData,
    );
    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
      timestamp: new Date().toISOString(),
      traceId: `profile-update-${userId}-${Date.now()}`,
    };
  }

  /**
   * Change password
   * Available to all authenticated users
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @UserId() userId: string,
    @Body() data: { currentPassword: string; newPassword: string },
  ) {
    await this.profileService.changePassword(
      userId,
      data.currentPassword,
      data.newPassword,
    );
    return {
      success: true,
      message: 'Password changed successfully',
      data: null,
      timestamp: new Date().toISOString(),
      traceId: `password-change-${userId}-${Date.now()}`,
    };
  }

  /**
   * Get account activity
   * Available to all authenticated users
   */
  @Get('activity')
  @HttpCode(HttpStatus.OK)
  async getAccountActivity(@UserId() userId: string) {
    const activity = await this.profileService.getAccountActivity(userId);
    return {
      success: true,
      data: activity,
      message: 'Account activity retrieved successfully',
      timestamp: new Date().toISOString(),
      traceId: `activity-${userId}-${Date.now()}`,
    };
  }
}
