import { Clock, MapPin, MoreVertical } from 'lucide-react';
import StatusBadge from "@/components/atoms/data/StatusBadge";
import { Event } from '@/types/EventTypes';

export default function EventItem({ event }: { event: Event }) {
  const [day, month] = event.date.split(' ');

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors group">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{day}</div>
        <div className="text-sm text-gray-500 uppercase">{month}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
          <div className="flex items-center gap-2">
            <StatusBadge status={event.status} />
            {/* Menu code same as before */}
          </div>
        </div>
        <div className="space-y-1 text-sm text-gray-500">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> <span>{event.time}</span></div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> <span>{event.location}</span></div>
        </div>
      </div>
    </div>
  );
}



