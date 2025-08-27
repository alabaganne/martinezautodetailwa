'use client'

import { useMemo } from 'react';
import { useBookingContext } from '@/contexts/BookingProvider';

export function useBookings(filters = {}) {
  const { bookings, loading, error } = useBookingContext();
  
  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    
    if (filters.status) {
      result = result.filter(booking => booking.status === filters.status);
    }
    
    if (filters.startDate) {
      result = result.filter(booking => 
        new Date(booking.startAt) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      result = result.filter(booking => 
        new Date(booking.startAt) <= new Date(filters.endDate)
      );
    }
    
    if (filters.customerId) {
      result = result.filter(booking => 
        (booking.customerId || booking.customer_id) === filters.customerId
      );
    }
    
    if (filters.serviceVariationId) {
      result = result.filter(booking => {
        const segments = booking.appointmentSegments || booking.appointment_segments;
        return segments?.some(segment => 
          (segment.serviceVariationId) === filters.serviceVariationId
        );
      });
    }
    
    // Sort by start time
    result.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    
    return result;
  }, [bookings, filters]);
  
  return {
    bookings: filteredBookings,
    loading,
    error,
    count: filteredBookings.length
  };
}

export function useTodaysBookings() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return useBookings({
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString()
  });
}

export function useUpcomingBookings(days = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);
  
  return useBookings({
    startDate: today.toISOString(),
    endDate: futureDate.toISOString()
  });
}

export function useBookingsByStatus(status) {
  return useBookings({ status });
}

export function useCreateBooking() {
  const { createBooking } = useBookingContext();
  return createBooking;
}

export function useUpdateBookingStatus() {
  const { updateBookingStatus } = useBookingContext();
  return updateBookingStatus;
}

export function useCancelBooking() {
  const { cancelBooking } = useBookingContext();
  return cancelBooking;
}

export function useRefreshBookings() {
  const { refreshBookings } = useBookingContext();
  return refreshBookings;
}