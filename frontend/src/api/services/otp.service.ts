/**
 * =============================================================================
 * OTP Service
 * =============================================================================
 * Service for handling OTP-based password reset functionality
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

// ============================================================================
// API Endpoints
// ============================================================================

const BASE_URL = '/api/v1/auth/forgot-password';

// ============================================================================
// Request/Response Types
// ============================================================================

export interface RequestOtpRequest {
  identifier: string;
  delivery_method: 'email' | 'sms';
}

export interface RequestOtpResponse {
  message: string;
  success: boolean;
}

export interface VerifyOtpRequest {
  identifier: string;
  otp: string;
}

export interface VerifyOtpResponse {
  resetToken: string;
  message: string;
  success: boolean;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

// ============================================================================
// OTP Service Class
// ============================================================================

export class OtpService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Request OTP for password reset
   */
  async requestOtp(
    data: RequestOtpRequest,
  ): Promise<ApiResponse<RequestOtpResponse>> {
    return await this.httpClient.post<RequestOtpResponse>(
      `${BASE_URL}/request-otp`,
      data,
      { requiresAuth: false },
    );
  }

  /**
   * Verify OTP and get reset token
   */
  async verifyOtp(
    data: VerifyOtpRequest,
  ): Promise<ApiResponse<VerifyOtpResponse>> {
    return await this.httpClient.post<VerifyOtpResponse>(
      `${BASE_URL}/verify-otp`,
      data,
      { requiresAuth: false },
    );
  }

  /**
   * Reset password with verified token
   */
  async resetPassword(
    data: ResetPasswordRequest,
  ): Promise<ApiResponse<ResetPasswordResponse>> {
    return await this.httpClient.post<ResetPasswordResponse>(
      `${BASE_URL}/reset-password`,
      data,
      { requiresAuth: false },
    );
  }
}

// Export singleton instance
export const otpService = new OtpService();
