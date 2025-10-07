'use client';

import React, { useState, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { ImportAssetData } from '@/types/asset.types';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomId: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roomId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportAssetData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [dragActive, setDragActive] = useState(false);

  // Mock CSV template data
  const csvTemplate = `modelName,category,serialNumber,tagNumber,purchaseDate,cost,vendor,warranty,roomNo,status,manufacturer,modelNumber,description
Dell OptiPlex 7080,electronics,DOT001,TAG001,2024-01-15,899.99,TechCorp Solutions,3 years,101,ok,Dell,OP7080-MT,Desktop computer for lab
HP ProBook 450,electronics,HPB001,TAG002,2024-01-15,1299.99,TechCorp Solutions,2 years,101,ok,HP,PB450-G8,Laptop for student use
Office Chair,furniture,OCH001,TAG003,2024-02-01,249.99,Office Supplies Inc,1 year,102,ok,Steelcase,Series1,Ergonomic office chair`;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (uploadedFile: File) => {
    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Invalid file type', {
        description: 'Please upload a CSV file',
      });
      return;
    }

    setFile(uploadedFile);
    parseCSV(uploadedFile);
  };

  const parseCSV = (file: File) => {
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          throw new Error(
            'CSV file must contain at least a header row and one data row',
          );
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = [
          'modelName',
          'category',
          'serialNumber',
          'tagNumber',
          'purchaseDate',
          'cost',
          'vendor',
          'warranty',
          'roomNo',
        ];

        // Check for required headers
        const missingHeaders = requiredHeaders.filter(
          h => !headers.includes(h),
        );
        if (missingHeaders.length > 0) {
          throw new Error(
            `Missing required columns: ${missingHeaders.join(', ')}`,
          );
        }

        const data: ImportAssetData[] = [];
        const errors: ValidationError[] = [];

        // Parse data rows
        for (let i = 1; i < Math.min(lines.length, 101); i++) {
          // Limit preview to 100 rows
          const values = lines[i]
            .split(',')
            .map(v => v.trim().replace(/"/g, ''));

          if (values.length !== headers.length) {
            errors.push({
              row: i + 1,
              field: 'general',
              message: `Row has ${values.length} columns but expected ${headers.length}`,
            });
            continue;
          }

          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index];
          });

          // Validation
          if (!rowData.modelName) {
            errors.push({
              row: i + 1,
              field: 'modelName',
              message: 'Model name is required',
            });
          }

          if (
            ![
              'electronics',
              'furniture',
              'books',
              'sports',
              'laboratory',
              'other',
            ].includes(rowData.category)
          ) {
            errors.push({
              row: i + 1,
              field: 'category',
              message: 'Invalid category',
            });
          }

          if (!rowData.serialNumber) {
            errors.push({
              row: i + 1,
              field: 'serialNumber',
              message: 'Serial number is required',
            });
          }

          if (
            !rowData.purchaseDate ||
            isNaN(Date.parse(rowData.purchaseDate))
          ) {
            errors.push({
              row: i + 1,
              field: 'purchaseDate',
              message: 'Valid purchase date is required',
            });
          }

          if (
            !rowData.cost ||
            isNaN(parseFloat(rowData.cost)) ||
            parseFloat(rowData.cost) <= 0
          ) {
            errors.push({
              row: i + 1,
              field: 'cost',
              message: 'Valid cost is required',
            });
          }

          if (!rowData.vendor) {
            errors.push({
              row: i + 1,
              field: 'vendor',
              message: 'Vendor is required',
            });
          }

          if (!rowData.roomNo) {
            errors.push({
              row: i + 1,
              field: 'roomNo',
              message: 'Room number is required',
            });
          }

          data.push({
            modelName: rowData.modelName,
            category: rowData.category as any,
            serialNumber: rowData.serialNumber,
            tagNumber: rowData.tagNumber,
            purchaseDate: rowData.purchaseDate,
            cost: parseFloat(rowData.cost) || 0,
            vendor: rowData.vendor,
            warranty: rowData.warranty || '1 year',
            roomNo: rowData.roomNo,
            status:
              rowData.status === 'damaged' ||
              rowData.status === 'under_repair' ||
              rowData.status === 'retired'
                ? (rowData.status as any)
                : 'ok',
            manufacturer: rowData.manufacturer,
            modelNumber: rowData.modelNumber,
            description: rowData.description,
          });
        }

        setPreviewData(data);
        setValidationErrors(errors);

        if (errors.length > 0) {
          toast.warning(`Found ${errors.length} validation errors`, {
            description: 'Please review the errors before importing',
          });
        } else {
          toast.success(`Successfully parsed ${data.length} rows`, {
            description: 'Ready for import',
          });
        }
      } catch (error: any) {
        console.error('Error parsing CSV:', error);
        toast.error('Failed to parse CSV', {
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      toast.error('Failed to read file', {
        description: 'Please try again with a different file',
      });
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!previewData.length || validationErrors.length > 0) {
      toast.error('Cannot import', {
        description: 'Please fix validation errors first',
      });
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Importing assets...', {
      description: `Processing ${previewData.length} assets`,
    });

    try {
      // Mock API call - replace with actual service
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast.dismiss(loadingToast);
      toast.success(`Successfully imported ${previewData.length} assets!`, {
        description: 'All assets have been added to your inventory',
        duration: 5000,
      });

      // Reset state
      setFile(null);
      setPreviewData([]);
      setValidationErrors([]);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error importing assets:', error);
      toast.dismiss(loadingToast);
      toast.error('Import failed', {
        description: error.message || 'Please try again',
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFile(null);
      setPreviewData([]);
      setValidationErrors([]);
      setDragActive(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200'
      onClick={handleClose}
    >
      <div
        className='bg-gray-50/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200/50'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/60 bg-white/90 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10'>
          <div className='flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0'>
            <div className='p-2 sm:p-2.5 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg sm:rounded-xl shadow-md text-white flex-shrink-0'>
              <Upload size={18} className='sm:w-5 sm:h-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <h2 className='text-base sm:text-lg font-bold text-gray-900 truncate'>
                Import Assets from CSV
              </h2>
              <p className='text-xs sm:text-sm text-gray-500 truncate'>
                Upload or drag-and-drop a CSV to bulk import assets
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2 flex-shrink-0'>
            <Button
              variant='outline'
              size='sm'
              onClick={downloadTemplate}
              className='flex items-center space-x-2'
            >
              <Download size={14} />
              <span>Template</span>
            </Button>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 rounded'
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className='flex flex-col max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]'>
          {!file ? (
            /* File Upload Section */
            <div className='p-4 sm:p-6'>
              <div
                className={`relative border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type='file'
                  accept='.csv'
                  onChange={handleFileInput}
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  disabled={isLoading}
                />

                <div className='flex flex-col items-center space-y-3 sm:space-y-4'>
                  <div className='w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-full flex items-center justify-center'>
                    <Upload className='h-6 w-6 sm:h-7 sm:w-7 text-indigo-600' />
                  </div>

                  <div>
                    <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2'>
                      Drop your CSV file here, or click to browse
                    </h3>
                    <p className='text-xs sm:text-sm text-gray-500'>
                      Support for CSV files up to 10MB
                    </p>
                  </div>

                  <Button variant='ghost' className='border border-gray-200'>
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <h4 className='font-semibold text-blue-900 mb-2'>
                  CSV Format Requirements:
                </h4>
                <ul className='text-sm text-blue-800 space-y-1'>
                  <li>
                    • Required columns: modelName, category, serialNumber,
                    tagNumber, purchaseDate, cost, vendor, warranty, roomNo
                  </li>
                  <li>
                    • Categories: electronics, furniture, books, sports,
                    laboratory, other
                  </li>
                  <li>• Date format: YYYY-MM-DD</li>
                  <li>
                    • Status values: ok, damaged, under_repair, retired
                    (defaults to 'ok')
                  </li>
                  <li>• First row must be column headers</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Preview Section */
            <div className='flex-1 flex flex-col overflow-hidden'>
              <div className='p-4 sm:p-6 border-b border-gray-200/50'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                  <div>
                    <h3 className='text-base sm:text-lg font-semibold text-gray-900'>
                      Preview Import Data
                    </h3>
                    <p className='text-xs sm:text-sm text-gray-600'>
                      {previewData.length} rows ready for import
                      {validationErrors.length > 0 && (
                        <span className='text-red-600 ml-2'>
                          ({validationErrors.length} errors found)
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setFile(null);
                      setPreviewData([]);
                      setValidationErrors([]);
                    }}
                    className='w-full sm:w-auto'
                  >
                    Upload Different File
                  </Button>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className='p-3 sm:p-4 bg-red-50/90 backdrop-blur-sm border-b border-red-200/60'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <AlertCircle className='h-5 w-5 text-red-600' />
                    <h4 className='font-semibold text-red-900'>
                      Validation Errors ({validationErrors.length})
                    </h4>
                  </div>
                  <div className='max-h-32 overflow-y-auto'>
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <div key={index} className='text-sm text-red-800'>
                        Row {error.row}: {error.message}
                      </div>
                    ))}
                    {validationErrors.length > 10 && (
                      <div className='text-sm text-red-600 mt-1'>
                        ... and {validationErrors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              <div className='flex-1 overflow-auto p-3 sm:p-4'>
                {isLoading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mr-3'></div>
                    <span className='text-sm sm:text-base'>
                      Processing file...
                    </span>
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full text-xs sm:text-sm border border-gray-200 rounded-lg min-w-[600px]'>
                      <thead className='bg-white/90 backdrop-blur-sm'>
                        <tr>
                          <th className='px-2 sm:px-3 py-2 text-left border-b'>
                            Model Name
                          </th>
                          <th className='px-2 sm:px-3 py-2 text-left border-b'>
                            Category
                          </th>
                          <th className='px-2 sm:px-3 py-2 text-left border-b'>
                            Serial Number
                          </th>
                          <th className='px-2 sm:px-3 py-2 text-left border-b'>
                            Room
                          </th>
                          <th className='px-2 sm:px-3 py-2 text-left border-b'>
                            Cost
                          </th>
                          <th className='px-2 sm:px-3 py-2 text-left border-b'>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 20).map((item, index) => (
                          <tr
                            key={index}
                            className='border-b border-gray-100 hover:bg-gray-50'
                          >
                            <td className='px-3 py-2'>{item.modelName}</td>
                            <td className='px-3 py-2'>
                              <span className='capitalize text-xs bg-gray-100 px-2 py-1 rounded'>
                                {item.category}
                              </span>
                            </td>
                            <td className='px-3 py-2 font-mono text-xs'>
                              {item.serialNumber}
                            </td>
                            <td className='px-3 py-2'>{item.roomNo}</td>
                            <td className='px-3 py-2'>
                              ${item.cost.toFixed(2)}
                            </td>
                            <td className='px-3 py-2'>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  item.status === 'IN_SERVICE'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'DAMAGED'
                                      ? 'bg-red-100 text-red-800'
                                      : item.status === 'UNDER_REPAIR'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {item.status?.replace('_', ' ') || 'IN SERVICE'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 20 && (
                      <div className='text-center py-4 text-sm text-gray-500'>
                        ... and {previewData.length - 20} more rows
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {file && (
            <div className='p-6 border-t border-gray-200 bg-gray-50'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4 text-sm text-gray-600'>
                  <div className='flex items-center space-x-1'>
                    <FileText className='h-4 w-4' />
                    <span>{file.name}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    {validationErrors.length === 0 ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <AlertCircle className='h-4 w-4 text-red-600' />
                    )}
                    <span>
                      {validationErrors.length === 0
                        ? 'Ready to import'
                        : `${validationErrors.length} errors`}
                    </span>
                  </div>
                </div>

                <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'>
                  <Button
                    variant='outline'
                    onClick={handleClose}
                    disabled={isLoading}
                    className='w-full sm:w-auto'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={
                      isLoading ||
                      validationErrors.length > 0 ||
                      previewData.length === 0
                    }
                    className='w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  >
                    {isLoading ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2'></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className='mr-2' />
                        Import {previewData.length} Assets
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportCSVModal;
