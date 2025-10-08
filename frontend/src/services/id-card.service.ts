import { httpClient } from '@/api/client/http-client';

export interface GenerateIDCardDto {
  templateId: string;
  userId: string;
  expiryDate?: string;
  batchName?: string;
}

export interface GenerateBulkIDCardsDto {
  templateId: string;
  userIds: string[];
  batchName?: string;
}

export interface IDCardData {
  id: string;
  templateId: string;
  userId: string;
  renderedFields: RenderedField[];
  qrCodeUrl?: string;
  expiryDate: string;
  createdAt: string;
  template: {
    name: string;
    dimensions: string;
    orientation: string;
  };
}

export interface RenderedField {
  fieldId: string;
  fieldType: string;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: string;
    color?: string;
    backgroundColor?: string;
  };
}

export interface IDCardListItem {
  id: string;
  type: string;
  templateId: string;
  expiryDate: string;
  batchName?: string;
  issuedForId: string;
  isActive: boolean;
  qrCodeData?: string;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    type: string;
  };
  issuedFor: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface IDCardListResponse {
  idCards: IDCardListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IDCardFilters {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  isActive?: boolean;
}

export const idCardApiService = {
  /**
   * Generate an individual ID card from template
   */
  async generateIDCard(dto: GenerateIDCardDto): Promise<IDCardData> {
    const response = await httpClient.post<IDCardData>(
      '/api/id-cards/generate',
      dto,
      {
        requiresAuth: true,
      },
    );
    return response.data;
  },

  /**
   * Generate ID cards in bulk
   */
  async generateBulkIDCards(
    dto: GenerateBulkIDCardsDto,
  ): Promise<IDCardData[]> {
    const response = await httpClient.post<IDCardData[]>(
      '/api/id-cards/generate-bulk',
      dto,
      {
        requiresAuth: true,
      },
    );
    return response.data;
  },

  /**
   * Get all ID cards for a user
   */
  async getUserIDCards(userId: string): Promise<IDCardData[]> {
    const response = await httpClient.get<IDCardData[]>(
      `/api/id-cards/user/${userId}`,
      undefined,
      { requiresAuth: true },
    );
    return response.data;
  },

  /**
   * Get specific ID card with rendered data
   */
  async getIDCard(idCardId: string): Promise<IDCardData> {
    const response = await httpClient.get<IDCardData>(
      `/api/id-cards/${idCardId}`,
      undefined,
      { requiresAuth: true },
    );
    return response.data;
  },

  /**
   * Get all ID cards with filtering and pagination
   */
  async getAllIDCards(
    filters: IDCardFilters = {},
  ): Promise<IDCardListResponse> {
    const response = await httpClient.get<IDCardListResponse>(
      '/api/id-cards',
      { params: filters },
      { requiresAuth: true },
    );
    return response.data;
  },

  /**
   * Delete an ID card
   */
  async deleteIDCard(idCardId: string): Promise<{ message: string }> {
    const response = await httpClient.delete<{ message: string }>(
      `/api/id-cards/${idCardId}`,
      { requiresAuth: true },
    );
    return response.data;
  },
};
