'use client';

import React, { useState } from 'react';
import { AlertTriangle, Calendar, Camera, Info, X, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { reportAssetDamage } from '@/services/asset-management.service';
import type { AssetItem, DamageReportRequest } from '@/types/asset.types';

interface ReportDamageModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetItem | null;
  modelName: string;
  onSuccess: (updatedAsset: AssetItem) => void;
}

const damageTypes = [
  { value: 'DAMAGE_REPORT', label: 'General Damage' },
  { value: 'HARDWARE_FAILURE', label: 'Hardware Failure' },
  { value: 'PHYSICAL_DAMAGE', label: 'Physical Damage' },
  { value: 'SOFTWARE_ISSUE', label: 'Software Issue' },
  { value: 'WEAR_AND_TEAR', label: 'Normal Wear & Tear' },
  { value: 'MAINTENANCE_REQUIRED', label: 'Maintenance Required' },
];

const ReportDamageModal: React.FC<ReportDamageModalProps> = ({
  isOpen,
  onClose,
  asset,
  modelName,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DamageReportRequest>({
    assetId: '',
    type: 'DAMAGE_REPORT',
    description: '',
    reportedDate: new Date().toISOString().split('T')[0],
    severity: 'MEDIUM',
    reportedBy: '',
    photos: [], // Initialize as empty array, not undefined
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        assetId: asset.id,
        type: 'DAMAGE_REPORT',
        description: '',
        reportedDate: new Date().toISOString().split('T')[0],
        severity: 'MEDIUM',
        reportedBy: '',
        photos: [], // Always ensure this is initialized as an empty array
      });
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [isOpen, asset]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = e.target.files;
      const fileArray = Array.from(fileList);

      setFormData(prev => ({
        ...prev,
        photos: fileArray,
      }));
    }
  };

  const simulateFileUpload = async () => {
    if (!Array.isArray(formData.photos) || formData.photos.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file upload progress
    const totalFiles = formData.photos.length;
    for (let i = 1; i <= totalFiles; i++) {
      // Simulate each file upload taking some time
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(Math.floor((i / totalFiles) * 100));
    }

    setIsUploading(false);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setLoading(true);
    try {
      // First handle any file uploads
      if (Array.isArray(formData.photos) && formData.photos.length > 0) {
        await simulateFileUpload();
      }

      // Submit the damage report
      const updatedAsset = await reportAssetDamage(formData);

      // Pass the updated asset back to the parent component
      onSuccess(updatedAsset);
      toast.success('Damage report submitted successfully');
      onClose();
    } catch (error) {
      console.error('Failed to submit damage report:', error);
      toast.error('Failed to submit damage report');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='flex items-center mb-2'>
            <div className='bg-red-100 p-2 rounded-full mr-3'>
              <AlertTriangle className='h-5 w-5 text-red-600' />
            </div>
            <DialogTitle className='text-xl'>Report Damaged Asset</DialogTitle>
          </div>
          <DialogDescription>
            Submit a report for damaged or non-functional asset
          </DialogDescription>
        </DialogHeader>

        <div className='bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200'>
          <h3 className='font-medium text-gray-900'>{modelName}</h3>
          <div className='flex items-center mt-1 space-x-2 text-sm text-gray-500'>
            <span>{asset.serial || 'No Serial'}</span>
            {asset.tag && (
              <>
                <span className='text-gray-300'>•</span>
                <span>Tag: {asset.tag}</span>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='type' className='text-sm font-medium'>
              Issue Type*
            </Label>
            <Select
              value={formData.type}
              onValueChange={value => handleSelectChange('type', value)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select issue type' />
              </SelectTrigger>
              <SelectContent>
                {damageTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='description' className='text-sm font-medium'>
              Description*
            </Label>
            <Textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              placeholder='Describe the issue in detail'
              className='min-h-24'
              required
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='reportedDate' className='text-sm font-medium'>
                Date Occurred*
              </Label>
              <div className='relative'>
                <Calendar className='h-4 w-4 absolute left-3 top-3 text-gray-400' />
                <Input
                  id='reportedDate'
                  name='reportedDate'
                  type='date'
                  value={formData.reportedDate}
                  onChange={handleChange}
                  className='pl-10'
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor='severity' className='text-sm font-medium'>
                Severity
              </Label>
              <Select
                value={formData.severity}
                onValueChange={value =>
                  handleSelectChange(
                    'severity',
                    value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                  )
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select severity' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='LOW'>Low</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
                  <SelectItem value='CRITICAL'>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor='reportedBy' className='text-sm font-medium'>
              Reported By
            </Label>
            <Input
              id='reportedBy'
              name='reportedBy'
              value={formData.reportedBy}
              onChange={handleChange}
              placeholder='Your name or department'
            />
          </div>

          <div>
            <Label htmlFor='photos' className='text-sm font-medium'>
              Attach Photos (optional)
            </Label>
            <div className='mt-1 flex items-center'>
              <label
                htmlFor='photos-upload'
                className='flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
              >
                <Camera className='h-4 w-4 mr-2' />
                <span>Upload Photos</span>
                <Input
                  id='photos-upload'
                  name='photos'
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={handleFileChange}
                  className='sr-only'
                  disabled={loading}
                />
              </label>
              <span className='ml-3 text-sm text-gray-500'>
                {Array.isArray(formData.photos) && formData.photos.length > 0
                  ? `${formData.photos.length} file(s) selected`
                  : 'No files selected'}
              </span>
            </div>
          </div>

          {/* Display uploaded photo previews */}
          {Array.isArray(formData.photos) && formData.photos.length > 0 && (
            <div className='space-y-3'>
              {/* Upload progress bar when uploading */}
              {isUploading && (
                <div className='space-y-1'>
                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    <div className='flex items-center'>
                      <Upload className='h-3 w-3 mr-1' />
                      <span>Uploading files...</span>
                    </div>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-1.5'>
                    <div
                      className='bg-blue-600 h-1.5 rounded-full'
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className='flex flex-wrap gap-2'>
                {Array.isArray(formData.photos) &&
                  formData.photos.map((file, index) => (
                    <div key={index} className='relative w-16 h-16'>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className='w-full h-full object-cover rounded-md'
                      />
                      <button
                        type='button'
                        onClick={() => {
                          const newPhotos = Array.isArray(formData.photos)
                            ? [...formData.photos]
                            : [];
                          newPhotos.splice(index, 1);
                          setFormData(prev => ({ ...prev, photos: newPhotos }));
                        }}
                        className='absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center'
                        disabled={loading}
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className='bg-yellow-50 p-3 rounded-md border border-yellow-200 flex items-start space-x-2'>
            <Info className='h-5 w-5 text-yellow-500 mt-0.5' />
            <p className='text-sm text-yellow-700'>
              Reporting this item as damaged will move it to the Damaged &
              Repairs section. Maintenance staff will be notified automatically.
            </p>
          </div>

          <div className='flex justify-end space-x-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-red-600 text-white hover:bg-red-700'
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Report Damage'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDamageModal;
