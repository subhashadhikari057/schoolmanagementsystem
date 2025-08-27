import {
  IDCardTemplate,
  CreateTemplateRequest,
  TemplateFilters,
  TemplateResponse,
  DatabaseField,
  TemplateStats,
} from '@/types/template.types';
import { httpClient } from '@/api/client';
import { ApiResponse } from '@/api/types/common';

class TemplateApiService {
  private readonly endpoints = {
    templates: 'api/id-card-templates',
    fields: 'api/id-card-templates/fields',
    stats: 'api/id-card-templates/stats',
  } as const;

  async createTemplate(data: CreateTemplateRequest): Promise<IDCardTemplate> {
    const response = await httpClient.post<IDCardTemplate>(
      this.endpoints.templates,
      data,
    );
    return response.data;
  }

  async getTemplates(filters: TemplateFilters = {}): Promise<TemplateResponse> {
    const response = await httpClient.get<TemplateResponse>(
      this.endpoints.templates,
      {
        params: filters,
      },
    );
    return response.data;
  }

  async getTemplateById(id: string): Promise<IDCardTemplate> {
    const response = await httpClient.get<IDCardTemplate>(
      `${this.endpoints.templates}/${id}`,
    );
    return response.data;
  }

  async updateTemplate(
    id: string,
    data: Partial<CreateTemplateRequest>,
  ): Promise<IDCardTemplate> {
    const response = await httpClient.put<IDCardTemplate>(
      `${this.endpoints.templates}/${id}`,
      data,
    );
    return response.data;
  }

  async deleteTemplate(id: string): Promise<{ message: string }> {
    const response = await httpClient.delete<{ message: string }>(
      `${this.endpoints.templates}/${id}`,
    );
    return response.data;
  }

  async duplicateTemplate(id: string): Promise<IDCardTemplate> {
    const response = await httpClient.post<IDCardTemplate>(
      `${this.endpoints.templates}/${id}/duplicate`,
    );
    return response.data;
  }

  async setDefaultTemplate(id: string): Promise<{ message: string }> {
    const response = await httpClient.put<{ message: string }>(
      `${this.endpoints.templates}/${id}/set-default`,
    );
    return response.data;
  }

  async publishTemplate(id: string): Promise<IDCardTemplate> {
    const response = await httpClient.put<IDCardTemplate>(
      `${this.endpoints.templates}/${id}/publish`,
    );
    return response.data;
  }

  async unpublishTemplate(id: string): Promise<IDCardTemplate> {
    const response = await httpClient.put<IDCardTemplate>(
      `${this.endpoints.templates}/${id}/unpublish`,
    );
    return response.data;
  }

  async getAvailableFields(): Promise<DatabaseField[]> {
    const response = await httpClient.get<{ fields: DatabaseField[] }>(
      this.endpoints.fields,
    );
    return response.data.fields;
  }

  async getTemplateStats(): Promise<TemplateStats> {
    const response = await httpClient.get<TemplateStats>(this.endpoints.stats);
    return response.data;
  }
}

export const templateApiService = new TemplateApiService();
export const templateService = templateApiService;
export default templateApiService;
