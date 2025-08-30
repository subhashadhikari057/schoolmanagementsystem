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

export const idCardApiService = {
  /**
   * Generate an individual ID card from template
   */
  async generateIDCard(dto: GenerateIDCardDto): Promise<IDCardData> {
    const response = await httpClient.post('/api/id-cards/generate', dto, {
      requiresAuth: true,
    });
    return response.data;
  },

  /**
   * Generate ID cards in bulk
   */
  async generateBulkIDCards(
    dto: GenerateBulkIDCardsDto,
  ): Promise<IDCardData[]> {
    const response = await httpClient.post('/api/id-cards/generate-bulk', dto, {
      requiresAuth: true,
    });
    return response.data;
  },

  /**
   * Get all ID cards for a user
   */
  async getUserIDCards(userId: string): Promise<IDCardData[]> {
    const response = await httpClient.get(
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
    const response = await httpClient.get(
      `/api/id-cards/${idCardId}`,
      undefined,
      { requiresAuth: true },
    );
    return response.data;
  },
};
