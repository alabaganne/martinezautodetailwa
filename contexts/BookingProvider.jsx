'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BookingContext = createContext({});

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const fetchBookings = useCallback(async (force = false) => {
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const params = new URLSearchParams({
        start_at_min: today.toISOString(),
        limit: '100'
      });

      const response = await fetch(`/api/bookings?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data || []);
      setLastFetched(Date.now());
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);

  const createBooking = useCallback(async (bookingData) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const data = await response.json();
      
      // Optimistically add the new booking to state
      setBookings(prev => [...prev, data.booking]);
      
      return { success: true, booking: data.booking };
    } catch (err) {
      console.error('Error creating booking:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const updateBookingStatus = useCallback(async (bookingId, status) => {
    try {
      // For ACCEPTED status, we just update the UI since Square doesn't have an accept method
      // For DECLINED, we use the PATCH method which will cancel the booking
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      const data = await response.json();
      
      // Update the booking in state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: data.booking.status || status }
            : booking
        )
      );
      
      return { success: true, booking: data.booking };
    } catch (err) {
      console.error('Error updating booking:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId, cancellationReason) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancellation_reason: cancellationReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }

      const data = await response.json();
      
      // Update the booking in state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'CANCELLED_BY_SELLER' }
            : booking
        )
      );
      
      return { success: true, booking: data.booking };
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const refreshBookings = useCallback(() => {
    return fetchBookings(true);
  }, [fetchBookings]);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings();
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [fetchBookings]);

  const value = {
    bookings,
    loading,
    error,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    refreshBookings,
    lastFetched,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
}