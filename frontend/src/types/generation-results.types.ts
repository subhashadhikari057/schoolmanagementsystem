export interface GenerationResult {
  id: string;
  personId: string;
  personName: string;
  templateName: string;
  pdfUrl: string;
  qrCode: string;
  expiryDate: string;
  generatedAt: string;
}

export interface BulkGenerationResult {
  successful: GenerationResult[];
  failed: Array<{
    personId: string;
    personName: string;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export type IDCardGenerationResults = GenerationResult | BulkGenerationResult;
