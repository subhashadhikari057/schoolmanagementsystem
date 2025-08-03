'use client';

import PlaceholderPage from '@/components/templates/PlaceholderPage';

export default function AddStudentPage() {
  return (
    <PlaceholderPage
      title='Add New Student'
      description='Student registration and enrollment system is under development.'
      expectedFeatures={[
        'Student personal information form',
        'Guardian/parent details',
        'Academic history and records',
        'Fee structure assignment',
        'Class and section allocation',
        'Document upload system',
        'ID card generation',
      ]}
      backUrl='/dashboard/admin'
    />
  );
}
