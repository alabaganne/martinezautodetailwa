'use client';

import React, { useState, useEffect } from 'react';
import { useBookings } from '@/hooks/useBookings';
import AdminHeader from '@/components/admin/AdminHeader';
import AppointmentFilters from '@/components/admin/AppointmentFilters';
import AppointmentsList from '@/components/admin/AppointmentsList';
import ChargeResultNotification from '@/components/admin/ChargeResultNotification';
import { isNoShowEligible } from '@/lib/utils/noShow';
import type {
  AppointmentFilterOption,
  ChargeNotification,
} from '@/lib/types/admin';

export default function AppointmentsPage() {
  // State
  const [filter, setFilter] = useState<AppointmentFilterOption>('all');
  const [chargingBookingId, setChargingBookingId] = useState<string | null>(null);
  const [chargeResult, setChargeResult] = useState<ChargeNotification | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data fetching
  const { bookings, loading, error, cancelBooking, refreshBookings } = useBookings();

  // Auto-hide charge result after 5 seconds
  useEffect(() => {
    if (chargeResult) {
      const timer = setTimeout(() => setChargeResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [chargeResult]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBookings();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancel = async (bookingId: string, reason: string) => {
    const result = await cancelBooking(bookingId, reason);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const handleChargeNoShow = async (bookingId: string) => {
    setChargingBookingId(bookingId);
    setChargeResult(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/charge-no-show`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to charge no-show fee');
      }

      const feeAmount = (parseInt(data.noShowFeeAmount, 10) / 100).toFixed(2);
      setChargeResult({
        type: 'success',
        message: `Successfully charged $${feeAmount} no-show fee`,
      });

      await refreshBookings();
    } catch (error) {
      setChargeResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to charge no-show fee',
      });
    } finally {
      setChargingBookingId(null);
    }
  };

  // Business logic: filtering and sorting
  const filteredBookings = bookings.filter((booking) => {
    switch (filter) {
      case 'no-show-eligible':
        return isNoShowEligible(booking);
      case 'accepted':
        return booking.status === 'ACCEPTED';
      case 'pending':
        return booking.status === 'PENDING';
      case 'cancelled':
        return (
          booking.status === 'CANCELLED_BY_CUSTOMER' ||
          booking.status === 'CANCELLED_BY_SELLER'
        );
      default:
        return true;
    }
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
  });

  const noShowEligibleCount = bookings.filter((b) => isNoShowEligible(b)).length;

  const filterLabels: Record<AppointmentFilterOption, string> = {
    all: 'All Appointments',
    'no-show-eligible': 'No-Show Eligible',
    accepted: 'Accepted',
    pending: 'Pending',
    cancelled: 'Cancelled',
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <AdminHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Appointments</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen">
      <AdminHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <ChargeResultNotification
        result={chargeResult}
        onDismiss={() => setChargeResult(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sortedBookings.length} appointment{sortedBookings.length !== 1 ? 's' : ''}
            {noShowEligibleCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                ({noShowEligibleCount} no-show eligible)
              </span>
            )}
          </p>
        </div>

        <AppointmentFilters
          filter={filter}
          onFilterChange={setFilter}
          noShowEligibleCount={noShowEligibleCount}
        />
      </div>

      <AppointmentsList
        bookings={sortedBookings}
        loading={loading}
        filter={filter}
        filterLabel={filterLabels[filter]}
        onCancel={handleCancel}
        onChargeNoShow={handleChargeNoShow}
        chargingBookingId={chargingBookingId}
      />
    </div>
  );
}
