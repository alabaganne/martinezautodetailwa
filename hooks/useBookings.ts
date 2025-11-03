'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Booking } from '@/lib/types/admin';

// Main hook for fetching and managing bookings
export function useBookings(filters: any = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/bookings');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
      
      // Handle the response structure from Square API
      const bookingsList = data.bookings || data.data || data || [];
      setBookings(Array.isArray(bookingsList) ? bookingsList : []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bookings on mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings based on provided filters
  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    
    if (filters.status) {
      result = result.filter(booking => booking.status === filters.status);
    }
    
    const parseStartDate = (booking: Booking): Date | null => {
      const startTime = (booking as any).startAt ?? (booking as any).start_at;
      if (!startTime || typeof startTime !== 'string') {
        return null;
      }

      const parsed = new Date(startTime);
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }

      return parsed;
    };

    if (filters.startDate) {
      const minDate = new Date(filters.startDate);
      result = result.filter(booking => {
        const startDate = parseStartDate(booking);
        return startDate ? startDate >= minDate : false;
      });
    }

    if (filters.endDate) {
      const maxDate = new Date(filters.endDate);
      result = result.filter(booking => {
        const startDate = parseStartDate(booking);
        return startDate ? startDate <= maxDate : false;
      });
    }
    
    if (filters.customerId) {
      result = result.filter(booking => 
        booking.customerId === filters.customerId
      );
    }
    
    if (filters.serviceVariationId) {
      result = result.filter(booking => {
        const segments = booking.appointmentSegments;
        return segments?.some((segment: any) => 
          segment.serviceVariationId === filters.serviceVariationId
        );
      });
    }
    
    // Sort by start time
    result.sort((a, b) => {
      const dateA = parseStartDate(a)?.getTime() ?? 0;
      const dateB = parseStartDate(b)?.getTime() ?? 0;
      return dateA - dateB;
    });

    return result;
  }, [bookings, filters]);

  // Cancel booking
  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }
      
      // Refresh bookings after cancellation
      await fetchBookings();
      
      return { success: true };
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to cancel booking' 
      };
    }
  }, [fetchBookings]);

  // Refresh bookings
  const refreshBookings = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);
  
  return {
    bookings: filteredBookings,
    loading,
    error,
    count: filteredBookings.length,
    cancelBooking,
    refreshBookings
  };
}

// Convenience hooks for specific use cases
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

export function useBookingsByStatus(status: string) {
  return useBookings({ status });
}

// Export individual functions for backward compatibility
export function useCancelBooking() {
  const { cancelBooking } = useBookings();
  return cancelBooking;
}

export function useRefreshBookings() {
  const { refreshBookings } = useBookings();
  return refreshBookings;
}