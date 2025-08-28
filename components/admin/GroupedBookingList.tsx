import React, { useMemo } from 'react';
import BookingCard from './BookingCard';
import { Booking } from '@/lib/types/admin';
import { Calendar } from 'lucide-react';

interface GroupedBookingListProps {
  bookings: Booking[];
  onStatusUpdate: (bookingId: string, newStatus: string) => Promise<void>;
  onCancel: (bookingId: string, reason: string) => Promise<void>;
}

const GroupedBookingList: React.FC<GroupedBookingListProps> = React.memo(({ 
  bookings, 
  onStatusUpdate, 
  onCancel 
}) => {
  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.startAt);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(booking);
    });
    
    // Sort each group by time
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => 
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    });
    
    return groups;
  }, [bookings]);
  
  // Sort date keys
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedBookings).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  }, [groupedBookings]);
  
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dayLabel = '';
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayLabel = 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dayLabel = 'Yesterday';
    }
    
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return { dayLabel, formattedDate };
  };

  if (bookings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {sortedDateKeys.map((dateKey) => {
        const { dayLabel, formattedDate } = formatDateHeader(dateKey);
        const dayBookings = groupedBookings[dateKey];
        
        return (
          <div key={dateKey} className="relative">
            {/* Date Header with Enhanced Styling */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border-2 border-gray-200">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar size={16} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">
                  {formattedDate}
                </h3>
                {dayLabel && (
                  <span className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-full shadow-sm">
                    {dayLabel}
                  </span>
                )}
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-300 to-transparent"></div>
              <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200">
                {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Bookings for this date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))'
            }}>
              {dayBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onStatusUpdate={onStatusUpdate}
                  onCancel={onCancel}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.bookings === nextProps.bookings &&
    prevProps.onStatusUpdate === nextProps.onStatusUpdate &&
    prevProps.onCancel === nextProps.onCancel
  );
});

GroupedBookingList.displayName = 'GroupedBookingList';

export default GroupedBookingList;