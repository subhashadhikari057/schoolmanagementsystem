'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  ArrowLeft,
  FileText,
  Users,
  XCircle,
} from 'lucide-react';

import {
  GenerationResult,
  BulkGenerationResult,
  IDCardGenerationResults,
} from '@/types/generation-results.types';

interface GenerationResultsProps {
  results: IDCardGenerationResults;
  isBulk: boolean;
  onBack: () => void;
  onStartNew: () => void;
}

export default function GenerationResults({
  results,
  isBulk,
  onBack,
  onStartNew,
}: GenerationResultsProps) {
  const bulkResults = isBulk ? (results as BulkGenerationResult) : null;
  const singleResult = !isBulk ? (results as GenerationResult) : null;

  const downloadPDF = (pdfUrl: string, personName: string) => {
    // Create a temporary link to download the PDF
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `ID_Card_${personName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllPDFs = () => {
    if (bulkResults) {
      bulkResults.successful.forEach(result => {
        downloadPDF(result.pdfUrl, result.personName);
      });
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Generation Results
          </h3>
          <p className='text-sm text-gray-600'>
            {isBulk
              ? 'Bulk generation completed'
              : 'ID card generated successfully'}
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' onClick={onBack}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back
          </Button>
          <Button onClick={onStartNew}>Generate More</Button>
        </div>
      </div>

      {/* Summary Cards */}
      {isBulk && bulkResults ? (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Card className='p-4 bg-green-50 border-green-200'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='w-5 h-5 text-green-600' />
              </div>
              <div>
                <div className='text-2xl font-bold text-green-900'>
                  {bulkResults.successCount}
                </div>
                <div className='text-sm text-green-700'>Successful</div>
              </div>
            </div>
          </Card>

          <Card className='p-4 bg-red-50 border-red-200'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                <XCircle className='w-5 h-5 text-red-600' />
              </div>
              <div>
                <div className='text-2xl font-bold text-red-900'>
                  {bulkResults.failureCount}
                </div>
                <div className='text-sm text-red-700'>Failed</div>
              </div>
            </div>
          </Card>

          <Card className='p-4 bg-blue-50 border-blue-200'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                <Users className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <div className='text-2xl font-bold text-blue-900'>
                  {bulkResults.totalProcessed}
                </div>
                <div className='text-sm text-blue-700'>Total Processed</div>
              </div>
            </div>
          </Card>
        </div>
      ) : singleResult ? (
        <Card className='p-6 bg-green-50 border-green-200'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
              <div>
                <h4 className='text-lg font-semibold text-green-900'>
                  ID Card Generated Successfully
                </h4>
                <p className='text-sm text-green-700'>
                  {singleResult.personName} - {singleResult.templateName}
                </p>
              </div>
            </div>
            <div className='flex space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open(singleResult.pdfUrl, '_blank')}
              >
                <Eye className='w-4 h-4 mr-2' />
                Preview
              </Button>
              <Button
                size='sm'
                onClick={() =>
                  downloadPDF(singleResult.pdfUrl, singleResult.personName)
                }
              >
                <Download className='w-4 h-4 mr-2' />
                Download
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Bulk Actions */}
      {isBulk && bulkResults && bulkResults.successCount > 0 && (
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-medium text-gray-900'>Bulk Actions</h4>
              <p className='text-sm text-gray-600'>
                Download all generated ID cards at once
              </p>
            </div>
            <Button onClick={downloadAllPDFs}>
              <Download className='w-4 h-4 mr-2' />
              Download All PDFs ({bulkResults.successCount})
            </Button>
          </div>
        </Card>
      )}

      {/* Successful Results */}
      {isBulk && bulkResults && bulkResults.successful.length > 0 && (
        <Card className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h4 className='text-lg font-semibold text-gray-900'>
              Successfully Generated ({bulkResults.successful.length})
            </h4>
          </div>

          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {bulkResults.successful.map((result, index) => (
              <div
                key={result.id}
                className='flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-sm font-medium text-green-700'>
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {result.personName}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Generated: {new Date(result.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Badge className='bg-green-100 text-green-800'>Success</Badge>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => window.open(result.pdfUrl, '_blank')}
                  >
                    <Eye className='w-3 h-3 mr-1' />
                    View
                  </Button>
                  <Button
                    size='sm'
                    onClick={() =>
                      downloadPDF(result.pdfUrl, result.personName)
                    }
                  >
                    <Download className='w-3 h-3 mr-1' />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Failed Results */}
      {isBulk && bulkResults && bulkResults.failed.length > 0 && (
        <Card className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h4 className='text-lg font-semibold text-gray-900'>
              Failed Generations ({bulkResults.failed.length})
            </h4>
          </div>

          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {bulkResults.failed.map((failure, index) => (
              <div
                key={failure.personId}
                className='flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                    <span className='text-sm font-medium text-red-700'>
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {failure.personName}
                    </div>
                    <div className='text-sm text-red-600'>
                      Error: {failure.error}
                    </div>
                  </div>
                </div>

                <Badge className='bg-red-100 text-red-800'>Failed</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Single Result Details */}
      {!isBulk && singleResult && (
        <Card className='p-6'>
          <h4 className='text-lg font-semibold text-gray-900 mb-4'>
            ID Card Details
          </h4>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-3'>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Person Name
                </label>
                <p className='text-sm text-gray-900'>
                  {singleResult.personName}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Template Used
                </label>
                <p className='text-sm text-gray-900'>
                  {singleResult.templateName}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Generated At
                </label>
                <p className='text-sm text-gray-900'>
                  {new Date(singleResult.generatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Expiry Date
                </label>
                <p className='text-sm text-gray-900'>
                  {new Date(singleResult.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  QR Code
                </label>
                <div className='mt-2'>
                  <img
                    src={singleResult.qrCode}
                    alt='QR Code'
                    className='w-32 h-32 border border-gray-300 rounded'
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Next Steps */}
      <Card className='p-6 bg-blue-50 border-blue-200'>
        <h4 className='font-medium text-blue-900 mb-2'>Next Steps</h4>
        <div className='space-y-2 text-sm text-blue-800'>
          <div>• Download and print the generated ID cards</div>
          <div>• Distribute cards to respective persons</div>
          <div>• Keep digital copies for records</div>
          {isBulk && (
            <div>• Review any failed generations and retry if needed</div>
          )}
        </div>
      </Card>
    </div>
  );
}
