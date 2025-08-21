import { useMemo } from 'react';
import { Booking, FilterType, BookingStatus } from '@/types/booking';
import { DateFilterType } from '@/components/admin/FilterBar';

interface UseBookingFiltersProps {
  bookings: Booking[];
  selectedDate: Date;
  activeStatFilter: FilterType;
  searchQuery: string;
  dateFilterType?: DateFilterType;
}

export const useBookingFilters = ({
  bookings,
  selectedDate,
  activeStatFilter,
  searchQuery,
  dateFilterType = 'custom'
}: UseBookingFiltersProps) => {
  
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    let filtered = [...bookings];
    
    // Apply stat filter or date filter
    if (activeStatFilter !== 'all') {
      switch (activeStatFilter) {
        case 'pending':
          filtered = filtered.filter(booking => 
            booking.status === BookingStatus.PENDING
          );
          break;
          
        case 'confirmed':
          filtered = filtered.filter(booking => 
            booking.status === BookingStatus.ACCEPTED
          );
          break;
      }
    } else {
      // If no stat filter is active, use the date filter type
      if (dateFilterType === 'all') {
        // Show all bookings, no date filtering
      } else if (dateFilterType === 'today') {
        const today = new Date();
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.startAt);
          return bookingDate.toDateString() === today.toDateString();
        });
      } else if (dateFilterType === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
        endOfWeek.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.startAt);
          return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
        });
      } else {
        // Custom date - use the selected date
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.startAt);
          return bookingDate.toDateString() === selectedDate.toDateString();
        });
      }
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => {
        const customerName = `${booking.customer?.given_name || ''} ${booking.customer?.family_name || ''}`.toLowerCase();
        const phone = booking.customer?.phone_number?.toLowerCase() || '';
        const email = booking.customer?.email_address?.toLowerCase() || '';
        const bookingId = booking.id.toLowerCase();
        
        return customerName.includes(query) || 
               phone.includes(query) || 
               email.includes(query) ||
               bookingId.includes(query);
      });
    }
    
    // Sort by start time (most recent first)
    filtered.sort((a, b) => {
      return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
    });
    
    return filtered;
  }, [bookings, selectedDate, activeStatFilter, searchQuery, dateFilterType]);
  
  const bookingStats = useMemo(() => {
    if (!bookings) {
      return { total: 0, today: 0, pending: 0, confirmed: 0 };
    }
    
    const today = new Date();
    const todayString = today.toDateString();
    
    return {
      total: bookings.length,
      today: bookings.filter(b => 
        new Date(b.startAt).toDateString() === todayString
      ).length,
      pending: bookings.filter(b => 
        b.status === BookingStatus.PENDING
      ).length,
      confirmed: bookings.filter(b => 
        b.status === BookingStatus.ACCEPTED
      ).length
    };
  }, [bookings]);
  
  const getFilterDescription = () => {
    const count = filteredBookings.length;
    let description = `Showing ${count} booking${count !== 1 ? 's' : ''}`;
    
    if (activeStatFilter !== 'all') {
      switch (activeStatFilter) {
        case 'pending':
          description += " with pending status";
          break;
        case 'confirmed':
          description += " with confirmed status";
          break;
      }
    } else {
      if (dateFilterType === 'all') {
        // Don't add date info for "all bookings"
      } else if (dateFilterType === 'today') {
        description += " for today";
      } else if (dateFilterType === 'week') {
        description += " for this week";
      } else {
        const dateStr = selectedDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        description += ` for ${dateStr}`;
      }
    }
    
    if (searchQuery.trim()) {
      description += ` matching "${searchQuery}"`;
    }
    
    return description;
  };
  
  return {
    filteredBookings,
    bookingStats,
    filterDescription: getFilterDescription()
  };
};