# Calendar Components

This folder contains all calendar-related components with a clean, organized structure.

## 📁 Folder Structure

```
calendar/
├── components/           # Sub-components
│   └── AddEventModal.tsx     # Modal for adding events
├── hooks/               # Custom hooks
│   └── useCalendarEvents.ts  # Hook for calendar API integration
├── types/               # Type definitions
│   └── calendar.types.ts     # Local calendar types
├── AcademicCalendar.tsx      # Main calendar view component
├── CalendarManagement.tsx    # Admin management interface
├── index.ts                  # Main exports
└── README.md                 # This file
```

## 🚀 Usage

### Basic Calendar Usage

```tsx
import { AcademicCalendar } from '@/components/organisms/calendar';

export default function CalendarPage() {
  return <AcademicCalendar showActionButtons={true} showExportButton={true} />;
}
```

### Calendar Management (Admin)

```tsx
import { CalendarManagement } from '@/components/organisms/calendar';

export default function AdminCalendarPage() {
  return <CalendarManagement />;
}
```

### Using the Add Event Modal

```tsx
import { AddEventModal } from '@/components/organisms/calendar';

export default function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Add Event</button>

      <AddEventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEventCreated={() => {
          // Handle event creation
          setShowModal(false);
        }}
      />
    </div>
  );
}
```

### Using the Calendar Hook

```tsx
import { useCalendarEvents } from '@/components/organisms/calendar';

export default function MyCalendarComponent() {
  const {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
  } = useCalendarEvents({
    page: 1,
    limit: 20,
    isPublished: true,
  });

  // Use the events and methods as needed
}
```

## 🎯 Features

- ✅ **Clean Architecture**: Organized components, hooks, and types
- ✅ **Type Safety**: Full TypeScript support with shared types
- ✅ **API Integration**: Complete backend integration with error handling
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Real-time Updates**: Automatic refresh after operations
- ✅ **Multiple Calendar Types**: Support for Events, Holidays, and Reminders
- ✅ **Dual Calendar System**: Both BS (Bikram Sambat) and AD (Gregorian) support
- ✅ **Admin Management**: Full CRUD operations for administrators

## 🔧 Backend Integration

The calendar components are fully integrated with the backend API:

- **Create Events**: POST /api/calendar
- **List Events**: GET /api/calendar
- **Update Events**: PATCH /api/calendar/:id
- **Delete Events**: DELETE /api/calendar/:id
- **Bulk Operations**: POST /api/calendar/bulk
- **Statistics**: GET /api/calendar/statistics

## 📝 Event Types

1. **Events** 📅
   - Venue and timing support
   - All-day event option
   - Custom descriptions

2. **Holidays** 🎉
   - National, School, Religious, Cultural types
   - Automatic weekend highlighting

3. **Reminders** ⚠️
   - Priority levels (Low, Medium, High, Urgent)
   - Different reminder types (Exam, Fee, Assignment, etc.)

## 🎨 Customization

All components support customization through props and can be styled using Tailwind CSS classes.
