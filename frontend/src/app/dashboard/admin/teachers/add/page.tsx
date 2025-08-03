'use client';

import PlaceholderPage from '@/components/templates/PlaceholderPage';

export default function AddTeacherPage() {
  return (
    <PlaceholderPage
      title='Add New Teacher'
      description='Teacher registration and onboarding system is under development.'
      expectedFeatures={[
        'Teacher personal information form',
        'Qualification and experience details',
        'Subject specialization assignment',
        'Salary and benefits configuration',
        'Class assignment and timetable',
        'Document verification system',
        'Employee ID generation',
      ]}
      backUrl='/dashboard/admin'
    />
  );
}
