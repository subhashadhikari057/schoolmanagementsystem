'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Users,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Checkbox from '@/components/atoms/form-controls/Checkbox';
import { gradingService } from '@/api/services/grading.service';
import { classService } from '@/api/services/class.service';
import { subjectService } from '@/api/services/subject.service';
import { teacherService } from '@/api/services/teacher.service';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  fullName: string;
  employeeId?: string;
}

interface Class {
  id: string;
  grade: number;
  section: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface GradingPermission {
  id?: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  canGrade: boolean;
  canModify: boolean;
  teacher?: Teacher;
  subject?: Subject;
  class?: Class;
}

interface GradingPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const GradingPermissionsModal: React.FC<GradingPermissionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [permissions, setPermissions] = useState<GradingPermission[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<Partial<GradingPermission> | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersRes, classesRes, subjectsRes] = await Promise.all([
        teacherService.getAllTeachers(),
        classService.getAllClasses(),
        subjectService.getAllSubjects(),
      ]);

      // Handle both direct array and paginated response
      const teacherList = Array.isArray(teachersRes.data)
        ? teachersRes.data
        : teachersRes.data?.data || [];
      setTeachers(teacherList);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);

      // Fetch existing permissions
      // Note: You might want to add an endpoint to get all permissions
      // For now, we'll start with an empty array
      setPermissions([]);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = () => {
    setEditingPermission({
      teacherId: '',
      subjectId: '',
      classId: '',
      canGrade: true,
      canModify: true,
    });
  };

  const handleSavePermission = async () => {
    if (
      !editingPermission ||
      !editingPermission.teacherId ||
      !editingPermission.subjectId ||
      !editingPermission.classId
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      if (editingPermission.id) {
        // Update existing permission
        await gradingService.updateGradingPermission(
          editingPermission.id,
          editingPermission,
        );
        toast.success('Permission updated successfully');
      } else {
        // Create new permission
        await gradingService.createGradingPermission({
          teacherId: editingPermission.teacherId!,
          subjectId: editingPermission.subjectId!,
          classId: editingPermission.classId!,
          canGrade: editingPermission.canGrade,
          canModify: editingPermission.canModify,
        });
        toast.success('Permission created successfully');
      }

      setEditingPermission(null);
      fetchData(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save permission');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this permission?'))
      return;

    try {
      setLoading(true);
      await gradingService.deleteGradingPermission(permissionId);
      toast.success('Permission deleted successfully');
      fetchData(); // Refresh the list
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to delete permission',
      );
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher
      ? `${teacher.fullName} (${teacher.employeeId || 'N/A'})`
      : 'Unknown Teacher';
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? `${subject.name} (${subject.code})` : 'Unknown Subject';
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `Grade ${cls.grade}-${cls.section}` : 'Unknown Class';
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
            <Users className='h-6 w-6' />
            Grading Permissions
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
          <div className='flex items-center justify-between mb-6'>
            <p className='text-gray-600'>
              Manage which teachers can grade specific subjects for specific
              classes.
            </p>
            <Button
              onClick={handleAddPermission}
              className='flex items-center gap-2'
            >
              <Plus className='h-4 w-4' />
              Add Permission
            </Button>
          </div>

          {loading ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='mt-2 text-gray-500'>Loading permissions...</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {permissions.map(permission => (
                <div
                  key={permission.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
                >
                  <div className='flex items-center space-x-6'>
                    <div className='flex items-center space-x-2'>
                      <GraduationCap className='h-5 w-5 text-blue-600' />
                      <div>
                        <div className='font-medium'>
                          {getTeacherName(permission.teacherId)}
                        </div>
                        <div className='text-sm text-gray-500'>Teacher</div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <BookOpen className='h-5 w-5 text-green-600' />
                      <div>
                        <div className='font-medium'>
                          {getSubjectName(permission.subjectId)}
                        </div>
                        <div className='text-sm text-gray-500'>Subject</div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Users className='h-5 w-5 text-purple-600' />
                      <div>
                        <div className='font-medium'>
                          {getClassName(permission.classId)}
                        </div>
                        <div className='text-sm text-gray-500'>Class</div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-4 text-sm'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${permission.canGrade ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {permission.canGrade ? 'Can Grade' : 'No Grade'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${permission.canModify ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {permission.canModify ? 'Can Modify' : 'No Modify'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePermission(permission.id!)}
                    className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              ))}

              {permissions.length === 0 && (
                <div className='text-center py-12 text-gray-500'>
                  <Users className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                  <p className='text-lg font-medium'>
                    No permissions configured
                  </p>
                  <p className='text-sm'>
                    Click "Add Permission" to assign grading permissions to
                    teachers
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50'>
          <Button
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
          >
            Close
          </Button>
        </div>
      </div>

      {/* Add/Edit Permission Modal */}
      {editingPermission && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <h3 className='text-lg font-semibold'>
                {editingPermission.id ? 'Edit' : 'Add'} Grading Permission
              </h3>
              <button
                onClick={() => setEditingPermission(null)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='p-4 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Teacher
                </label>
                <Select
                  value={editingPermission.teacherId || ''}
                  onValueChange={value =>
                    setEditingPermission(prev =>
                      prev ? { ...prev, teacherId: value } : null,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select teacher' />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.fullName} ({teacher.employeeId || 'N/A'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Subject
                </label>
                <Select
                  value={editingPermission.subjectId || ''}
                  onValueChange={value =>
                    setEditingPermission(prev =>
                      prev ? { ...prev, subjectId: value } : null,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select subject' />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Class
                </label>
                <Select
                  value={editingPermission.classId || ''}
                  onValueChange={value =>
                    setEditingPermission(prev =>
                      prev ? { ...prev, classId: value } : null,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select class' />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        Grade {cls.grade}-{cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center'>
                  <Checkbox
                    label='Can grade students'
                    checked={editingPermission.canGrade || false}
                    onChange={e =>
                      setEditingPermission(prev =>
                        prev ? { ...prev, canGrade: e.target.checked } : null,
                      )
                    }
                  />
                </div>
                <div className='flex items-center'>
                  <Checkbox
                    label='Can modify existing grades'
                    checked={editingPermission.canModify || false}
                    onChange={e =>
                      setEditingPermission(prev =>
                        prev ? { ...prev, canModify: e.target.checked } : null,
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50'>
              <Button
                onClick={() => setEditingPermission(null)}
                className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePermission}
                disabled={
                  loading ||
                  !editingPermission.teacherId ||
                  !editingPermission.subjectId ||
                  !editingPermission.classId
                }
                className='flex items-center gap-2'
              >
                <Save className='h-4 w-4' />
                {loading ? 'Saving...' : 'Save Permission'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingPermissionsModal;
