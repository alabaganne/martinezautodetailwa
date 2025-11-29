'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Booking } from '@/lib/types/admin';

interface PaginationState {
  cursor: string | null;
  hasMore: boolean;
  pageSize: number;
}

interface UseBookingsOptions {
  pageSize?: number;
  filters?: any;
}

// Main hook for fetching and managing bookings
export function useBookings(options: UseBookingsOptions = {}) {
  const { pageSize = 20, filters = {} } = options;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    cursor: null,
    hasMore: false,
    pageSize,
  });

  // Build query params from filters and pagination
  const buildQueryParams = useCallback((cursor?: string | null) => {
    const params = new URLSearchParams();
    params.set('limit', pageSize.toString());

    if (cursor) {
      params.set('cursor', cursor);
    }

    if (filters.startDate) {
      params.set('start_at_min', new Date(filters.startDate).toISOString());
    }

    if (filters.endDate) {
      params.set('start_at_max', new Date(filters.endDate).toISOString());
    }

    if (filters.customerId) {
      params.set('customer_id', filters.customerId);
    }

    if (filters.teamMemberId) {
      params.set('team_member_id', filters.teamMemberId);
    }

    return params.toString();
  }, [
    pageSize,
    filters.startDate,
    filters.endDate,
    filters.customerId,
    filters.teamMemberId,
  ]);

  // Fetch bookings from API
  const fetchBookings = useCallback(async (isRefresh = false, cursor?: string | null) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const queryParams = buildQueryParams(cursor);
      const response = await fetch(`/api/bookings?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      // Handle the response structure from Square API
      const bookingsList = data.bookings || data.data || [];
      const newBookings = Array.isArray(bookingsList) ? bookingsList : [];

      // Update pagination state
      setPagination({
        cursor: data.cursor || null,
        hasMore: data.hasMore || false,
        pageSize,
      });

      // If loading more, append to existing bookings; otherwise replace
      if (cursor) {
        setBookings(prev => [...prev, ...newBookings]);
      } else {
        setBookings(newBookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      if (!cursor) {
        setBookings([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [buildQueryParams, pageSize]);

  // Fetch bookings on mount and when filters change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Load more bookings (next page)
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || loadingMore) {
      return;
    }
    await fetchBookings(false, pagination.cursor);
  }, [pagination.hasMore, pagination.cursor, loadingMore, fetchBookings]);

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

      // Refresh bookings after cancellation (background refresh)
      await fetchBookings(true);

      return { success: true };
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to cancel booking'
      };
    }
  }, [fetchBookings]);

  // Refresh bookings (background refresh without loading skeleton)
  const refreshBookings = useCallback(async () => {
    await fetchBookings(true);
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    loadingMore,
    refreshing,
    error,
    count: bookings.length,
    hasMore: pagination.hasMore,
    cancelBooking,
    refreshBookings,
    loadMore,
  };
}

// Convenience hooks for specific use cases
export function useTodaysBookings(pageSize = 20) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useBookings({
    pageSize,
    filters: {
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString()
    }
  });
}

export function useUpcomingBookings(days = 7, pageSize = 20) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  return useBookings({
    pageSize,
    filters: {
      startDate: today.toISOString(),
      endDate: futureDate.toISOString()
    }
  });
}

export function useBookingsByStatus(status: string, pageSize = 20) {
  return useBookings({
    pageSize,
    filters: { status }
  });
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