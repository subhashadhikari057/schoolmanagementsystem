'use client';

import PlaceholderPage from '@/components/templates/PlaceholderPage';

export default function IdGenerationPage() {
  return (
    <PlaceholderPage
      title='Generate ID Cards'
      description='ID card generation and printing system is under development.'
      expectedFeatures={[
        'Student ID card templates',
        'Teacher ID card templates',
        'Staff ID card templates',
        'Bulk ID generation',
        'Photo upload and cropping',
        'QR code integration',
        'Print queue management',
      ]}
      backUrl='/dashboard/admin'
    />
  );
}
