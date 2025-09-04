'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, AlertCircle } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Textarea from '@/components/atoms/form-controls/Textarea';
import Checkbox from '@/components/atoms/form-controls/Checkbox';
import { gradingService } from '@/api/services/grading.service';
import { toast } from 'sonner';

interface GradeDefinition {
  id?: string;
  grade: string;
  minMarks: number;
  maxMarks: number;
  gradePoint?: number;
  description?: string;
  color?: string;
}

interface GradingScale {
  id?: string;
  academicYear: string;
  name: string;
  description?: string;
  isDefault: boolean;
  gradeDefinitions: GradeDefinition[];
}

interface GradingScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYear: string;
  gradingScale?: GradingScale | null;
  mode: 'create' | 'edit' | 'view';
  onSave: () => void;
}

const GradingScaleModal: React.FC<GradingScaleModalProps> = ({
  isOpen,
  onClose,
  academicYear,
  gradingScale,
  mode,
  onSave,
}) => {
  const [formData, setFormData] = useState<GradingScale>({
    academicYear,
    name: '',
    description: '',
    isDefault: false,
    gradeDefinitions: [],
  });
  const [loading, setLoading] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeDefinition | null>(
    null,
  );

  useEffect(() => {
    if (gradingScale) {
      setFormData(gradingScale);
    } else {
      setFormData({
        academicYear,
        name: '',
        description: '',
        isDefault: false,
        gradeDefinitions: [],
      });
    }
  }, [gradingScale, academicYear]);

  const handleSave = async () => {
    try {
      setLoading(true);

      if (mode === 'create') {
        // Only send required fields for creation
        const createData = {
          academicYear: formData.academicYear,
          name: formData.name,
          description: formData.description,
          isDefault: formData.isDefault,
          gradeDefinitions: formData.gradeDefinitions.map(grade => ({
            grade: grade.grade,
            minMarks: grade.minMarks,
            maxMarks: grade.maxMarks,
            gradePoint: grade.gradePoint,
            description: grade.description,
            color: grade.color,
          })),
        };
        await gradingService.createGradingScale(createData);
        toast.success('Grading scale created successfully');
      } else if (mode === 'edit' && formData.id) {
        // Only send required fields for update
        const updateData = {
          academicYear: formData.academicYear,
          name: formData.name,
          description: formData.description,
          isDefault: formData.isDefault,
          gradeDefinitions: formData.gradeDefinitions.map(grade => ({
            grade: grade.grade,
            minMarks: grade.minMarks,
            maxMarks: grade.maxMarks,
            gradePoint: grade.gradePoint,
            description: grade.description,
            color: grade.color,
          })),
        };
        await gradingService.updateGradingScale(formData.id, updateData);
        toast.success('Grading scale updated successfully');
      }

      onSave();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to save grading scale',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrade = () => {
    setEditingGrade({
      grade: '',
      minMarks: 0,
      maxMarks: 100,
      gradePoint: 0,
      description: '',
      color: '#3B82F6',
    });
  };

  const handleSaveGrade = () => {
    if (!editingGrade) return;

    if (editingGrade.id) {
      // Update existing grade
      setFormData(prev => ({
        ...prev,
        gradeDefinitions: prev.gradeDefinitions.map(g =>
          g.id === editingGrade.id ? editingGrade : g,
        ),
      }));
    } else {
      // Add new grade
      setFormData(prev => ({
        ...prev,
        gradeDefinitions: [
          ...prev.gradeDefinitions,
          { ...editingGrade, id: Date.now().toString() },
        ],
      }));
    }

    setEditingGrade(null);
  };

  const handleEditGrade = (grade: GradeDefinition) => {
    setEditingGrade(grade);
  };

  const handleDeleteGrade = (gradeId: string) => {
    setFormData(prev => ({
      ...prev,
      gradeDefinitions: prev.gradeDefinitions.filter(g => g.id !== gradeId),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'}{' '}
            Grading Scale
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
          <div className='space-y-6'>
            {/* Basic Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Academic Year
                </label>
                <Input
                  value={formData.academicYear}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      academicYear: e.target.value,
                    }))
                  }
                  disabled={mode === 'view'}
                  placeholder='e.g., 2024-2025'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Scale Name
                </label>
                <Input
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  disabled={mode === 'view'}
                  placeholder='e.g., Standard Grading'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Description
              </label>
              <Textarea
                value={formData.description || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                disabled={mode === 'view'}
                placeholder='Optional description for this grading scale'
                rows={3}
              />
            </div>

            <div className='flex items-center'>
              <Checkbox
                label='Set as default grading scale for this academic year'
                checked={formData.isDefault}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    isDefault: e.target.checked,
                  }))
                }
              />
            </div>

            {/* Grade Definitions */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Grade Definitions
                </h3>
                {mode !== 'view' && (
                  <Button
                    onClick={handleAddGrade}
                    className='flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
                  >
                    <Plus className='h-4 w-4' />
                    Add Grade
                  </Button>
                )}
              </div>

              <div className='space-y-3'>
                {formData.gradeDefinitions.map(grade => (
                  <div
                    key={grade.id}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                  >
                    <div className='flex items-center space-x-4'>
                      <div
                        className='w-4 h-4 rounded'
                        style={{ backgroundColor: grade.color || '#3B82F6' }}
                      />
                      <div>
                        <div className='font-medium'>{grade.grade}</div>
                        <div className='text-sm text-gray-500'>
                          {grade.minMarks}% - {grade.maxMarks}%
                          {grade.gradePoint && ` (${grade.gradePoint} points)`}
                        </div>
                        {grade.description && (
                          <div className='text-sm text-gray-400'>
                            {grade.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {mode !== 'view' && (
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => handleEditGrade(grade)}
                          className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        >
                          <Edit2 className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => handleDeleteGrade(grade.id!)}
                          className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {formData.gradeDefinitions.length === 0 && (
                  <div className='text-center py-8 text-gray-500'>
                    <AlertCircle className='h-8 w-8 mx-auto mb-2 text-gray-400' />
                    <p>No grade definitions added yet</p>
                    {mode !== 'view' && (
                      <p className='text-sm'>
                        Click "Add Grade" to create your first grade definition
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50'>
          <Button
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {mode !== 'view' && (
            <Button
              onClick={handleSave}
              disabled={loading || !formData.name.trim()}
              className='flex items-center gap-2'
            >
              <Save className='h-4 w-4' />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* Grade Definition Edit Modal */}
      {editingGrade && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <h3 className='text-lg font-semibold'>
                {editingGrade.id ? 'Edit' : 'Add'} Grade Definition
              </h3>
              <button
                onClick={() => setEditingGrade(null)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='p-4 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Grade
                  </label>
                  <Input
                    value={editingGrade.grade}
                    onChange={e =>
                      setEditingGrade(prev =>
                        prev ? { ...prev, grade: e.target.value } : null,
                      )
                    }
                    placeholder='e.g., A+, B, C'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Grade Point
                  </label>
                  <Input
                    type='number'
                    value={editingGrade.gradePoint || ''}
                    onChange={e =>
                      setEditingGrade(prev =>
                        prev
                          ? {
                              ...prev,
                              gradePoint:
                                parseFloat(e.target.value) || undefined,
                            }
                          : null,
                      )
                    }
                    placeholder='e.g., 4.0'
                    step='0.1'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Min Marks (%)
                  </label>
                  <Input
                    type='number'
                    value={editingGrade.minMarks}
                    onChange={e =>
                      setEditingGrade(prev =>
                        prev
                          ? { ...prev, minMarks: parseInt(e.target.value) || 0 }
                          : null,
                      )
                    }
                    placeholder='e.g., 90'
                    min='0'
                    max='100'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Max Marks (%)
                  </label>
                  <Input
                    type='number'
                    value={editingGrade.maxMarks}
                    onChange={e =>
                      setEditingGrade(prev =>
                        prev
                          ? { ...prev, maxMarks: parseInt(e.target.value) || 0 }
                          : null,
                      )
                    }
                    placeholder='e.g., 100'
                    min='0'
                    max='100'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Description
                </label>
                <Textarea
                  value={editingGrade.description || ''}
                  onChange={e =>
                    setEditingGrade(prev =>
                      prev ? { ...prev, description: e.target.value } : null,
                    )
                  }
                  placeholder='Optional description'
                  rows={2}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Color
                </label>
                <input
                  type='color'
                  value={editingGrade.color || '#3B82F6'}
                  onChange={e =>
                    setEditingGrade(prev =>
                      prev ? { ...prev, color: e.target.value } : null,
                    )
                  }
                  className='w-full h-10 border border-gray-300 rounded-md cursor-pointer'
                />
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50'>
              <Button
                onClick={() => setEditingGrade(null)}
                className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveGrade}
                disabled={
                  !editingGrade.grade.trim() ||
                  editingGrade.minMarks >= editingGrade.maxMarks
                }
              >
                Save Grade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingScaleModal;
