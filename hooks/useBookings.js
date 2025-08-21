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
        new Date(booking.startAt || booking.start_at) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      result = result.filter(booking => 
        new Date(booking.startAt || booking.start_at) <= new Date(filters.endDate)
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
          (segment.serviceVariationId || segment.service_variation_id) === filters.serviceVariationId
        );
      });
    }
    
    // Sort by start time
    result.sort((a, b) => new Date(a.startAt || a.start_at) - new Date(b.startAt || b.start_at));
    
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

export function useBookingStats() {
  const { bookings } = useBookingContext();
  const { bookings: todaysBookings } = useTodaysBookings();
  
  const stats = useMemo(() => {
    const now = new Date();
    
    const pending = bookings.filter(b => b.status === 'PENDING').length;
    const accepted = bookings.filter(b => b.status === 'ACCEPTED').length;
    const declined = bookings.filter(b => b.status === 'DECLINED').length;
    const cancelled = bookings.filter(b => 
      b.status === 'CANCELLED_BY_CUSTOMER' || b.status === 'CANCELLED_BY_SELLER'
    ).length;
    const noShow = bookings.filter(b => b.status === 'NO_SHOW').length;
    
    const todaysPending = todaysBookings.filter(b => b.status === 'PENDING').length;
    const todaysAccepted = todaysBookings.filter(b => b.status === 'ACCEPTED').length;
    const todaysCompleted = todaysBookings.filter(b => 
      new Date(b.startAt || b.start_at) < now && b.status === 'ACCEPTED'
    ).length;
    
    const upcomingToday = todaysBookings.filter(b => 
      new Date(b.startAt || b.start_at) > now && 
      (b.status === 'ACCEPTED' || b.status === 'PENDING')
    ).length;
    
    return {
      total: bookings.length,
      pending,
      accepted,
      declined,
      cancelled,
      noShow,
      today: {
        total: todaysBookings.length,
        pending: todaysPending,
        accepted: todaysAccepted,
        completed: todaysCompleted,
        upcoming: upcomingToday
      }
    };
  }, [bookings, todaysBookings]);
  
  return stats;
}

export function useBookingById(bookingId) {
  const { bookings, loading, error } = useBookingContext();
  
  const booking = useMemo(() => {
    return bookings.find(b => b.id === bookingId);
  }, [bookings, bookingId]);
  
  return {
    booking,
    loading,
    error,
    found: !!booking
  };
}

export function useNextBooking() {
  const { bookings, loading, error } = useBookingContext();
  
  const nextBooking = useMemo(() => {
    const now = new Date();
    const futureBookings = bookings.filter(b => 
      new Date(b.startAt || b.start_at) > now && 
      (b.status === 'ACCEPTED' || b.status === 'PENDING')
    );
    
    futureBookings.sort((a, b) => new Date(a.startAt || a.start_at) - new Date(b.startAt || b.start_at));
    
    return futureBookings[0] || null;
  }, [bookings]);
  
  return {
    booking: nextBooking,
    loading,
    error
  };
}