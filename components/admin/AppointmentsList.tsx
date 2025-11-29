import React from 'react';
import { Calendar } from 'lucide-react';
import { Booking } from '@/lib/types/admin';
import type { AppointmentFilterOption } from '@/lib/types/admin';
import AppointmentRow from './AppointmentRow';

interface AppointmentsListProps {
  bookings: Booking[];
  loading: boolean;
  filter: AppointmentFilterOption;
  filterLabel: string;
  onCancel: (bookingId: string, reason: string) => Promise<void>;
  onChargeNoShow: (bookingId: string) => Promise<void>;
  chargingBookingId: string | null;
}

/**
 * Appointments list container
 * Handles loading skeleton, empty states, and list rendering
 */
export default function AppointmentsList({
  bookings,
  loading,
  filter,
  filterLabel,
  onCancel,
  onChargeNoShow,
  chargingBookingId,
}: AppointmentsListProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex gap-2 mb-3">
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  <div className="h-6 w-24 bg-gray-200 rounded-full" />
                </div>
                <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-60 bg-gray-200 rounded" />
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-2">
          <Calendar size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
        <p className="text-sm text-gray-500">
          {filter !== 'all'
            ? `No ${filterLabel.toLowerCase()} at this time.`
            : 'There are no appointments to display.'}
        </p>
      </div>
    );
  }

  // List
  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <AppointmentRow
          key={booking.id}
          booking={booking}
          onCancel={onCancel}
          onChargeNoShow={onChargeNoShow}
          isCharging={chargingBookingId === booking.id}
        />
      ))}
    </div>
  );
}
