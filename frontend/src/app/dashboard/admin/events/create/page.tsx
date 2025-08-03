'use client';

import PlaceholderPage from '@/components/templates/PlaceholderPage';

export default function CreateEventPage() {
  return (
    <PlaceholderPage
      title='Create New Event'
      description='Event management and scheduling system is under development.'
      expectedFeatures={[
        'Event details and description',
        'Date and time scheduling',
        'Venue and location management',
        'Participant registration',
        'Resource allocation',
        'Notification system',
        'Event calendar integration',
      ]}
      backUrl='/dashboard/admin'
    />
  );
}
