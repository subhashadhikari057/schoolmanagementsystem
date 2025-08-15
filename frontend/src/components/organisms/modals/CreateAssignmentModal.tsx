import React, { useState } from 'react';
import Tabs from '../../organisms/tabs/GenericTabs';
import Input from '@/components/atoms/form-controls/Input';
import Textarea from '@/components/atoms/form-controls/Textarea';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import Checkbox from '@/components/atoms/form-controls/Checkbox';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const classOptions = [
  { label: 'Grade 9 - Section A', students: 32 },
  { label: 'Grade 9 - Section B', students: 30 },
  { label: 'Grade 10 - Section A', students: 35 },
  { label: 'Grade 10 - Section B', students: 33 },
  { label: 'Grade 11 - Section A', students: 28 },
  { label: 'Grade 11 - Section B', students: 26 },
];

const submissionFormats = [
  'PDF Document',
  'Word Document',
  'Text Entry',
  'Image/Photo',
  'Video',
  'Website Link',
  'Compressed File',
];

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [notifyParents, setNotifyParents] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [subject, setSubject] = useState('');
  const [assignmentType, setAssignmentType] = useState('');
  const [priority, setPriority] = useState('medium');

  // Add state for form fields
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignedDate, setAssignedDate] = useState('2025-08-12');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [maxMarks, setMaxMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [detailedInstructions, setDetailedInstructions] = useState('');

  if (!isOpen) return null;

  // Tab content for each tab, using your custom components
  const tabContents = [
    // Basic Info
    <div className='space-y-6'>
      {/* Assignment Details Section */}
      <div className='space-y-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Assignment Title *
            </label>
            <Input
              placeholder='e.g., Chapter 5 Mathematics'
              className='h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              value={assignmentTitle}
              onChange={e => setAssignmentTitle(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Assigned Date
            </label>
            <Input
              type='date'
              value={assignedDate}
              onChange={e => setAssignedDate(e.target.value)}
              className='h-11 border-gray-300 bg-gray-50'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Due Date *
            </label>
            <Input
              type='date'
              className='h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Due Time
            </label>
            <div className='relative'>
              <Input
                type='time'
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className='h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10'
              />
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='h-5 w-5 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Subject *
            </label>
            <Dropdown
              placeholder='Select subject'
              options={[
                { value: '', label: 'Select subject' },
                { value: 'mathematics', label: 'Mathematics' },
                { value: 'physics', label: 'Physics' },
                { value: 'chemistry', label: 'Chemistry' },
                { value: 'biology', label: 'Biology' },
                { value: 'english-literature', label: 'English Literature' },
                { value: 'world-history', label: 'World History' },
                { value: 'geography', label: 'Geography' },
                { value: 'computer-science', label: 'Computer Science' },
                { value: 'physical-education', label: 'Physical Education' },
                { value: 'fine-arts', label: 'Fine Arts' },
              ]}
              className='w-full h-11'
              selectedValue={subject}
              onSelect={setSubject}
              type='filter'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Assignment Type *
            </label>
            <Dropdown
              placeholder='Select assignment type'
              options={[
                { value: '', label: 'Select assignment type' },
                { value: 'homework', label: 'Homework' },
                { value: 'project', label: 'Project' },
                { value: 'essay', label: 'Essay' },
                { value: 'presentation', label: 'Presentation' },
                { value: 'lab-report', label: 'Lab Report' },
                { value: 'quiz', label: 'Quiz' },
                { value: 'research-assignment', label: 'Research Assignment' },
                { value: 'practical-work', label: 'Practical Work' },
              ]}
              className='w-full h-11'
              selectedValue={assignmentType}
              onSelect={setAssignmentType}
              type='filter'
            />
          </div>
        </div>
      </div>

      {/* Marks Section */}
      <div className='space-y-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Maximum Marks *
            </label>
            <Input
              type='number'
              value={maxMarks}
              onChange={e => setMaxMarks(Number(e.target.value))}
              className='h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Passing Marks
            </label>
            <Input
              type='number'
              value={passingMarks}
              onChange={e => setPassingMarks(Number(e.target.value))}
              className='h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            />
          </div>
        </div>
      </div>

      {/* Priority Section */}
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Priority
          </label>
          <Dropdown
            placeholder='Medium Priority'
            options={[
              { value: 'low', label: 'Low Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'high', label: 'High Priority' },
            ]}
            className='w-full h-11'
            selectedValue={priority}
            onSelect={setPriority}
            type='filter'
          />
        </div>
      </div>

      {/* Assign to Classes Section */}
      <div className='space-y-4'>
        <label className='block text-sm font-medium text-gray-700 mb-3'>
          Assign to Classes *
        </label>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {classOptions.map((cls, idx) => (
            <label
              key={cls.label}
              className={`flex items-center border rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 gap-3 shadow-sm hover:shadow-md
                  ${
                    selectedClasses.includes(idx)
                      ? 'border-blue-600 bg-blue-50 shadow-blue-100'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                  }
                `}
              style={{ minHeight: '64px' }}
            >
              <input
                type='checkbox'
                checked={selectedClasses.includes(idx)}
                onChange={() =>
                  setSelectedClasses(
                    selectedClasses.includes(idx)
                      ? selectedClasses.filter(i => i !== idx)
                      : [...selectedClasses, idx],
                  )
                }
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
              />
              <div className='flex flex-col justify-center flex-1'>
                <div className='font-medium text-sm text-gray-900 leading-tight'>
                  {cls.label}
                </div>
                <div className='text-xs text-gray-500 leading-tight mt-0.5'>
                  {cls.students} students
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>,
    // Assignment
    <div className='space-y-6'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Assignment Description *
        </label>
        <Textarea
          className='h-24 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          rows={3}
          placeholder='Provide a clear description of what students need to do...'
          value={assignmentDescription}
          onChange={e => setAssignmentDescription(e.target.value)}
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Detailed Instructions
        </label>
        <Textarea
          className='h-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          rows={3}
          placeholder='Provide step-by-step instructions, formatting requirements, etc...'
          value={detailedInstructions}
          onChange={e => setDetailedInstructions(e.target.value)}
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Attach Files
        </label>
        <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-blue-400 transition-colors'>
          <div className='text-4xl mb-3'>📎</div>
          <p className='text-gray-500 mb-4 text-sm'>
            Upload assignment materials, worksheets, or reference files
          </p>
          <Input type='file' className='hidden' id='file-upload' multiple />
          <label
            htmlFor='file-upload'
            className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors'
          >
            Choose Files
          </label>
        </div>
      </div>
    </div>,
    // Submission
    <div className='space-y-6'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-3'>
          Accepted Submission Formats
        </label>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {submissionFormats.map((format, idx) => (
            <label key={format} className='flex items-center gap-2'>
              <Checkbox
                checked={selectedFormats.includes(format)}
                onChange={() =>
                  setSelectedFormats(
                    selectedFormats.includes(format)
                      ? selectedFormats.filter(f => f !== format)
                      : [...selectedFormats, format],
                  )
                }
                label={format}
              />
            </label>
          ))}
        </div>
      </div>
      <div className='flex flex-wrap gap-4'>
        <label className='flex items-center gap-2'>
          <Checkbox label='Allow Late Submission' />
        </label>
        <label className='flex items-center gap-2'>
          <Checkbox label='Use Grading Rubric' />
        </label>
        <label className='flex items-center gap-2'>
          <Checkbox label='Enable Plagiarism Check' />
        </label>
        <label className='flex items-center gap-2'>
          <Checkbox label='Enable Auto-Grading' />
        </label>
      </div>
    </div>,
    // Settings
    <div className='space-y-6'>
      <div className='space-y-3'>
        <Checkbox
          checked={notifyStudents}
          onChange={() => setNotifyStudents(v => !v)}
          label='Notify Students via Email/SMS'
        />
        <Checkbox
          checked={notifyParents}
          onChange={() => setNotifyParents(v => !v)}
          label='Notify Parents via Email/SMS'
        />
        <Checkbox
          checked={autoPublish}
          onChange={() => setAutoPublish(v => !v)}
          label='Auto-publish Results After Grading'
        />
      </div>
      <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
        <div className='font-semibold text-gray-900 mb-3'>
          Assignment Summary
        </div>
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Title:</span>
            <span className='text-gray-500'>
              {assignmentTitle || 'Not set'}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Subject:</span>
            <span className='text-gray-500'>{subject || 'Not selected'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Type:</span>
            <span className='text-gray-500'>
              {assignmentType || 'Not selected'}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Priority:</span>
            <span className='bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium'>
              {priority}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Due Date:</span>
            <span className='text-gray-500'>{dueDate || 'Not set'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Max Marks:</span>
            <span className='text-gray-500'>{maxMarks || 'Not set'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Classes:</span>
            <span className='text-gray-500'>
              {selectedClasses.length} selected
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Students:</span>
            <span className='text-gray-500'>
              {selectedClasses.reduce(
                (total, idx) => total + classOptions[idx].students,
                0,
              )}{' '}
              total
            </span>
          </div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl p-0 relative border border-gray-200 my-8 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-5 h-5 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            Create New Assignment
          </h2>
          <button
            className='text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors'
            onClick={onClose}
            aria-label='Close'
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className='px-6 pt-4 pb-2'>
          <div className='flex space-x-1 border-b border-gray-200'>
            {[
              { name: 'Basic Info', icon: '📄' },
              { name: 'Assignment', icon: '📝' },
              { name: 'Submission', icon: '📤' },
              { name: 'Settings', icon: '⚙️' },
            ].map((tab, index) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                  activeTab === index
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className='text-base'>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className='px-6 py-6'>{tabContents[activeTab]}</div>

        {/* Footer */}
        <div className='px-6 py-4 flex justify-end gap-3 border-t border-gray-200 bg-gray-50 rounded-b-xl'>
          <Button
            onClick={onClose}
            className='px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 transition-colors shadow-sm'
            label='Cancel'
          />
          <Button
            className='px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors'
            label='Create Assignment'
          />
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
