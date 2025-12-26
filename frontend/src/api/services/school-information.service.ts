/**
 * =============================================================================
 * School Information Service
 * =============================================================================
 * Frontend API service for managing school information settings.
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

export interface SchoolInformation {
  id: string;
  schoolName: string;
  schoolCode: string;
  establishedYear: number;
  address: string;
  website?: string | null;
  emails: string[];
  contactNumbers: string[];
  logo?: string | null;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  ward?: string | null;
  schoolClassification?: string | null;
  schoolType?: string | null;
  schoolTypeNa?: string | null;
  classRegisteredUpto?: string | null;
  seeCode?: string | null;
  hsebCode?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  bank?: string | null;
  accountNumber?: string | null;
  panNumber?: string | null;
  headTeacherName?: string | null;
  headTeacherContactNumber?: string | null;
  headTeacherQualification?: string | null;
  headTeacherGender?: string | null;
  headTeacherIsTeaching: boolean;
  headTeacherCaste?: string | null;
  grantReceivingFrom?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  elevation?: number | null;
  hasEcdLevel: boolean;
  hasBasicLevel1To5: boolean;
  hasBasicLevel6To8: boolean;
  ecdApprovalDate?: string | null;
  primaryApprovalDate?: string | null;
  lowerSecondaryApprovalDate?: string | null;
  runningEcdPpc: boolean;
  runningGrade1: boolean;
  runningGrade2: boolean;
  runningGrade3: boolean;
  runningGrade4: boolean;
  runningGrade5: boolean;
  runningGrade6: boolean;
  runningGrade7: boolean;
  runningGrade8: boolean;
  runningGrade9: boolean;
  runningGrade10: boolean;
  runningGrade11: boolean;
  runningGrade12: boolean;
  scienceSubjectTaughtIn11And12: boolean;
  selectedForModelSchool: boolean;
  complaintHearingMechanism: boolean;
  foreignAffiliation: boolean;
  informalSchool: boolean;
  mobileSchool: boolean;
  openSchool: boolean;
  specialDisabilitySchool: boolean;
  multilingualEducation: boolean;
  mgmlImplemented: boolean;
  residentialScholarshipProgram: boolean;
  zeroPositionGrantBasicSchool: boolean;
  technicalStreamRunning: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdById: string | null;
  updatedById: string | null;
}

export interface CreateSchoolInformationRequest {
  schoolName: string;
  schoolCode: string;
  establishedYear: number;
  address: string;
  website?: string;
  emails?: string[];
  contactNumbers?: string[];
  logo?: string;
  province?: string;
  district?: string;
  municipality?: string;
  ward?: string;
  schoolClassification?: string;
  schoolType?: string;
  schoolTypeNa?: string;
  classRegisteredUpto?: string;
  seeCode?: string;
  hsebCode?: string;
  phoneNumber?: string;
  email?: string;
  bank?: string;
  accountNumber?: string;
  panNumber?: string;
  headTeacherName?: string;
  headTeacherContactNumber?: string;
  headTeacherQualification?: string;
  headTeacherGender?: 'Male' | 'Female' | 'Other';
  headTeacherIsTeaching?: boolean;
  headTeacherCaste?: string;
  grantReceivingFrom?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  hasEcdLevel?: boolean;
  hasBasicLevel1To5?: boolean;
  hasBasicLevel6To8?: boolean;
  ecdApprovalDate?: string;
  primaryApprovalDate?: string;
  lowerSecondaryApprovalDate?: string;
  runningEcdPpc?: boolean;
  runningGrade1?: boolean;
  runningGrade2?: boolean;
  runningGrade3?: boolean;
  runningGrade4?: boolean;
  runningGrade5?: boolean;
  runningGrade6?: boolean;
  runningGrade7?: boolean;
  runningGrade8?: boolean;
  runningGrade9?: boolean;
  runningGrade10?: boolean;
  runningGrade11?: boolean;
  runningGrade12?: boolean;
  scienceSubjectTaughtIn11And12?: boolean;
  selectedForModelSchool?: boolean;
  complaintHearingMechanism?: boolean;
  foreignAffiliation?: boolean;
  informalSchool?: boolean;
  mobileSchool?: boolean;
  openSchool?: boolean;
  specialDisabilitySchool?: boolean;
  multilingualEducation?: boolean;
  mgmlImplemented?: boolean;
  residentialScholarshipProgram?: boolean;
  zeroPositionGrantBasicSchool?: boolean;
  technicalStreamRunning?: boolean;
}

export interface UpdateSchoolInformationRequest {
  schoolName?: string;
  schoolCode?: string;
  establishedYear?: number;
  address?: string;
  website?: string;
  emails?: string[];
  contactNumbers?: string[];
  logo?: string;
  province?: string;
  district?: string;
  municipality?: string;
  ward?: string;
  schoolClassification?: string;
  schoolType?: string;
  schoolTypeNa?: string;
  classRegisteredUpto?: string;
  seeCode?: string;
  hsebCode?: string;
  phoneNumber?: string;
  email?: string;
  bank?: string;
  accountNumber?: string;
  panNumber?: string;
  headTeacherName?: string;
  headTeacherContactNumber?: string;
  headTeacherQualification?: string;
  headTeacherGender?: 'Male' | 'Female' | 'Other';
  headTeacherIsTeaching?: boolean;
  headTeacherCaste?: string;
  grantReceivingFrom?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  hasEcdLevel?: boolean;
  hasBasicLevel1To5?: boolean;
  hasBasicLevel6To8?: boolean;
  ecdApprovalDate?: string;
  primaryApprovalDate?: string;
  lowerSecondaryApprovalDate?: string;
  runningEcdPpc?: boolean;
  runningGrade1?: boolean;
  runningGrade2?: boolean;
  runningGrade3?: boolean;
  runningGrade4?: boolean;
  runningGrade5?: boolean;
  runningGrade6?: boolean;
  runningGrade7?: boolean;
  runningGrade8?: boolean;
  runningGrade9?: boolean;
  runningGrade10?: boolean;
  runningGrade11?: boolean;
  runningGrade12?: boolean;
  scienceSubjectTaughtIn11And12?: boolean;
  selectedForModelSchool?: boolean;
  complaintHearingMechanism?: boolean;
  foreignAffiliation?: boolean;
  informalSchool?: boolean;
  mobileSchool?: boolean;
  openSchool?: boolean;
  specialDisabilitySchool?: boolean;
  multilingualEducation?: boolean;
  mgmlImplemented?: boolean;
  residentialScholarshipProgram?: boolean;
  zeroPositionGrantBasicSchool?: boolean;
  technicalStreamRunning?: boolean;
}

export interface SchoolInformationExistsResponse {
  exists: boolean;
}

export class SchoolInformationService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Create school information
   */
  async createSchoolInformation(
    data: CreateSchoolInformationRequest,
  ): Promise<ApiResponse<SchoolInformation>> {
    return this.httpClient.post<SchoolInformation>(
      'api/v1/school-information',
      data,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Get school information
   */
  async getSchoolInformation(): Promise<ApiResponse<SchoolInformation | null>> {
    return this.httpClient.get<SchoolInformation | null>(
      'api/v1/school-information',
      undefined,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Update school information
   */
  async updateSchoolInformation(
    data: UpdateSchoolInformationRequest,
  ): Promise<ApiResponse<SchoolInformation>> {
    return this.httpClient.put<SchoolInformation>(
      'api/v1/school-information',
      data,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Create or update school information (upsert)
   */
  async createOrUpdateSchoolInformation(
    data: CreateSchoolInformationRequest,
  ): Promise<ApiResponse<SchoolInformation>> {
    return this.httpClient.post<SchoolInformation>(
      'api/v1/school-information/upsert',
      data,
      {
        requiresAuth: true,
      },
    );
  }

  /**
   * Check if school information exists
   */
  async checkSchoolInformationExists(): Promise<
    ApiResponse<SchoolInformationExistsResponse>
  > {
    return this.httpClient.get<SchoolInformationExistsResponse>(
      'api/v1/school-information/exists',
      undefined,
      {
        requiresAuth: true,
      },
    );
  }

  async getReportCardData(params: {
    year?: number | string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    return this.httpClient.get(
      'api/v1/school-information/report-card/data',
      params,
      {
        requiresAuth: true,
      },
    );
  }
}

// Export singleton instance
export const schoolInformationService = new SchoolInformationService();
