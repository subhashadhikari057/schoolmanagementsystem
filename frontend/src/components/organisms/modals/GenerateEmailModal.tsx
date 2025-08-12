import React, { useState } from 'react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import Button from '@/components/atoms/form-controls/Button';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import SectionTitle from '@/components/atoms/display/SectionTitle';

interface GenerateEmailModalProps {
  open: boolean;
  onClose: () => void;
  userType: 'student' | 'parent' | 'teacher';
}

const classOptions = [
  { label: 'Grade 9', value: 'g9' },
  { label: 'Grade 10', value: 'g10' },
  { label: 'Grade 11', value: 'g11' },
  { label: 'Grade 12', value: 'g12' },
];
const sectionOptions = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
];
const departmentOptions = [
  { label: 'Mathematics', value: 'math' },
  { label: 'Science', value: 'science' },
  { label: 'English', value: 'english' },
  { label: 'Social Studies', value: 'social' },
];
const mockStudents = [
  { id: 'S001', name: 'Alice Johnson' },
  { id: 'S002', name: 'Bob Smith' },
  { id: 'S003', name: 'Charlie Brown' },
  { id: 'S004', name: 'Diana Prince' },
];

const studentTemplates = {
  'Exam Schedule': `Dear [STUDENT_NAME],\n\nPlease be informed that the exam schedule for [CLASS] is as follows:\n\n- Math: 10th Sept, 10:00 AM\n- Science: 12th Sept, 10:00 AM\n- English: 14th Sept, 10:00 AM\n\nBest of luck!\nSchool Administration`,
  'Holiday Notice': `Dear all,\n\nThis is to inform you that the school will remain closed on [DATE] due to [REASON].\n\nEnjoy your holiday!\nSchool Administration`,
  'Fee Reminder': `Dear [STUDENT_NAME],\n\nThis is a gentle reminder that your school fee for [MONTH] is due. Please make the payment by [DUE_DATE] to avoid any late fees.\n\nThank you,\nSchool Accounts Department`,
  'Event Invitation': `Dear [STUDENT_NAME],\n\nYou are cordially invited to participate in the [EVENT_NAME] event to be held on [DATE] at [VENUE].\n\nWe hope to see you there!\nSchool Events Team`,
};
const studentTemplateOptions = [
  { label: 'Custom Message', value: 'custom' },
  { label: 'Exam Schedule', value: 'Exam Schedule' },
  { label: 'Holiday Notice', value: 'Holiday Notice' },
  { label: 'Fee Reminder', value: 'Fee Reminder' },
  { label: 'Event Invitation', value: 'Event Invitation' },
];

const parentTemplates = {
  'Parent Meeting': `Dear [PARENT_NAME],\n\nYou are invited to attend the parent-teacher meeting for your child [STUDENT_NAME] ([CLASS]) on [DATE] at [TIME].\n\nWe look forward to your presence.\nSchool Administration`,
  'Holiday Notice': `Dear Parents,\n\nThe school will remain closed on [DATE] due to [REASON].\n\nThank you for your cooperation.\nSchool Administration`,
  'Fee Reminder': `Dear [PARENT_NAME],\n\nThis is a reminder that the school fee for your child [STUDENT_NAME] ([CLASS]) for [MONTH] is due. Please make the payment by [DUE_DATE].\n\nThank you,\nSchool Accounts Department`,
};
const parentTemplateOptions = [
  { label: 'Custom Message', value: 'custom' },
  { label: 'Parent Meeting', value: 'Parent Meeting' },
  { label: 'Holiday Notice', value: 'Holiday Notice' },
  { label: 'Fee Reminder', value: 'Fee Reminder' },
];

const teacherTemplates = {
  'Staff Meeting': `Dear [TEACHER_NAME],\n\nYou are requested to attend the staff meeting scheduled on [DATE] at [TIME] in the [VENUE].\n\nRegards,\nSchool Administration`,
  'Holiday Notice': `Dear Teachers,\n\nThe school will remain closed on [DATE] due to [REASON].\n\nThank you for your dedication.\nSchool Administration`,
  'Event Coordination': `Dear [TEACHER_NAME],\n\nYou have been assigned as the coordinator for [EVENT_NAME] on [DATE]. Please prepare accordingly.\n\nThank you,\nSchool Events Team`,
};
const teacherTemplateOptions = [
  { label: 'Custom Message', value: 'custom' },
  { label: 'Staff Meeting', value: 'Staff Meeting' },
  { label: 'Holiday Notice', value: 'Holiday Notice' },
  { label: 'Event Coordination', value: 'Event Coordination' },
];

const GenerateEmailModal: React.FC<GenerateEmailModalProps> = ({
  open,
  onClose,
  userType,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [groupFilters, setGroupFilters] = useState({
    class: '',
    section: '',
    department: '',
  });
  const [selectedStudents, setSelectedStudents] = useState<
    { id: string; name: string }[]
  >([]);
  const [search, setSearch] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [emailContent, setEmailContent] = useState('');

  // Pick templates/options/variables based on userType
  let templates: Record<string, string> = {};
  let templateOptions: { label: string; value: string }[] = [];
  let availableVariables = '[STUDENT_NAME], [CLASS]';
  if (userType === 'student') {
    templates = studentTemplates;
    templateOptions = studentTemplateOptions;
    availableVariables = '[STUDENT_NAME], [CLASS]';
  } else if (userType === 'parent') {
    templates = parentTemplates;
    templateOptions = parentTemplateOptions;
    availableVariables = '[PARENT_NAME], [STUDENT_NAME], [CLASS]';
  } else if (userType === 'teacher') {
    templates = teacherTemplates;
    templateOptions = teacherTemplateOptions;
    availableVariables = '[TEACHER_NAME], [DEPARTMENT]';
  }

  // Mock recipient count for group selection
  let groupRecipientCount = 0;
  if (userType === 'student' && groupFilters.class && groupFilters.section)
    groupRecipientCount = 45;
  if (userType === 'parent' && groupFilters.class) groupRecipientCount = 30;
  if (userType === 'teacher' && groupFilters.department)
    groupRecipientCount = 10;

  // Filter students for search
  const filteredStudents = mockStudents.filter(
    s =>
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())) &&
      !selectedStudents.some(sel => sel.id === s.id),
  );

  const handleAddStudent = (student: { id: string; name: string }) => {
    setSelectedStudents(prev => [...prev, student]);
    setSearch('');
  };

  const handleRemoveStudent = (id: string) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleTemplateChange = (val: string) => {
    setSelectedTemplate(val);
    if (val === 'custom') {
      setEmailContent('');
    } else {
      setEmailContent(templates[val as keyof typeof templates] || '');
    }
  };

  const handleGenerate = () => {
    if (tabIndex === 0) {
      console.log({
        method: 'group',
        filters: groupFilters,
        emailContent,
      });
    } else {
      console.log({
        method: 'individual',
        students: selectedStudents,
        emailContent,
      });
    }
  };

  if (!open) return null;

  const tabs = [
    {
      name: 'Select by Group',
      content: (
        <div className='space-y-6'>
          {userType === 'student' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <SectionTitle
                  text='Class'
                  className='block text-xs font-medium mb-1'
                  level={6}
                />
                <Dropdown
                  type='filter'
                  options={classOptions}
                  selectedValue={groupFilters.class}
                  onSelect={val => setGroupFilters(f => ({ ...f, class: val }))}
                  className='w-full'
                  placeholder='Class'
                />
              </div>
              <div>
                <SectionTitle
                  text='Section'
                  className='block text-xs font-medium mb-1'
                  level={6}
                />
                <Dropdown
                  type='filter'
                  options={sectionOptions}
                  selectedValue={groupFilters.section}
                  onSelect={val =>
                    setGroupFilters(f => ({ ...f, section: val }))
                  }
                  className='w-full'
                  placeholder='Section'
                />
              </div>
            </div>
          )}
          {userType === 'parent' && (
            <div>
              <SectionTitle
                text='Class'
                className='block text-xs font-medium mb-1'
                level={6}
              />
              <Dropdown
                type='filter'
                options={classOptions}
                selectedValue={groupFilters.class}
                onSelect={val => setGroupFilters(f => ({ ...f, class: val }))}
                className='w-full'
                placeholder='Class'
              />
            </div>
          )}
          {userType === 'teacher' && (
            <div>
              <SectionTitle
                text='Department'
                className='block text-xs font-medium mb-1'
                level={6}
              />
              <Dropdown
                type='filter'
                options={departmentOptions}
                selectedValue={groupFilters.department}
                onSelect={val =>
                  setGroupFilters(f => ({ ...f, department: val }))
                }
                className='w-full'
                placeholder='Department'
              />
            </div>
          )}
          <div className='text-sm text-gray-600 mt-2'>
            {userType === 'student' &&
            groupFilters.class &&
            groupFilters.section
              ? `This email will be sent to ${groupRecipientCount} students.`
              : userType === 'parent' && groupFilters.class
                ? `This email will be sent to ${groupRecipientCount} parents.`
                : userType === 'teacher' && groupFilters.department
                  ? `This email will be sent to ${groupRecipientCount} teachers.`
                  : `Select filter to see recipient count.`}
          </div>
        </div>
      ),
    },
    {
      name: 'Select Individually',
      content: (
        <div className='space-y-4'>
          <input
            type='text'
            className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-primary'
            placeholder='Search students by name or ID'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && filteredStudents.length > 0 && (
            <div className='border rounded bg-white shadow p-2 max-h-32 overflow-y-auto'>
              {filteredStudents.map(s => (
                <div
                  key={s.id}
                  className='cursor-pointer px-2 py-1 hover:bg-gray-100 rounded text-sm'
                  onClick={() => handleAddStudent(s)}
                >
                  {s.name} ({s.id})
                </div>
              ))}
            </div>
          )}
          <div className='flex flex-wrap gap-2'>
            {selectedStudents.map(s => (
              <span
                key={s.id}
                className='flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs cursor-pointer'
              >
                {s.name} ({s.id})
                <span
                  className='ml-1 text-gray-500 hover:text-red-500'
                  onClick={() => handleRemoveStudent(s.id)}
                >
                  ×
                </span>
              </span>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm overflow-y-auto'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-lg p-0 mx-2 my-auto max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between px-4 sm:px-6 pt-6 pb-2 border-b'>
          <SectionTitle text='Generate Emails' />
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-700 text-xl cursor-pointer'
          >
            ×
          </button>
        </div>
        <div className='p-4 sm:p-6 space-y-6'>
          <Tabs tabs={tabs} defaultIndex={tabIndex} className='text-sm' />
          <div className='space-y-2'>
            <SectionTitle text='Email Content' className='mb-1' level={6} />
            <Dropdown
              type='filter'
              options={templateOptions}
              selectedValue={selectedTemplate}
              onSelect={handleTemplateChange}
              className='w-full mb-2'
              placeholder='Select a Template (Optional)'
            />
            <textarea
              className='w-full border rounded px-3 py-2 min-h-[180px] bg-gray-50 focus:bg-white transition-colors resize-y'
              value={emailContent}
              onChange={e => setEmailContent(e.target.value)}
              placeholder='Write your email message here...'
              rows={10}
            />
            <div className='text-xs text-gray-500 mt-1'>
              Available variables: {availableVariables}
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 sm:px-6 pb-6 mt-2'>
          <Button
            className='bg-gray-100 text-gray-700 px-1.5 py-1 rounded w-full text-xs cursor-pointer'
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className='bg-blue-600 text-white px-1.5 py-1 rounded w-full flex items-center justify-center gap-2 text-xs cursor-pointer'
            onClick={handleGenerate}
          >
            {tabIndex === 0
              ? groupFilters.class && groupFilters.section
                ? `Generate Emails for Group`
                : 'Generate Emails'
              : selectedStudents.length > 0
                ? `Generate ${selectedStudents.length} Emails`
                : 'Generate Emails'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateEmailModal;
