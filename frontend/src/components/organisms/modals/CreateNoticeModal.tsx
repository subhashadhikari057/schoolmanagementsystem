// CreateNoticeModal.tsx
// Modal for creating a new notice (Notice Management)

import React, { useState, useEffect, useRef } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Checkbox from '@/components/atoms/form-controls/Checkbox';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { useAuth } from '@/hooks/useAuth';
import {
  noticeService,
  StudentWithParents,
} from '@/api/services/notice.service';
import { toast } from 'sonner';
import {
  NoticePriority,
  NoticePriorityLabels,
  NoticeRecipientType,
  NoticeRecipientTypeLabels,
  NoticeCategory,
  NoticeCategoryLabels,
} from '@sms/shared-types';

// Types based on DTO structure
type FormState = {
  title: string;
  content: string;
  priority: NoticePriority;
  recipientType: NoticeRecipientType;
  selectedClassId?: string;
  selectedStudentId?: string;
  category?: NoticeCategory;
  publishDate: string;
  expiryDate: string;
  attachments: File[];
  sendEmailNotification: boolean;
  sendSMSNotification: boolean;
};

type ClassOption = {
  value: string;
  label: string;
};

type StudentOption = {
  value: string;
  label: string;
  student: StudentWithParents;
};

export default function CreateNoticeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const defaultRecipientType = isTeacher
    ? NoticeRecipientType.CLASS
    : NoticeRecipientType.ALL;
  const [form, setForm] = useState<FormState>({
    title: '',
    content: '',
    priority: NoticePriority.MEDIUM,
    recipientType: defaultRecipientType,
    selectedClassId: undefined,
    selectedStudentId: undefined,
    category: undefined,
    publishDate: '',
    expiryDate: '',
    attachments: [],
    sendEmailNotification: false,
    sendSMSNotification: false,
  });

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      priority: NoticePriority.MEDIUM,
      recipientType: defaultRecipientType,
      selectedClassId: undefined,
      selectedStudentId: undefined,
      category: undefined,
      publishDate: '',
      expiryDate: '',
      attachments: [],
      sendEmailNotification: false,
      sendSMSNotification: false,
    });
  };

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentOption[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch classes and students on component mount and reset form when modal opens
  useEffect(() => {
    if (open) {
      fetchClasses();
      fetchStudents();
      resetForm(); // Reset form when modal opens
    }
  }, [open]);

  useEffect(() => {
    if (!isTeacher) return;
    if (
      form.recipientType === NoticeRecipientType.CLASS ||
      form.recipientType === NoticeRecipientType.SPECIFIC_PARENT
    ) {
      return;
    }

    setForm(f => ({
      ...f,
      recipientType: NoticeRecipientType.CLASS,
      selectedClassId: undefined,
      selectedStudentId: undefined,
    }));
  }, [isTeacher, form.recipientType]);

  // Filter students when class selection or search term changes
  useEffect(() => {
    if (form.recipientType === NoticeRecipientType.SPECIFIC_PARENT) {
      filterStudents(form.selectedClassId, studentSearchTerm);
    }
  }, [form.selectedClassId, studentSearchTerm, students]);

  // Reset student search when recipient type changes
  useEffect(() => {
    if (form.recipientType !== NoticeRecipientType.SPECIFIC_PARENT) {
      setStudentSearchTerm('');
      setFilteredStudents([]);
      setIsStudentDropdownOpen(false);
    }
  }, [form.recipientType]);

  // Close student dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStudentDropdownOpen(false);
      }
    };

    if (isStudentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isStudentDropdownOpen]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await noticeService.getAvailableClasses();
      if (response.success && response.data) {
        const classOptions: ClassOption[] = response.data.map(cls => ({
          value: cls.id,
          label: `Grade ${cls.grade} Section ${cls.section} (${cls.shift})`,
        }));
        setClasses(classOptions);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await noticeService.getStudentsWithParents();
      if (response.success && response.data) {
        const studentOptions: StudentOption[] = response.data.map(student => ({
          value: student.id,
          label: `${student.user.fullName} (Roll: ${student.rollNumber}) - ${student.class.name}`,
          student,
        }));
        setStudents(studentOptions);
        setFilteredStudents(studentOptions);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  // Filter students by selected class and search term
  const filterStudents = (classId?: string, searchTerm: string = '') => {
    let filtered = students;

    // Filter by class if selected
    if (classId) {
      filtered = filtered.filter(
        student => student.student.class.id === classId,
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        student =>
          student.student.user.fullName.toLowerCase().includes(term) ||
          student.student.rollNumber.toLowerCase().includes(term) ||
          student.student.class.name.toLowerCase().includes(term),
      );
    }

    setFilteredStudents(filtered);
  };

  if (!open) return null;

  // Convert enums to dropdown options
  const priorityOptions = Object.entries(NoticePriorityLabels).map(
    ([value, label]) => ({
      value: value as NoticePriority,
      label,
    }),
  );

  const recipientTypeOptions = Object.entries(NoticeRecipientTypeLabels).map(
    ([value, label]) => ({
      value: value as NoticeRecipientType,
      label,
    }),
  );

  const allowedRecipientTypeOptions = isTeacher
    ? recipientTypeOptions.filter(option =>
        [
          NoticeRecipientType.CLASS,
          NoticeRecipientType.SPECIFIC_PARENT,
        ].includes(option.value),
      )
    : recipientTypeOptions;

  const categoryOptions = Object.entries(NoticeCategoryLabels).map(
    ([value, label]) => ({
      value: value as NoticeCategory,
      label,
    }),
  );

  const toISOStartOfDay = (value?: string) => {
    if (!value) return new Date().toISOString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`).toISOString();
    }
    return new Date(value).toISOString();
  };

  const toISOEndOfDay = (value?: string) => {
    if (!value)
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T23:59:59`).toISOString();
    }
    return new Date(value).toISOString();
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!form.title.trim() || !form.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate class selection when recipient type is CLASS
    if (
      form.recipientType === NoticeRecipientType.CLASS &&
      !form.selectedClassId
    ) {
      alert('Please select a class when recipient type is Class');
      return;
    }

    // Validate class and student selection when recipient type is SPECIFIC_PARENT
    if (form.recipientType === NoticeRecipientType.SPECIFIC_PARENT) {
      if (!form.selectedClassId) {
        alert(
          'Please select a class first when recipient type is Specific Parent',
        );
        return;
      }
      if (!form.selectedStudentId) {
        alert('Please select a student when recipient type is Specific Parent');
        return;
      }
    }

    try {
      setLoading(true);

      const publishISO = toISOStartOfDay(form.publishDate);
      const expiryISO = toISOEndOfDay(form.expiryDate);

      const noticeData = {
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority.toUpperCase() as
          | 'LOW'
          | 'MEDIUM'
          | 'HIGH'
          | 'URGENT',
        recipientType: form.recipientType.toUpperCase() as
          | 'ALL'
          | 'STUDENT'
          | 'PARENT'
          | 'TEACHER'
          | 'STAFF'
          | 'CLASS'
          | 'SPECIFIC_PARENT',
        selectedClassId: form.selectedClassId,
        selectedStudentId: form.selectedStudentId,
        category: form.category
          ? (form.category.toUpperCase() as
              | 'GENERAL'
              | 'ACADEMIC'
              | 'EXAMINATION'
              | 'FEE'
              | 'EVENT'
              | 'HOLIDAY'
              | 'MEETING'
              | 'ANNOUNCEMENT'
              | 'URGENT'
              | 'OTHER')
          : undefined,
        publishDate: publishISO,
        expiryDate: expiryISO, // Default ensured above
        sendEmailNotification: form.sendEmailNotification,
        status: 'PUBLISHED' as 'PUBLISHED', // Set status to PUBLISHED (using Prisma enum value)
        attachments: [], // Add empty attachments array as required by schema
      };

      console.log('Sending notice data:', JSON.stringify(noticeData, null, 2));
      console.log('Priority value:', noticeData.priority);
      console.log('RecipientType value:', noticeData.recipientType);
      console.log('Category value:', noticeData.category);
      console.log('PublishDate value:', noticeData.publishDate);
      console.log('ExpiryDate value:', noticeData.expiryDate);

      const response = await noticeService.createNotice(
        noticeData,
        form.attachments,
      );

      if (response.success) {
        toast.success('Notice created successfully!');
        // Notify notices list to refresh immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notices:refresh'));
        }
        resetForm(); // Reset form to clear old data
        onClose();
      } else {
        toast.error(
          `Failed to create notice: ${response.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Error creating notice:', error);
      console.error(
        'Error validation errors:',
        (error as { validationErrors?: unknown }).validationErrors,
      );
      console.error('Error message:', (error as { message?: string }).message);
      toast.error(
        `Error creating notice: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!form.title.trim() || !form.content.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate class selection when recipient type is CLASS
      if (
        form.recipientType === NoticeRecipientType.CLASS &&
        !form.selectedClassId
      ) {
        alert('Please select a class when recipient type is Class');
        return;
      }

      // Validate class and student selection when recipient type is SPECIFIC_PARENT
      if (form.recipientType === NoticeRecipientType.SPECIFIC_PARENT) {
        if (!form.selectedClassId) {
          alert(
            'Please select a class first when recipient type is Specific Parent',
          );
          return;
        }
        if (!form.selectedStudentId) {
          alert(
            'Please select a student when recipient type is Specific Parent',
          );
          return;
        }
      }

      const publishISO = toISOStartOfDay(form.publishDate);
      const expiryISO = toISOEndOfDay(form.expiryDate);

      const noticeData = {
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority.toUpperCase() as
          | 'LOW'
          | 'MEDIUM'
          | 'HIGH'
          | 'URGENT',
        recipientType: form.recipientType.toUpperCase() as
          | 'ALL'
          | 'STUDENT'
          | 'PARENT'
          | 'TEACHER'
          | 'STAFF'
          | 'CLASS'
          | 'SPECIFIC_PARENT',
        selectedClassId: form.selectedClassId,
        selectedStudentId: form.selectedStudentId,
        category: form.category
          ? (form.category.toUpperCase() as
              | 'GENERAL'
              | 'ACADEMIC'
              | 'EXAMINATION'
              | 'FEE'
              | 'EVENT'
              | 'HOLIDAY'
              | 'MEETING'
              | 'ANNOUNCEMENT'
              | 'URGENT'
              | 'OTHER')
          : undefined,
        publishDate: publishISO,
        expiryDate: expiryISO,
        sendEmailNotification: form.sendEmailNotification,
        status: 'DRAFT' as 'DRAFT', // Set status to DRAFT (using Prisma enum value)
        attachments: [], // Add empty attachments array as required by schema
      };

      console.log(
        'Sending draft notice data:',
        JSON.stringify(noticeData, null, 2),
      );

      const response = await noticeService.createNotice(
        noticeData,
        form.attachments,
      );

      if (response.success) {
        toast.success('Draft saved successfully!');
        // Notify notices list to refresh immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notices:refresh'));
        }
        resetForm(); // Reset form to clear old data
        onClose();
      } else {
        toast.error(
          `Failed to save draft: ${response.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      console.error(
        'Error validation errors:',
        (error as { validationErrors?: unknown }).validationErrors,
      );
      console.error('Error message:', (error as { message?: string }).message);
      toast.error(
        `Error saving draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientTypeChange = (value: NoticeRecipientType) => {
    setForm(f => ({
      ...f,
      recipientType: value,
      // Clear selectedClassId if not CLASS or SPECIFIC_PARENT type
      selectedClassId:
        value !== NoticeRecipientType.CLASS &&
        value !== NoticeRecipientType.SPECIFIC_PARENT
          ? undefined
          : f.selectedClassId,
      // Clear selectedStudentId if not SPECIFIC_PARENT type
      selectedStudentId:
        value !== NoticeRecipientType.SPECIFIC_PARENT
          ? undefined
          : f.selectedStudentId,
    }));

    // Clear student search when changing recipient type
    if (value !== NoticeRecipientType.SPECIFIC_PARENT) {
      setStudentSearchTerm('');
      setIsStudentDropdownOpen(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 h-screen flex items-center justify-center bg-black/20 overflow-y-auto'>
      <div className='bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl p-0 mx-2 my-6 max-h-[90vh] overflow-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-4 sm:px-6 pt-6 pb-2 border-b border-slate-200 bg-slate-50'>
          <SectionTitle text='Create New Notice' className='text-xl' />
          <button
            onClick={() => {
              resetForm(); // Reset form when closing
              onClose();
            }}
            className='text-slate-400 hover:text-slate-700 text-xl'
            aria-label='Close'
            type='button'
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form className='p-4 sm:p-6' onSubmit={handlePublish}>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Left Column */}
            <div className='space-y-4'>
              {/* Title */}
              <div>
                <Label>Title *</Label>
                <Input
                  type='text'
                  value={form.title}
                  onChange={e =>
                    setForm(f => ({ ...f, title: e.target.value }))
                  }
                  placeholder='Enter notice title'
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <Label>Priority *</Label>
                <Dropdown
                  type='filter'
                  placeholder='Select Priority'
                  options={priorityOptions}
                  selectedValue={form.priority}
                  onSelect={value =>
                    setForm(f => ({ ...f, priority: value as NoticePriority }))
                  }
                  className='max-w-xs'
                />
              </div>
            </div>

            {/* Right Column */}
            <div className='space-y-4'>
              {/* Dates */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label>Publish Date</Label>
                  <Input
                    type='date'
                    value={form.publishDate}
                    onChange={e =>
                      setForm(f => ({ ...f, publishDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    type='date'
                    value={form.expiryDate}
                    onChange={e =>
                      setForm(f => ({ ...f, expiryDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Recipients */}
              <div>
                <Label>Recipients *</Label>
                <div className='flex gap-4'>
                  <Dropdown
                    type='filter'
                    placeholder='Select Recipient Type'
                    options={allowedRecipientTypeOptions}
                    selectedValue={form.recipientType}
                    onSelect={value =>
                      handleRecipientTypeChange(value as NoticeRecipientType)
                    }
                    className='max-w-xs'
                  />
                  {(form.recipientType === NoticeRecipientType.CLASS ||
                    form.recipientType ===
                      NoticeRecipientType.SPECIFIC_PARENT) && (
                    <Dropdown
                      type='filter'
                      placeholder={
                        loading ? 'Loading classes...' : 'Select Class'
                      }
                      options={loading ? [] : classes}
                      selectedValue={form.selectedClassId}
                      onSelect={value =>
                        setForm(f => ({ ...f, selectedClassId: value }))
                      }
                      className='max-w-xs'
                    />
                  )}
                </div>
                {form.recipientType === NoticeRecipientType.SPECIFIC_PARENT && (
                  <div className='mt-1 space-y-1'>
                    <p className='text-xs text-blue-600'>
                      <strong>Note:</strong> This will send the notice to the
                      parents of the selected student only.
                    </p>
                    {!form.selectedClassId && (
                      <p className='text-xs text-orange-600'>
                        <strong>Step 1:</strong> First select a class above,
                        then choose a student from that class.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content - Full Width */}
          <div>
            <Label>Notice Content *</Label>
            <textarea
              className='border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:ring-primary min-h-[120px] px-3 py-2'
              rows={5}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder='Write your notice content here...'
              required
            />
          </div>

          {/* Student Selection for SPECIFIC_PARENT - Full Width */}
          {form.recipientType === NoticeRecipientType.SPECIFIC_PARENT &&
            form.selectedClassId && (
              <div>
                <Label>Select Student *</Label>
                <p className='text-xs text-green-600 mb-2'>
                  <strong>Step 2:</strong> Now select a student from the chosen
                  class.
                </p>

                {/* Custom Searchable Dropdown */}
                <div className='relative' ref={studentDropdownRef}>
                  <div className='relative'>
                    <input
                      type='text'
                      placeholder='Search students by name, roll number, or class...'
                      value={studentSearchTerm}
                      onChange={e => {
                        setStudentSearchTerm(e.target.value);
                        setIsStudentDropdownOpen(true);
                      }}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                    <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                      <svg
                        className='h-4 w-4 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Dropdown Options */}
                  {isStudentDropdownOpen && (
                    <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                      {filteredStudents.length === 0 ? (
                        <div className='px-3 py-2 text-sm text-gray-500'>
                          {studentSearchTerm
                            ? `No students found matching "${studentSearchTerm}"`
                            : 'Start typing to search students...'}
                        </div>
                      ) : (
                        filteredStudents.map(student => (
                          <div
                            key={student.value}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                              form.selectedStudentId === student.value
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-900'
                            }`}
                            onClick={() => {
                              setForm(f => ({
                                ...f,
                                selectedStudentId: student.value,
                              }));
                              setStudentSearchTerm(student.label);
                              setIsStudentDropdownOpen(false);
                            }}
                          >
                            {student.label}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Student Display */}
                  {form.selectedStudentId && !studentSearchTerm && (
                    <div className='mt-2 p-2 bg-gray-50 rounded-md'>
                      <div className='text-sm text-gray-700'>
                        <strong>Selected:</strong>{' '}
                        {
                          filteredStudents.find(
                            s => s.value === form.selectedStudentId,
                          )?.label
                        }
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            selectedStudentId: undefined,
                          }));
                          setStudentSearchTerm('');
                          setIsStudentDropdownOpen(true);
                        }}
                        className='text-xs text-blue-600 hover:text-blue-800 mt-1'
                      >
                        Change selection
                      </button>
                    </div>
                  )}

                  {/* Student Count Info */}
                  {form.selectedClassId && (
                    <p className='text-xs text-gray-500 mt-2'>
                      Showing {filteredStudents.length} student(s) from selected
                      class
                      {studentSearchTerm && ` matching "${studentSearchTerm}"`}
                    </p>
                  )}
                </div>
              </div>
            )}

          {/* Additional Fields - Grid Layout */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Left Column */}
            <div className='space-y-4'>
              {/* Categories */}
              <div>
                <Label>Category</Label>
                <Dropdown
                  type='filter'
                  placeholder='Select Category'
                  options={categoryOptions}
                  selectedValue={form.category}
                  onSelect={value =>
                    setForm(f => ({ ...f, category: value as NoticeCategory }))
                  }
                  className='max-w-xs'
                />
              </div>

              {/* Notifications */}
              <div className='flex flex-col gap-2'>
                <Checkbox
                  label='Send email notification'
                  checked={form.sendEmailNotification}
                  onChange={() =>
                    setForm(f => ({
                      ...f,
                      sendEmailNotification: !f.sendEmailNotification,
                    }))
                  }
                />
                <Checkbox
                  label='Send SMS notification'
                  checked={form.sendSMSNotification}
                  onChange={() =>
                    setForm(f => ({
                      ...f,
                      sendSMSNotification: !f.sendSMSNotification,
                    }))
                  }
                />
              </div>
            </div>

            {/* Right Column */}
            <div className='space-y-4'>
              {/* Attachments */}
              <div>
                <Label>Attachments</Label>
                <div className='flex flex-col xs:flex-row gap-2 items-stretch xs:items-center'>
                  <input
                    type='file'
                    multiple
                    className='block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-blue-200 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        attachments: e.target.files
                          ? Array.from(e.target.files)
                          : [],
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex flex-row items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-200'>
            <Button
              type='button'
              className='px-4 py-2 rounded border border-blue-700 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed'
              onClick={loading ? undefined : handleSaveDraft}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              type='submit'
              className='px-4 py-2 rounded flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed'
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Notice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
