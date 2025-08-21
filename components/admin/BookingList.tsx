import React from 'react';
import BookingCard from './BookingCard';
import { Booking } from '@/types/booking';

interface BookingListProps {
  bookings: Booking[];
  onStatusUpdate: (bookingId: string, newStatus: string) => Promise<void>;
  onCancel: (bookingId: string, reason: string) => Promise<void>;
}

const BookingList: React.FC<BookingListProps> = React.memo(({ 
  bookings, 
  onStatusUpdate, 
  onCancel 
}) => {
  if (bookings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onStatusUpdate={onStatusUpdate}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  // Only re-render if bookings array changes
  return (
    prevProps.bookings === nextProps.bookings &&
    prevProps.onStatusUpdate === nextProps.onStatusUpdate &&
    prevProps.onCancel === nextProps.onCancel
  );
});

BookingList.displayName = 'BookingList';

export default BookingList;